namespace MaddisLedger.Api.Dtos;

public record InvoiceLineItemDto(
    int Id,
    int StockItemId,
    string DescriptionSnapshot,
    decimal UnitPriceSnapshot,
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
    decimal Total);

public record CreateInvoiceLineItemDto(int StockItemId, int Quantity, decimal UnitPrice);

public record CreateInvoiceDto(
    int CustomerId,
    DateTime IssueDate,
    string? Notes,
    List<CreateInvoiceLineItemDto> LineItems);

public record VoidDocumentDto(string? Reason);
