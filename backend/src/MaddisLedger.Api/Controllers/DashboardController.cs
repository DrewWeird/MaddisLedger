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

        return new DashboardSummaryDto(todaysInvoices.Count, todaysInvoices.Sum(i => i.Total), lowStockCount);
    }
}
