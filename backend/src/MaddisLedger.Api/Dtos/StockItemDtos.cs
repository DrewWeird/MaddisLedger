namespace MaddisLedger.Api.Dtos;

public record StockItemDto(
    int Id,
    string Code,
    string Category,
    string Name,
    string? Size,
    decimal UnitPrice,
    int QuantityOnHand,
    int QuantityOnOrder,
    int ReorderLevel,
    bool IsActive);

public record SaveStockItemDto(
    string Code,
    string Category,
    string Name,
    string? Size,
    decimal UnitPrice,
    int QuantityOnHand,
    int QuantityOnOrder,
    int ReorderLevel,
    bool IsActive);
