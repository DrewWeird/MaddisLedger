using MaddisLedger.Api.Data;
using MaddisLedger.Api.Dtos;
using MaddisLedger.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace MaddisLedger.Api.Services;

public class SupplierInvoiceService
{
    private readonly AppDbContext _db;

    public SupplierInvoiceService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<List<SupplierInvoiceSummaryDto>> ListAsync(int? supplierId, string? status, DateTime? from, DateTime? to)
    {
        var query = _db.SupplierInvoices.AsNoTracking().Include(si => si.Supplier).Include(si => si.Payments).AsQueryable();

        if (supplierId.HasValue) query = query.Where(si => si.SupplierId == supplierId.Value);
        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<DocumentStatus>(status, true, out var parsedStatus))
            query = query.Where(si => si.Status == parsedStatus);
        if (from.HasValue) query = query.Where(si => si.IssueDate >= from.Value);
        if (to.HasValue) query = query.Where(si => si.IssueDate <= to.Value);

        var invoices = await query
            .OrderByDescending(si => si.IssueDate).ThenByDescending(si => si.Id)
            .ToListAsync();

        return invoices.Select(ToSummaryDto).ToList();
    }

    public async Task<SupplierInvoiceDto> GetAsync(int id)
    {
        var invoice = await LoadAsync(id);
        return ToDto(invoice);
    }

    public async Task<SupplierInvoiceDto> CreateAsync(CreateSupplierInvoiceDto dto)
    {
        if (dto.Total <= 0)
            throw new DomainException("Total must be greater than zero.");

        var supplier = await _db.Suppliers.FindAsync(dto.SupplierId)
            ?? throw DomainException.NotFound("Supplier", dto.SupplierId);

        var invoice = new SupplierInvoice
        {
            SupplierId = supplier.Id,
            SupplierReference = dto.SupplierReference,
            IssueDate = dto.IssueDate,
            Total = dto.Total,
            Description = dto.Description,
            Status = DocumentStatus.Active
        };

        _db.SupplierInvoices.Add(invoice);
        await _db.SaveChangesAsync();

        return await GetAsync(invoice.Id);
    }

    public async Task<SupplierInvoiceDto> RecordPaymentAsync(int supplierInvoiceId, CreateSupplierPaymentDto dto)
    {
        if (dto.Amount <= 0)
            throw new DomainException("Payment amount must be greater than zero.");

        var invoice = await LoadAsync(supplierInvoiceId);

        if (invoice.Status != DocumentStatus.Active)
            throw new DomainException("Cannot record a payment against a voided supplier invoice.");

        var alreadyPaid = invoice.Payments.Sum(p => p.Amount);
        var outstanding = invoice.Total - alreadyPaid;

        if (dto.Amount > outstanding)
            throw new DomainException($"Cannot record a payment of {dto.Amount} — only {outstanding} is outstanding on this supplier invoice.");

        invoice.Payments.Add(new SupplierPayment
        {
            SupplierInvoiceId = invoice.Id,
            PaymentDate = dto.PaymentDate,
            Amount = dto.Amount,
            Notes = dto.Notes
        });

        await _db.SaveChangesAsync();

        return await GetAsync(invoice.Id);
    }

    public async Task<SupplierInvoiceDto> VoidAsync(int id, VoidDocumentDto dto)
    {
        var invoice = await LoadAsync(id);

        if (invoice.Status == DocumentStatus.Voided)
            throw new DomainException("Supplier invoice is already voided.");

        if (invoice.Payments.Count > 0)
            throw new DomainException("Cannot void a supplier invoice that has payments recorded against it.");

        invoice.Status = DocumentStatus.Voided;
        invoice.VoidedAt = DateTime.UtcNow;
        invoice.VoidReason = dto.Reason;

        await _db.SaveChangesAsync();

        return await GetAsync(invoice.Id);
    }

    private async Task<SupplierInvoice> LoadAsync(int id)
    {
        return await _db.SupplierInvoices
            .Include(si => si.Supplier)
            .Include(si => si.Payments)
            .FirstOrDefaultAsync(si => si.Id == id)
            ?? throw DomainException.NotFound("SupplierInvoice", id);
    }

    private static SupplierInvoiceSummaryDto ToSummaryDto(SupplierInvoice si)
    {
        var paid = si.Payments.Sum(p => p.Amount);
        return new SupplierInvoiceSummaryDto(
            si.Id, si.SupplierId, si.Supplier!.Name, si.SupplierReference, si.IssueDate, si.Status.ToString(),
            si.Total, paid, si.Total - paid);
    }

    private static SupplierInvoiceDto ToDto(SupplierInvoice si)
    {
        var paid = si.Payments.Sum(p => p.Amount);
        var payments = si.Payments
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => new SupplierPaymentDto(p.Id, p.PaymentDate, p.Amount, p.Notes))
            .ToList();

        return new SupplierInvoiceDto(
            si.Id, si.SupplierId, si.Supplier!.Name, si.SupplierReference, si.IssueDate, si.Status.ToString(),
            si.Total, si.Description, si.CreatedAt, paid, si.Total - paid, payments);
    }
}
