using MaddisLedger.Api.Data;
using MaddisLedger.Api.Dtos;
using MaddisLedger.Api.Entities;
using MaddisLedger.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MaddisLedger.Api.Controllers;

[ApiController]
[Route("api/suppliers")]
public class SuppliersController : ControllerBase
{
    private readonly AppDbContext _db;

    public SuppliersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<SupplierDto>>> List([FromQuery] string? search = null)
    {
        var query = _db.Suppliers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(s => s.Name.Contains(term) || (s.Phone != null && s.Phone.Contains(term)) || (s.Email != null && s.Email.Contains(term)));
        }

        return await query.OrderBy(s => s.Name).Select(s => ToDto(s)).ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SupplierDto>> Get(int id)
    {
        var supplier = await _db.Suppliers.FindAsync(id) ?? throw DomainException.NotFound("Supplier", id);
        return ToDto(supplier);
    }

    [HttpPost]
    public async Task<ActionResult<SupplierDto>> Create(SaveSupplierDto dto)
    {
        var supplier = new Supplier
        {
            Name = dto.Name,
            Phone = dto.Phone,
            Email = dto.Email,
            AddressLine1 = dto.AddressLine1,
            AddressLine2 = dto.AddressLine2,
            City = dto.City,
            PostalCode = dto.PostalCode
        };

        _db.Suppliers.Add(supplier);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = supplier.Id }, ToDto(supplier));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<SupplierDto>> Update(int id, SaveSupplierDto dto)
    {
        var supplier = await _db.Suppliers.FindAsync(id) ?? throw DomainException.NotFound("Supplier", id);

        supplier.Name = dto.Name;
        supplier.Phone = dto.Phone;
        supplier.Email = dto.Email;
        supplier.AddressLine1 = dto.AddressLine1;
        supplier.AddressLine2 = dto.AddressLine2;
        supplier.City = dto.City;
        supplier.PostalCode = dto.PostalCode;
        supplier.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return ToDto(supplier);
    }

    private static SupplierDto ToDto(Supplier s) => new(
        s.Id, s.Name, s.Phone, s.Email, s.AddressLine1, s.AddressLine2, s.City, s.PostalCode);
}
