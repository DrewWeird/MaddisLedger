using MaddisLedger.Api.Dtos;
using MaddisLedger.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MaddisLedger.Api.Controllers;

[ApiController]
[Route("api/supplier-invoices")]
public class SupplierInvoicesController : ControllerBase
{
    private readonly SupplierInvoiceService _supplierInvoices;

    public SupplierInvoicesController(SupplierInvoiceService supplierInvoices)
    {
        _supplierInvoices = supplierInvoices;
    }

    [HttpGet]
    public Task<List<SupplierInvoiceSummaryDto>> List(
        [FromQuery] int? supplierId, [FromQuery] string? status, [FromQuery] DateTime? from, [FromQuery] DateTime? to) =>
        _supplierInvoices.ListAsync(supplierId, status, from, to);

    [HttpGet("{id:int}")]
    public Task<SupplierInvoiceDto> Get(int id) => _supplierInvoices.GetAsync(id);

    [HttpPost]
    public async Task<ActionResult<SupplierInvoiceDto>> Create(CreateSupplierInvoiceDto dto)
    {
        var invoice = await _supplierInvoices.CreateAsync(dto);
        return CreatedAtAction(nameof(Get), new { id = invoice.Id }, invoice);
    }

    [HttpPost("{id:int}/payments")]
    public Task<SupplierInvoiceDto> RecordPayment(int id, CreateSupplierPaymentDto dto) =>
        _supplierInvoices.RecordPaymentAsync(id, dto);

    [HttpPost("{id:int}/void")]
    public Task<SupplierInvoiceDto> Void(int id, VoidDocumentDto dto) => _supplierInvoices.VoidAsync(id, dto);
}
