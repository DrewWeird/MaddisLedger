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

    public async Task<List<LedgerTrendPointDto>> GetLedgerTrendAsync(DateTime from, DateTime to, string bucket)
    {
        var useMonthlyBuckets = string.Equals(bucket, "month", StringComparison.OrdinalIgnoreCase);

        DateTime BucketStart(DateTime date) => useMonthlyBuckets
            ? new DateTime(date.Year, date.Month, 1)
            : from.Date.AddDays(7 * ((date.Date - from.Date).Days / 7));

        string BucketLabel(DateTime periodStart) => useMonthlyBuckets
            ? periodStart.ToString("MMM yyyy")
            : periodStart.ToString("dd MMM");

        var revenueRows = await _db.Invoices.AsNoTracking()
            .Where(i => i.Status == DocumentStatus.Active && i.IssueDate >= from && i.IssueDate <= to)
            .Select(i => new { i.IssueDate, ZarTotal = i.Total * i.ExchangeRateToZar })
            .ToListAsync();

        var cogsRows = await _db.InvoiceLineItems.AsNoTracking()
            .Where(l => l.Invoice!.Status == DocumentStatus.Active && l.Invoice.IssueDate >= from && l.Invoice.IssueDate <= to)
            .Select(l => new { l.Invoice!.IssueDate, Cogs = l.CostPriceSnapshot * l.Quantity })
            .ToListAsync();

        var expenseRows = await _db.SupplierInvoices.AsNoTracking()
            .Where(si => si.Status == DocumentStatus.Active && si.IssueDate >= from && si.IssueDate <= to)
            .Select(si => new { si.IssueDate, si.Total })
            .ToListAsync();

        var revenueByBucket = revenueRows.GroupBy(r => BucketStart(r.IssueDate)).ToDictionary(g => g.Key, g => g.Sum(r => r.ZarTotal));
        var cogsByBucket = cogsRows.GroupBy(r => BucketStart(r.IssueDate)).ToDictionary(g => g.Key, g => g.Sum(r => r.Cogs));
        var expensesByBucket = expenseRows.GroupBy(r => BucketStart(r.IssueDate)).ToDictionary(g => g.Key, g => g.Sum(r => r.Total));

        var allBucketStarts = revenueByBucket.Keys
            .Concat(cogsByBucket.Keys)
            .Concat(expensesByBucket.Keys)
            .Distinct()
            .OrderBy(k => k);

        var points = new List<LedgerTrendPointDto>();
        foreach (var bucketStart in allBucketStarts)
        {
            var revenue = revenueByBucket.GetValueOrDefault(bucketStart, 0);
            var cogs = cogsByBucket.GetValueOrDefault(bucketStart, 0);
            var expenses = expensesByBucket.GetValueOrDefault(bucketStart, 0);
            points.Add(new LedgerTrendPointDto(bucketStart, BucketLabel(bucketStart), revenue, cogs, expenses, revenue - cogs - expenses));
        }

        return points;
    }

    public async Task<List<CategoryBreakdownPointDto>> GetCategoryBreakdownAsync(DateTime from, DateTime to)
    {
        const int maxCategories = 7;

        var rows = await _db.InvoiceLineItems.AsNoTracking()
            .Where(l => l.Invoice!.Status == DocumentStatus.Active && l.Invoice.IssueDate >= from && l.Invoice.IssueDate <= to)
            .Select(l => new { l.StockItem!.Category, ZarLineTotal = l.LineTotal * l.Invoice!.ExchangeRateToZar })
            .ToListAsync();

        var byCategory = rows
            .GroupBy(r => r.Category)
            .Select(g => new CategoryBreakdownPointDto(g.Key, g.Sum(r => r.ZarLineTotal)))
            .OrderByDescending(c => c.RevenueZar)
            .ToList();

        if (byCategory.Count <= maxCategories)
            return byCategory;

        var top = byCategory.Take(maxCategories - 1).ToList();
        var otherTotal = byCategory.Skip(maxCategories - 1).Sum(c => c.RevenueZar);
        top.Add(new CategoryBreakdownPointDto("Other", otherTotal));
        return top;
    }
}
