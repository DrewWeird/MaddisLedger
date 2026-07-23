namespace MaddisLedger.Api.Entities;

public class InvoiceLineItem
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    public Invoice? Invoice { get; set; }
    public int StockItemId { get; set; }
    public StockItem? StockItem { get; set; }
    public string DescriptionSnapshot { get; set; } = string.Empty;
    public decimal UnitPriceSnapshot { get; set; }
    public int Quantity { get; set; }
    public decimal LineTotal { get; set; }
    public int SortOrder { get; set; }

    public List<DeliveryNoteLineItem> DeliveryNoteLineItems { get; set; } = new();
}
