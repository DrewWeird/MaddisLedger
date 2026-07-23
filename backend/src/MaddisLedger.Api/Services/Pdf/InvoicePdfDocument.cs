using System.Globalization;
using MaddisLedger.Api.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MaddisLedger.Api.Services.Pdf;

public class InvoicePdfDocument : IDocument
{
    private readonly Invoice _invoice;
    private readonly BusinessProfile _profile;
    private static readonly CultureInfo ZarCulture = CultureInfo.GetCultureInfo("en-ZA");

    public InvoicePdfDocument(Invoice invoice, BusinessProfile profile)
    {
        _invoice = invoice;
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
                _profile, "INVOICE", _invoice.InvoiceNumber, _invoice.IssueDate, showBankingDetails: true)));

            page.Content().PaddingTop(20).Column(column =>
            {
                column.Item().Text("Bill To").FontSize(10).Bold();
                column.Item().Text(_invoice.CustomerNameSnapshot).FontSize(10);
                if (!string.IsNullOrWhiteSpace(_invoice.CustomerAddressSnapshot))
                {
                    column.Item().Text(_invoice.CustomerAddressSnapshot!).FontSize(9).FontColor(Colors.Grey.Darken1);
                }

                column.Item().PaddingTop(16).Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.RelativeColumn(4);
                        columns.RelativeColumn(1);
                        columns.RelativeColumn(1.5f);
                        columns.RelativeColumn(1.5f);
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(HeaderCell).Text("Description");
                        header.Cell().Element(HeaderCell).AlignRight().Text("Qty");
                        header.Cell().Element(HeaderCell).AlignRight().Text("Unit Price");
                        header.Cell().Element(HeaderCell).AlignRight().Text("Line Total");
                    });

                    foreach (var line in _invoice.LineItems.OrderBy(l => l.SortOrder))
                    {
                        table.Cell().Element(BodyCell).Text(line.DescriptionSnapshot);
                        table.Cell().Element(BodyCell).AlignRight().Text(line.Quantity.ToString());
                        table.Cell().Element(BodyCell).AlignRight().Text(FormatCurrency(line.UnitPriceSnapshot));
                        table.Cell().Element(BodyCell).AlignRight().Text(FormatCurrency(line.LineTotal));
                    }
                });

                column.Item().PaddingTop(10).AlignRight().Row(row =>
                {
                    row.AutoItem().PaddingRight(20).Text("Total").FontSize(12).Bold();
                    row.AutoItem().Text(FormatCurrency(_invoice.Total)).FontSize(12).Bold();
                });

                if (!string.IsNullOrWhiteSpace(_invoice.Notes))
                {
                    column.Item().PaddingTop(20).Text("Notes").FontSize(10).Bold();
                    column.Item().Text(_invoice.Notes!).FontSize(9);
                }
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

    private static string FormatCurrency(decimal value) => value.ToString("C", ZarCulture);

    private static IContainer HeaderCell(IContainer container) =>
        container.BorderBottom(1).BorderColor(Colors.Grey.Darken1).PaddingVertical(4).DefaultTextStyle(x => x.Bold());

    private static IContainer BodyCell(IContainer container) =>
        container.BorderBottom(0.5f).BorderColor(Colors.Grey.Lighten2).PaddingVertical(4);
}
