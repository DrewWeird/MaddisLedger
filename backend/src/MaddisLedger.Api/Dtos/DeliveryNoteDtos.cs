namespace MaddisLedger.Api.Dtos;

public record DeliverableLineDto(
    int InvoiceLineItemId,
    string DescriptionSnapshot,
    int OrderedQuantity,
    int AlreadyDeliveredQuantity,
    int RemainingQuantity);

public record DeliveryNoteLineItemDto(
    int Id,
    int InvoiceLineItemId,
    string DescriptionSnapshot,
    int QuantityDelivered);

public record DeliveryNoteDto(
    int Id,
    string DeliveryNoteNumber,
    int InvoiceId,
    string InvoiceNumber,
    int CustomerId,
    string CustomerNameSnapshot,
    DateTime DeliveryDate,
    string Status,
    string? Notes,
    string? PdfPath,
    DateTime CreatedAt,
    List<DeliveryNoteLineItemDto> LineItems);

public record DeliveryNoteSummaryDto(
    int Id,
    string DeliveryNoteNumber,
    int InvoiceId,
    string InvoiceNumber,
    string CustomerNameSnapshot,
    DateTime DeliveryDate,
    string Status);

public record CreateDeliveryNoteLineItemDto(int InvoiceLineItemId, int QuantityDelivered);

public record CreateDeliveryNoteDto(
    int InvoiceId,
    DateTime DeliveryDate,
    string? Notes,
    List<CreateDeliveryNoteLineItemDto> LineItems);
