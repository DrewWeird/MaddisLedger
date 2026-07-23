namespace MaddisLedger.Api.Entities;

public class DeliveryNote
{
    public int Id { get; set; }
    public string DeliveryNoteNumber { get; set; } = string.Empty;
    public int InvoiceId { get; set; }
    public Invoice? Invoice { get; set; }
    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public DateTime DeliveryDate { get; set; }
    public string? Notes { get; set; }
    public string? PdfPath { get; set; }
    public DocumentStatus Status { get; set; } = DocumentStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? VoidedAt { get; set; }
    public string? VoidReason { get; set; }

    public List<DeliveryNoteLineItem> LineItems { get; set; } = new();
}
