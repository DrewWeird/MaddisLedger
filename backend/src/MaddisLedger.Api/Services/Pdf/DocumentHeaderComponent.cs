using MaddisLedger.Api.Entities;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace MaddisLedger.Api.Services.Pdf;

// Shared branding header used by both invoices and delivery notes: logo, business name/address/
// contact details, and (invoices only, via showBankingDetails) EFT banking details.
public class DocumentHeaderComponent : IComponent
{
    private readonly BusinessProfile _profile;
    private readonly string _documentTitle;
    private readonly string _documentNumber;
    private readonly DateTime _documentDate;
    private readonly bool _showBankingDetails;

    public DocumentHeaderComponent(
        BusinessProfile profile,
        string documentTitle,
        string documentNumber,
        DateTime documentDate,
        bool showBankingDetails)
    {
        _profile = profile;
        _documentTitle = documentTitle;
        _documentNumber = documentNumber;
        _documentDate = documentDate;
        _showBankingDetails = showBankingDetails;
    }

    public void Compose(IContainer container)
    {
        container.Row(row =>
        {
            row.RelativeItem().Column(column =>
            {
                if (!string.IsNullOrWhiteSpace(_profile.LogoPath) && File.Exists(_profile.LogoPath))
                {
                    column.Item().MaxHeight(70).AlignLeft().Image(_profile.LogoPath).FitArea();
                    column.Item().PaddingTop(4);
                }

                column.Item().Text(_profile.BusinessName).FontSize(14).Bold();

                var addressLines = new[] { _profile.AddressLine1, _profile.AddressLine2, _profile.City, _profile.PostalCode }
                    .Where(line => !string.IsNullOrWhiteSpace(line));
                foreach (var line in addressLines)
                {
                    column.Item().Text(line!).FontSize(9).FontColor(Colors.Grey.Darken1);
                }

                if (!string.IsNullOrWhiteSpace(_profile.Phone))
                {
                    column.Item().Text($"Tel: {_profile.Phone}").FontSize(9).FontColor(Colors.Grey.Darken1);
                }

                if (!string.IsNullOrWhiteSpace(_profile.Email))
                {
                    column.Item().Text($"Email: {_profile.Email}").FontSize(9).FontColor(Colors.Grey.Darken1);
                }

                if (_showBankingDetails)
                {
                    column.Item().PaddingTop(6).Text("Banking Details (EFT)").FontSize(9).Bold();
                    column.Item().Text($"Bank: {_profile.BankName}").FontSize(9).FontColor(Colors.Grey.Darken1);
                    column.Item().Text($"Account Holder: {_profile.BankAccountHolder}").FontSize(9).FontColor(Colors.Grey.Darken1);
                    column.Item().Text($"Account Number: {_profile.BankAccountNumber}").FontSize(9).FontColor(Colors.Grey.Darken1);
                    column.Item().Text($"Branch Code: {_profile.BankBranchCode}").FontSize(9).FontColor(Colors.Grey.Darken1);
                }
            });

            row.ConstantItem(180).Column(column =>
            {
                column.Item().AlignRight().Text(_documentTitle).FontSize(20).Bold();
                column.Item().AlignRight().Text(_documentNumber).FontSize(12).FontColor(Colors.Grey.Darken1);
                column.Item().AlignRight().Text(_documentDate.ToString("dd/MM/yyyy")).FontSize(10).FontColor(Colors.Grey.Darken1);
            });
        });
    }
}
