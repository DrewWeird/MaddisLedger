namespace MaddisLedger.Api.Entities;

// A financial record only — an invoice Maddi *receives* from a supplier. No stock effect, no
// numbering sequence (SupplierReference is the supplier's own invoice number, free text), no PDF.
public class SupplierInvoice
{
    public int Id { get; set; }
    public int SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public string SupplierReference { get; set; } = string.Empty;
    public DateTime IssueDate { get; set; }
    public decimal Total { get; set; }
    public string? Description { get; set; }
    public DocumentStatus Status { get; set; } = DocumentStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? VoidedAt { get; set; }
    public string? VoidReason { get; set; }

    public List<SupplierPayment> Payments { get; set; } = new();
}
