using MaddisLedger.Api.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MaddisLedger.Api.Services.Pdf;

public class DeliveryNotePdfDocument : IDocument
{
    private readonly DeliveryNote _deliveryNote;
    private readonly BusinessProfile _profile;

    public DeliveryNotePdfDocument(DeliveryNote deliveryNote, BusinessProfile profile)
    {
        _deliveryNote = deliveryNote;
        _profile = profile;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;

    public DocumentSettings GetSettings() => DocumentSettings.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Margin(36);
            page.Size(PageSizes.A4);
            page.DefaultTextStyle(x => x.FontSize(10));

            page.Header().Element(c => c.Component(new DocumentHeaderComponent(
                _profile, "DELIVERY NOTE", _deliveryNote.DeliveryNoteNumber, _deliveryNote.DeliveryDate, showBankingDetails: false)));

            page.Content().PaddingTop(20).Column(column =>
            {
                column.Item().Text("Deliver To").FontSize(10).Bold();
                column.Item().Text(_deliveryNote.Customer?.Name ?? string.Empty).FontSize(10);
                column.Item().Text($"Ref: Invoice {_deliveryNote.Invoice?.InvoiceNumber}").FontSize(9).FontColor(Colors.Grey.Darken1);

                column.Item().PaddingTop(16).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(4);
                        columns.RelativeColumn(1.5f);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(HeaderCell).Text("Description");
                        header.Cell().Element(HeaderCell).AlignRight().Text("Qty Delivered");
                    });

                    foreach (var line in _deliveryNote.LineItems.OrderBy(l => l.SortOrder))
                    {
                        table.Cell().Element(BodyCell).Text(line.DescriptionSnapshot);
                        table.Cell().Element(BodyCell).AlignRight().Text(line.QuantityDelivered.ToString());
                    }
                });

                if (!string.IsNullOrWhiteSpace(_deliveryNote.Notes))
                {
                    column.Item().PaddingTop(20).Text("Notes").FontSize(10).Bold();
                    column.Item().Text(_deliveryNote.Notes!).FontSize(9);
                }

                column.Item().PaddingTop(50).Row(row =>
                {
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().BorderBottom(1).BorderColor(Colors.Grey.Darken1).Height(30);
                        c.Item().PaddingTop(2).Text("Received By (Name & Signature)").FontSize(8).FontColor(Colors.Grey.Darken1);
                    });
                    row.ConstantItem(20);
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().BorderBottom(1).BorderColor(Colors.Grey.Darken1).Height(30);
                        c.Item().PaddingTop(2).Text("Date").FontSize(8).FontColor(Colors.Grey.Darken1);
                    });
                });
            });

            page.Footer().AlignCenter().Text(text =>
            {
                text.Span("Page ").FontSize(8).FontColor(Colors.Grey.Darken1);
                text.CurrentPageNumber().FontSize(8).FontColor(Colors.Grey.Darken1);
                text.Span(" of ").FontSize(8).FontColor(Colors.Grey.Darken1);
                text.TotalPages().FontSize(8).FontColor(Colors.Grey.Darken1);
            });
        });
    }

    private static IContainer HeaderCell(IContainer container) =>
        container.BorderBottom(1).BorderColor(Colors.Grey.Darken1).PaddingVertical(4).DefaultTextStyle(x => x.Bold());

    private static IContainer BodyCell(IContainer container) =>
        container.BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).PaddingVertical(4);
}
