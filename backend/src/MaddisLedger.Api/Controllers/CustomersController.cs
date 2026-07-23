using MaddisLedger.Api.Data;
using MaddisLedger.Api.Dtos;
using MaddisLedger.Api.Entities;
using MaddisLedger.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MaddisLedger.Api.Controllers;

[ApiController]
[Route("api/customers")]
public class CustomersController : ControllerBase
{
    private readonly AppDbContext _db;

    public CustomersController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<CustomerDto>>> List([FromQuery] string? search = null)
    {
        var query = _db.Customers.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(c => c.Name.Contains(term) || (c.Phone != null && c.Phone.Contains(term)) || (c.Email != null && c.Email.Contains(term)));
        }

        return await query.OrderBy(c => c.Name).Select(c => ToDto(c)).ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<CustomerDto>> Get(int id)
    {
        var customer = await _db.Customers.FindAsync(id) ?? throw DomainException.NotFound("Customer", id);
        return ToDto(customer);
    }

    [HttpPost]
    public async Task<ActionResult<CustomerDto>> Create(SaveCustomerDto dto)
    {
        var customer = new Customer
        {
            Name = dto.Name,
            Phone = dto.Phone,
            Email = dto.Email,
            AddressLine1 = dto.AddressLine1,
            AddressLine2 = dto.AddressLine2,
            City = dto.City,
            PostalCode = dto.PostalCode
        };

        _db.Customers.Add(customer);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = customer.Id }, ToDto(customer));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<CustomerDto>> Update(int id, SaveCustomerDto dto)
    {
        var customer = await _db.Customers.FindAsync(id) ?? throw DomainException.NotFound("Customer", id);

        customer.Name = dto.Name;
        customer.Phone = dto.Phone;
        customer.Email = dto.Email;
        customer.AddressLine1 = dto.AddressLine1;
        customer.AddressLine2 = dto.AddressLine2;
        customer.City = dto.City;
        customer.PostalCode = dto.PostalCode;
        customer.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return ToDto(customer);
    }

    private static CustomerDto ToDto(Customer c) => new(
        c.Id, c.Name, c.Phone, c.Email, c.AddressLine1, c.AddressLine2, c.City, c.PostalCode);
}
