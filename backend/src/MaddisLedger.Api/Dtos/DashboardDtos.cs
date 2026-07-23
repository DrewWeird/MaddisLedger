namespace MaddisLedger.Api.Dtos;

public record LowStockItemDto(int Id, string Code, string Category, string Name, string? Size, int QuantityOnHand, int ReorderLevel);

public record DashboardSummaryDto(int InvoiceCountToday, decimal InvoiceTotalToday, int LowStockItemCount);

public record SalesTrendPointDto(DateTime Date, decimal TotalZar);
