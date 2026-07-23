using MaddisLedger.Api.Data;
using MaddisLedger.Api.Dtos;
using MaddisLedger.Api.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MaddisLedger.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _db;

    public DashboardController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet("low-stock")]
    public async Task<ActionResult<List<LowStockItemDto>>> LowStock()
    {
        return await _db.StockItems.AsNoTracking()
            .Where(s => s.IsActive && s.QuantityOnHand <= s.ReorderLevel)
            .OrderBy(s => s.Category).ThenBy(s => s.Name)
            .Select(s => new LowStockItemDto(s.Id, s.Code, s.Category, s.Name, s.Size, s.QuantityOnHand, s.ReorderLevel))
            .ToListAsync();
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> Summary()
    {
        var today = DateTime.UtcNow.Date;
        var tomorrow = today.AddDays(1);

        var todaysInvoices = await _db.Invoices.AsNoTracking()
            .Where(i => i.Status == DocumentStatus.Active && i.IssueDate >= today && i.IssueDate < tomorrow)
            .ToListAsync();

        var lowStockCount = await _db.StockItems.AsNoTracking()
            .CountAsync(s => s.IsActive && s.QuantityOnHand <= s.ReorderLevel);

        // Convert each invoice to ZAR using its own snapshotted rate — invoices may be in
        // different currencies, so a plain sum of Total would mix ZAR and USD amounts.
        var totalZar = todaysInvoices.Sum(i => i.Total * i.ExchangeRateToZar);

        return new DashboardSummaryDto(todaysInvoices.Count, totalZar, lowStockCount);
    }

    [HttpGet("sales-trend")]
    public async Task<ActionResult<List<SalesTrendPointDto>>> SalesTrend([FromQuery] int days = 7)
    {
        days = Math.Clamp(days, 1, 90);
        var today = DateTime.UtcNow.Date;
        var startDate = today.AddDays(-(days - 1));

        var invoices = await _db.Invoices.AsNoTracking()
            .Where(i => i.Status == DocumentStatus.Active && i.IssueDate >= startDate && i.IssueDate < today.AddDays(1))
            .Select(i => new { i.IssueDate, ZarTotal = i.Total * i.ExchangeRateToZar })
            .ToListAsync();

        var byDate = invoices.GroupBy(i => i.IssueDate.Date).ToDictionary(g => g.Key, g => g.Sum(i => i.ZarTotal));

        var points = new List<SalesTrendPointDto>();
        for (var date = startDate; date <= today; date = date.AddDays(1))
        {
            points.Add(new SalesTrendPointDto(date, byDate.GetValueOrDefault(date, 0)));
        }

        return points;
    }
}
