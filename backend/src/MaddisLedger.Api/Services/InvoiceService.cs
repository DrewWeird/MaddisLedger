using MaddisLedger.Api.Data;
using MaddisLedger.Api.Dtos;
using MaddisLedger.Api.Entities;
using MaddisLedger.Api.Services.Numbering;
using MaddisLedger.Api.Services.Pdf;
using Microsoft.EntityFrameworkCore;

namespace MaddisLedger.Api.Services;

public class InvoiceService
{
    private readonly AppDbContext _db;
    private readonly NumberingService _numbering;
    private readonly PdfService _pdf;

    public InvoiceService(AppDbContext db, NumberingService numbering, PdfService pdf)
    {
        _db = db;
        _numbering = numbering;
        _pdf = pdf;
    }

    public async Task<List<InvoiceSummaryDto>> ListAsync(int? customerId, string? status, DateTime? from, DateTime? to)
    {
        var query = _db.Invoices.AsNoTracking().AsQueryable();

        if (customerId.HasValue) query = query.Where(i => i.CustomerId == customerId.Value);
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<DocumentStatus>(status, true, out var parsedStatus))
            query = query.Where(i => i.Status == parsedStatus);
        if (from.HasValue) query = query.Where(i => i.IssueDate >= from.Value);
        if (to.HasValue) query = query.Where(i => i.IssueDate <= to.Value);

