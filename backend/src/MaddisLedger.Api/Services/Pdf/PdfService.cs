using MaddisLedger.Api.Data;
using MaddisLedger.Api.Entities;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;

namespace MaddisLedger.Api.Services.Pdf;

public class PdfService
{
    private readonly AppDbContext _db;
    private readonly AppRuntimeConfig _config;

    public PdfService(AppDbContext db, AppRuntimeConfig config)
    {
        _db = db;
        _config = config;
    }

    public async Task<string> GenerateInvoicePdfAsync(int invoiceId)
    {
        var invoice = await _db.Invoices
            .Include(i => i.LineItems)
            .FirstAsync(i => i.Id == invoiceId);
        var profile = await GetBusinessProfileAsync();

        var directory = Path.Combine(_config.DataDirectory, "pdfs", "invoices");
        Directory.CreateDirectory(directory);
        var path = Path.Combine(directory, $"{invoice.InvoiceNumber}.pdf");

        new InvoicePdfDocument(invoice, profile).GeneratePdf(path);

        invoice.PdfPath = path;
        await _db.SaveChangesAsync();

        return path;
    }

    public async Task<string> GenerateDeliveryNotePdfAsync(int deliveryNoteId)
    {
        var deliveryNote = await _db.DeliveryNotes
            .Include(d => d.LineItems)
            .Include(d => d.Customer)
            .Include(d => d.Invoice)
            .FirstAsync(d => d.Id == deliveryNoteId);
        var profile = await GetBusinessProfileAsync();

        var directory = Path.Combine(_config.DataDirectory, "pdfs", "delivery-notes");
        Directory.CreateDirectory(directory);
        var path = Path.Combine(directory, $"{deliveryNote.DeliveryNoteNumber}.pdf");

        new DeliveryNotePdfDocument(deliveryNote, profile).GeneratePdf(path);

        deliveryNote.PdfPath = path;
        await _db.SaveChangesAsync();

        return path;
    }

    private async Task<BusinessProfile> GetBusinessProfileAsync() =>
        await _db.BusinessProfiles.FirstAsync();
}
