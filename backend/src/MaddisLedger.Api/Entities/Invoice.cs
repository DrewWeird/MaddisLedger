namespace MaddisLedger.Api.Entities;

public class Invoice
{
    public int Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public string CustomerNameSnapshot { get; set; } = string.Empty;
    public string? CustomerAddressSnapshot { get; set; }
    public DateTime IssueDate { get; set; }
    public DocumentStatus Status { get; set; } = DocumentStatus.Active;
    public decimal Total { get; set; }
    public CurrencyCode Currency { get; set; } = CurrencyCode.ZAR;
    // "ZAR per 1 unit of Currency" — always 1 for ZAR invoices. Snapshotted at creation time so
    // historical invoices/reports never change when the live rate moves later.
    public decimal ExchangeRateToZar { get; set; } = 1;
    public DateTime? ExchangeRateAsOf { get; set; }
    public string? Notes { get; set; }
    public string? PdfPath { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? VoidedAt { get; set; }
    public string? VoidReason { get; set; }

    public List<InvoiceLineItem> LineItems { get; set; } = new();
    public List<DeliveryNote> DeliveryNotes { get; set; } = new();
}
