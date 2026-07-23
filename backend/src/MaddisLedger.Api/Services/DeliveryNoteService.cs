using MaddisLedger.Api.Data;
using MaddisLedger.Api.Dtos;
using MaddisLedger.Api.Entities;
using MaddisLedger.Api.Services.Numbering;
using MaddisLedger.Api.Services.Pdf;
using Microsoft.EntityFrameworkCore;

namespace MaddisLedger.Api.Services;

public class DeliveryNoteService
{
    private readonly AppDbContext _db;
    private readonly NumberingService _numbering;
    private readonly PdfService _pdf;
    private readonly InvoiceService _invoiceService;

    public DeliveryNoteService(AppDbContext db, NumberingService numbering, PdfService pdf, InvoiceService invoiceService)
    {
        _db = db;
        _numbering = numbering;
        _pdf = pdf;
        _invoiceService = invoiceService;
    }

    public async Task<List<DeliveryNoteSummaryDto>> ListAsync(int? invoiceId, int? customerId)
    {
        var query = _db.DeliveryNotes.AsNoTracking().Include(d => d.Invoice).AsQueryable();

        if (invoiceId.HasValue) query = query.Where(d => d.InvoiceId == invoiceId.Value);
        if (customerId.HasValue) query = query.Where(d => d.CustomerId == customerId.Value);

        return await query
            .OrderByDescending(d => d.DeliveryDate).ThenByDescending(d => d.Id)
            .Select(d => new DeliveryNoteSummaryDto(d.Id, d.DeliveryNoteNumber, d.InvoiceId, d.Invoice!.InvoiceNumber, d.Customer!.Name, d.DeliveryDate, d.Status.ToString()))
            .ToListAsync();
    }

    public async Task<DeliveryNoteDto> GetAsync(int id)
    {
        var note = await LoadDeliveryNoteAsync(id);
        return MapToDto(note);
    }

    public async Task<List<DeliverableLineDto>> GetDeliverableLinesAsync(int invoiceId) =>
        await _invoiceService.GetDeliverableLinesAsync(invoiceId);

    public async Task<DeliveryNoteDto> CreateAsync(CreateDeliveryNoteDto dto)
    {
        if (dto.LineItems.Count == 0)
            throw new DomainException("A delivery note must have at least one line item.");

        var invoice = await _db.Invoices
            .Include(i => i.LineItems).ThenInclude(l => l.DeliveryNoteLineItems).ThenInclude(dl => dl.DeliveryNote)
            .FirstOrDefaultAsync(i => i.Id == dto.InvoiceId)
            ?? throw DomainException.NotFound("Invoice", dto.InvoiceId);

        if (invoice.Status != DocumentStatus.Active)
            throw new DomainException("Cannot create a delivery note from a voided invoice.");

        await using var transaction = await _db.Database.BeginTransactionAsync();

        var deliveryNoteNumber = await _numbering.NextNumberAsync("DN", "DN");

        var deliveryNote = new DeliveryNote
        {
            DeliveryNoteNumber = deliveryNoteNumber,
            InvoiceId = invoice.Id,
            CustomerId = invoice.CustomerId,
            DeliveryDate = dto.DeliveryDate,
            Notes = dto.Notes,
            Status = DocumentStatus.Active
        };

        var sortOrder = 0;

        foreach (var requestedLine in dto.LineItems)
        {
            if (requestedLine.QuantityDelivered <= 0)
                throw new DomainException("Delivered quantity must be greater than zero.");

            var invoiceLine = invoice.LineItems.FirstOrDefault(l => l.Id == requestedLine.InvoiceLineItemId)
                ?? throw new DomainException($"Invoice line item '{requestedLine.InvoiceLineItemId}' does not belong to invoice '{invoice.InvoiceNumber}'.");

            var alreadyDelivered = invoiceLine.DeliveryNoteLineItems
                .Where(dl => dl.DeliveryNote!.Status == DocumentStatus.Active)
                .Sum(dl => dl.QuantityDelivered);
            var remaining = invoiceLine.Quantity - alreadyDelivered;

            if (requestedLine.QuantityDelivered > remaining)
                throw new DomainException(
                    $"Cannot deliver {requestedLine.QuantityDelivered} of '{invoiceLine.DescriptionSnapshot}' — only {remaining} remain undelivered on invoice '{invoice.InvoiceNumber}'.");

            deliveryNote.LineItems.Add(new DeliveryNoteLineItem
            {
                InvoiceLineItemId = invoiceLine.Id,
                DescriptionSnapshot = invoiceLine.DescriptionSnapshot,
                QuantityDelivered = requestedLine.QuantityDelivered,
                SortOrder = sortOrder++
            });
        }

        _db.DeliveryNotes.Add(deliveryNote);
        await _db.SaveChangesAsync();
        await transaction.CommitAsync();

        await _pdf.GenerateDeliveryNotePdfAsync(deliveryNote.Id);

        return await GetAsync(deliveryNote.Id);
    }

    public async Task<DeliveryNoteDto> VoidAsync(int id, VoidDocumentDto dto)
    {
        var note = await LoadDeliveryNoteAsync(id);

        if (note.Status == DocumentStatus.Voided)
            throw new DomainException("Delivery note is already voided.");

        note.Status = DocumentStatus.Voided;
        note.VoidedAt = DateTime.UtcNow;
        note.VoidReason = dto.Reason;

        await _db.SaveChangesAsync();

        return MapToDto(note);
    }

    public async Task<string> RegeneratePdfAsync(int id)
    {
        await LoadDeliveryNoteAsync(id);
        return await _pdf.GenerateDeliveryNotePdfAsync(id);
    }

    private async Task<DeliveryNote> LoadDeliveryNoteAsync(int id)
    {
        return await _db.DeliveryNotes
            .Include(d => d.LineItems)
            .Include(d => d.Invoice)
            .Include(d => d.Customer)
            .FirstOrDefaultAsync(d => d.Id == id)
            ?? throw DomainException.NotFound("DeliveryNote", id);
    }

    private static DeliveryNoteDto MapToDto(DeliveryNote note)
    {
        var lineItems = note.LineItems
            .OrderBy(l => l.SortOrder)
            .Select(l => new DeliveryNoteLineItemDto(l.Id, l.InvoiceLineItemId, l.DescriptionSnapshot, l.QuantityDelivered))
            .ToList();

        return new DeliveryNoteDto(
            note.Id, note.DeliveryNoteNumber, note.InvoiceId, note.Invoice!.InvoiceNumber, note.CustomerId,
            note.Customer!.Name, note.DeliveryDate, note.Status.ToString(), note.Notes, note.PdfPath, note.CreatedAt, lineItems);
    }
}
