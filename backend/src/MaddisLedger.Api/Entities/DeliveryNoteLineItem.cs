namespace MaddisLedger.Api.Entities;

public class DeliveryNoteLineItem
{
    public int Id { get; set; }
    public int DeliveryNoteId { get; set; }
    public DeliveryNote? DeliveryNote { get; set; }
    public int InvoiceLineItemId { get; set; }
    public InvoiceLineItem? InvoiceLineItem { get; set; }
    public string DescriptionSnapshot { get; set; } = string.Empty;
    public int QuantityDelivered { get; set; }
    public int SortOrder { get; set; }
}
