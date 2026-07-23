namespace MaddisLedger.Api.Entities;

public class SupplierPayment
{
    public int Id { get; set; }
    public int SupplierInvoiceId { get; set; }
    public SupplierInvoice? SupplierInvoice { get; set; }
    public DateTime PaymentDate { get; set; }
    public decimal Amount { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
