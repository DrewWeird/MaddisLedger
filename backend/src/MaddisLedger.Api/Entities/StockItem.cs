namespace MaddisLedger.Api.Entities;

public class StockItem
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Size { get; set; }
    public decimal UnitPrice { get; set; }
    // What the item costs Maddi to make/procure — internal only, never shown on customer-facing documents.
    public decimal CostPrice { get; set; }
    public int QuantityOnHand { get; set; }
    public int QuantityOnOrder { get; set; }
    public int ReorderLevel { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
