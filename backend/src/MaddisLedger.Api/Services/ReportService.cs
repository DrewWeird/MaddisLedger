using MaddisLedger.Api.Data;
using MaddisLedger.Api.Dtos;
using MaddisLedger.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace MaddisLedger.Api.Services;

public class ReportService
{
    private readonly AppDbContext _db;

    public ReportService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<LedgerSummaryDto> GetLedgerSummaryAsync(DateTime from, DateTime to)
    {
        var invoicesInRange = _db.Invoices.AsNoTracking()
            .Where(i => i.Status == DocumentStatus.Active && i.IssueDate >= from && i.IssueDate <= to);

        // Convert each invoice to ZAR using its own snapshotted rate — never re-fetches a live rate
        // for historical data, so past reports never silently change.
        var invoiceCount = await invoicesInRange.CountAsync();
        var totalRevenue = await invoicesInRange.SumAsync(i => (decimal?)(i.Total * i.ExchangeRateToZar)) ?? 0;

        var totalCogs = await _db.InvoiceLineItems.AsNoTracking()
            .Where(l => l.Invoice!.Status == DocumentStatus.Active && l.Invoice.IssueDate >= from && l.Invoice.IssueDate <= to)
            .SumAsync(l => (decimal?)(l.CostPriceSnapshot * l.Quantity)) ?? 0;

        var supplierInvoicesInRange = _db.SupplierInvoices.AsNoTracking()
            .Where(si => si.Status == DocumentStatus.Active && si.IssueDate >= from && si.IssueDate <= to);

        var supplierInvoiceCount = await supplierInvoicesInRange.CountAsync();
        var totalOtherExpenses = await supplierInvoicesInRange.SumAsync(si => (decimal?)si.Total) ?? 0;

        var grossProfit = totalRevenue - totalCogs;
        var netProfit = grossProfit - totalOtherExpenses;

        return new LedgerSummaryDto(
            from, to, totalRevenue, totalCogs, grossProfit, totalOtherExpenses, netProfit,
            invoiceCount, supplierInvoiceCount);
    }
}
