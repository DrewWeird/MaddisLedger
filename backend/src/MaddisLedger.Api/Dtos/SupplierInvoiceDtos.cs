namespace MaddisLedger.Api.Dtos;

public record SupplierPaymentDto(int Id, DateTime PaymentDate, decimal Amount, string? Notes);

public record SupplierInvoiceSummaryDto(
    int Id,
    int SupplierId,
    string SupplierName,
    string SupplierReference,
    DateTime IssueDate,
    string Status,
    decimal Total,
    decimal AmountPaid,
    decimal AmountOutstanding);

public record SupplierInvoiceDto(
    int Id,
    int SupplierId,
    string SupplierName,
    string SupplierReference,
    DateTime IssueDate,
    string Status,
    decimal Total,
    string? Description,
    DateTime CreatedAt,
    decimal AmountPaid,
    decimal AmountOutstanding,
    List<SupplierPaymentDto> Payments);

public record CreateSupplierInvoiceDto(
    int SupplierId,
    string SupplierReference,
    DateTime IssueDate,
    decimal Total,
    string? Description);

public record CreateSupplierPaymentDto(DateTime PaymentDate, decimal Amount, string? Notes);