        return await query
            .OrderByDescending(i => i.IssueDate).ThenByDescending(i => i.Id)
            .Select(i => new InvoiceSummaryDto(i.Id, i.InvoiceNumber, i.CustomerId, i.CustomerNameSnapshot, i.IssueDate, i.Status.ToString(), i.Total))
            .ToListAsync();
    }

    public async Task<InvoiceDto> GetAsync(int id)
    {
        var invoice = await LoadInvoiceAsync(id);
        return await MapToDtoAsync(invoice);
    }

    public async Task<InvoiceDto> CreateAsync(CreateInvoiceDto dto)
    {
        if (dto.LineItems.Count == 0)
            throw new DomainException("An invoice must have at least one line item.");

        var customer = await _db.Customers.FindAsync(dto.CustomerId)
            ?? throw DomainException.NotFound("Customer", dto.CustomerId);

        await using var transaction = await _db.Database.BeginTransactionAsync();

        var invoiceNumber = await _numbering.NextNumberAsync("INV", "INV");

        var invoice = new Invoice
        {
            InvoiceNumber = invoiceNumber,
            CustomerId = customer.Id,
            CustomerNameSnapshot = customer.Name,
            CustomerAddressSnapshot = FormatCustomerAddress(customer),
            IssueDate = dto.IssueDate,
            Notes = dto.Notes,
            Status = DocumentStatus.Active
        };

        var sortOrder = 0;
        decimal total = 0;

        foreach (var line in dto.LineItems)
        {
            if (line.Quantity <= 0)
                throw new DomainException("Line item quantity must be greater than zero.");

            var stockItem = await _db.StockItems.FindAsync(line.StockItemId)
                ?? throw DomainException.NotFound("StockItem", line.StockItemId);

            var lineTotal = line.UnitPrice * line.Quantity;
            total += lineTotal;

            invoice.LineItems.Add(new InvoiceLineItem
            {
                StockItemId = stockItem.Id,
                DescriptionSnapshot = FormatStockItemDescription(stockItem),
                UnitPriceSnapshot = line.UnitPrice,
                Quantity = line.Quantity,
                LineTotal = lineTotal,
                SortOrder = sortOrder++
            });

            // Overselling is allowed (e.g. custom/pre-orders baked after the sale is invoiced), so
            // stock is simply decremented — it may go negative — never blocked here.
            stockItem.QuantityOnHand -= line.Quantity;
            stockItem.UpdatedAt = DateTime.UtcNow;
        }

        invoice.Total = total;

        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        await _pdf.GenerateInvoicePdfAsync(invoice.Id);

        return await GetAsync(invoice.Id);
    }

    public async Task<InvoiceDto> VoidAsync(int id, VoidDocumentDto dto)
    {
        var invoice = await LoadInvoiceAsync(id);

        if (invoice.Status == DocumentStatus.Voided)
            throw new DomainException("Invoice is already voided.");

        var hasActiveDeliveryNotes = invoice.DeliveryNotes.Any(d => d.Status == DocumentStatus.Active);
        if (hasActiveDeliveryNotes)
            throw new DomainException("Cannot void an invoice that has active delivery notes. Void those first.");

        await using var transaction = await _db.Database.BeginTransactionAsync();

        foreach (var line in invoice.LineItems)
        {
            var stockItem = await _db.StockItems.FindAsync(line.StockItemId);
            if (stockItem is not null)
            {
                stockItem.QuantityOnHand += line.Quantity;
                stockItem.UpdatedAt = DateTime.UtcNow;
            }
        }

        invoice.Status = DocumentStatus.Voided;
        invoice.VoidedAt = DateTime.UtcNow;
        invoice.VoidReason = dto.Reason;

        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        return await GetAsync(invoice.Id);
    }

    public async Task<string> RegeneratePdfAsync(int id)
    {
        await LoadInvoiceAsync(id);
        return await _pdf.GenerateInvoicePdfAsync(id);
    }

    public async Task<List<DeliverableLineDto>> GetDeliverableLinesAsync(int invoiceId)
    {
        var invoice = await LoadInvoiceAsync(invoiceId);

        return invoice.LineItems
            .OrderBy(l => l.SortOrder)
            .Select(l =>
            {
                var delivered = l.DeliveryNoteLineItems
                    .Where(dl => dl.DeliveryNote!.Status == DocumentStatus.Active)
                    .Sum(dl => dl.QuantityDelivered);
                return new DeliverableLineDto(l.Id, l.DescriptionSnapshot, l.Quantity, delivered, l.Quantity - delivered);
            })
            .ToList();
    }

    private async Task<Invoice> LoadInvoiceAsync(int id)
    {
        return await _db.Invoices
            .Include(i => i.LineItems).ThenInclude(l => l.DeliveryNoteLineItems).ThenInclude(dl => dl.DeliveryNote)
            .Include(i => i.DeliveryNotes)
            .FirstOrDefaultAsync(i => i.Id == id)
            ?? throw DomainException.NotFound("Invoice", id);
    }

    private async Task<InvoiceDto> MapToDtoAsync(Invoice invoice)
    {
        var lineItems = invoice.LineItems
            .OrderBy(l => l.SortOrder)
            .Select(l =>
            {
                var delivered = l.DeliveryNoteLineItems
                    .Where(dl => dl.DeliveryNote!.Status == DocumentStatus.Active)
                    .Sum(dl => dl.QuantityDelivered);
                return new InvoiceLineItemDto(l.Id, l.StockItemId, l.DescriptionSnapshot, l.UnitPriceSnapshot, l.Quantity, l.LineTotal, delivered, l.Quantity - delivered);
            })
            .ToList();

        return new InvoiceDto(
            invoice.Id, invoice.InvoiceNumber, invoice.CustomerId, invoice.CustomerNameSnapshot,
            invoice.CustomerAddressSnapshot, invoice.IssueDate, invoice.Status.ToString(), invoice.Total,
            invoice.Notes, invoice.PdfPath, invoice.CreatedAt, lineItems);
    }

    private static string FormatCustomerAddress(Customer customer)
    {
        var parts = new[] { customer.AddressLine1, customer.AddressLine2, customer.City, customer.PostalCode }
            .Where(p => !string.IsNullOrWhiteSpace(p));
        return string.Join(", ", parts);
    }

    private static string FormatStockItemDescription(StockItem stockItem)
    {
        var parts = new[] { stockItem.Category, stockItem.Name, stockItem.Size }
            .Where(p => !string.IsNullOrWhiteSpace(p));
        return string.Join(" - ", parts);
    }
}
