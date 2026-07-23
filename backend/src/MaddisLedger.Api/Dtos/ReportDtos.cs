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
