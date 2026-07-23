namespace MaddisLedger.Api.Dtos;

public record LedgerSummaryDto(
    DateTime From,
    DateTime To,
    decimal TotalRevenueZar,
    decimal TotalCostOfGoodsSoldZar,
    decimal GrossProfitZar,
    decimal TotalOtherExpensesZar,
    decimal NetProfitZar,
    int InvoiceCount,
    int SupplierInvoiceCount);

public record LedgerTrendPointDto(
    DateTime PeriodStart,
    string PeriodLabel,
    decimal RevenueZar,
    decimal CostOfGoodsSoldZar,
    decimal OtherExpensesZar,
    decimal NetProfitZar);

public record CategoryBreakdownPointDto(string Category, decimal RevenueZar);
