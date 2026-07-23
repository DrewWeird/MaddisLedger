using MaddisLedger.Api.Data;
using MaddisLedger.Api.Dtos;
using MaddisLedger.Api.Entities;
using MaddisLedger.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MaddisLedger.Api.Controllers;

[ApiController]
[Route("api/stock-items")]
public class StockItemsController : ControllerBase
{
    private readonly AppDbContext _db;

    public StockItemsController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<StockItemDto>>> List([FromQuery] bool activeOnly = false, [FromQuery] string? search = null)
    {
        var query = _db.StockItems.AsNoTracking().AsQueryable();

        if (activeOnly) query = query.Where(s => s.IsActive);
        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(s => s.Name.Contains(term) || s.Code.Contains(term) || s.Category.Contains(term));
        }

        var items = await query
            .OrderBy(s => s.Category).ThenBy(s => s.Name).ThenBy(s => s.Size)
            .Select(s => ToDto(s))
            .ToListAsync();

        return items;
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<StockItemDto>> Get(int id)
    {
        var item = await _db.StockItems.FindAsync(id) ?? throw DomainException.NotFound("StockItem", id);
        return ToDto(item);
    }

    [HttpPost]
    public async Task<ActionResult<StockItemDto>> Create(SaveStockItemDto dto)
    {
        var item = new StockItem
        {
            Code = dto.Code,
            Category = dto.Category,
            Name = dto.Name,
            Size = dto.Size,
            UnitPrice = dto.UnitPrice,
            QuantityOnHand = dto.QuantityOnHand,
            QuantityOnOrder = dto.QuantityOnOrder,
            ReorderLevel = dto.ReorderLevel,
            IsActive = dto.IsActive
        };

        _db.StockItems.Add(item);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = item.Id }, ToDto(item));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<StockItemDto>> Update(int id, SaveStockItemDto dto)
    {
        var item = await _db.StockItems.FindAsync(id) ?? throw DomainException.NotFound("StockItem", id);

        item.Code = dto.Code;
        item.Category = dto.Category;
        item.Name = dto.Name;
        item.Size = dto.Size;
        item.UnitPrice = dto.UnitPrice;
        item.QuantityOnHand = dto.QuantityOnHand;
        item.QuantityOnOrder = dto.QuantityOnOrder;
        item.ReorderLevel = dto.ReorderLevel;
        item.IsActive = dto.IsActive;
        item.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return ToDto(item);
    }

    private static StockItemDto ToDto(StockItem s) => new(
        s.Id, s.Code, s.Category, s.Name, s.Size, s.UnitPrice, s.QuantityOnHand, s.QuantityOnOrder, s.ReorderLevel, s.IsActive);
}
