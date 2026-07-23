namespace MaddisLedger.Api.Dtos;

public record InvoiceLineItemDto(
    int Id,
    int StockItemId,
    string DescriptionSnapshot,
    decimal UnitPriceSnapshot,
    decimal CostPriceSnapshot,
    int Quantity,
    decimal LineTotal,
    int DeliveredQuantity,
    int RemainingQuantity);

public record InvoiceDto(
    int Id,
    string InvoiceNumber,
    int CustomerId,
    string CustomerNameSnapshot,
    string? CustomerAddressSnapshot,
    DateTime IssueDate,
    string Status,
    decimal Total,
    string Currency,
    decimal ExchangeRateToZar,
    DateTime? ExchangeRateAsOf,
    string? Notes,
    string? PdfPath,
    DateTime CreatedAt,
    List<InvoiceLineItemDto> LineItems);

public record InvoiceSummaryDto(
    int Id,
    string InvoiceNumber,
    int CustomerId,
    string CustomerNameSnapshot,
    DateTime IssueDate,
    string Status,
    decimal Total,
    string Currency);

public record CreateInvoiceLineItemDto(int StockItemId, int Quantity, decimal UnitPrice);

public record CreateInvoiceDto(
    int CustomerId,
    DateTime IssueDate,
    string? Notes,
    string Currency,
    decimal ExchangeRateToZar,
    DateTime? ExchangeRateAsOf,
    List<CreateInvoiceLineItemDto> LineItems);

public record VoidDocumentDto(string? Reason);
