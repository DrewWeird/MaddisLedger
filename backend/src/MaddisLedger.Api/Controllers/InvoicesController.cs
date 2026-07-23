using MaddisLedger.Api.Dtos;
using MaddisLedger.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MaddisLedger.Api.Controllers;

[ApiController]
[Route("api/invoices")]
public class InvoicesController : ControllerBase
{
    private readonly InvoiceService _invoices;

    public InvoicesController(InvoiceService invoices)
    {
        _invoices = invoices;
    }

    [HttpGet]
    public Task<List<InvoiceSummaryDto>> List(
        [FromQuery] int? customerId, [FromQuery] string? status, [FromQuery] DateTime? from, [FromQuery] DateTime? to) =>
        _invoices.ListAsync(customerId, status, from, to);

    [HttpGet("{id:int}")]
    public Task<InvoiceDto> Get(int id) => _invoices.GetAsync(id);

    [HttpGet("{id:int}/deliverable-lines")]
    public Task<List<DeliverableLineDto>> GetDeliverableLines(int id) => _invoices.GetDeliverableLinesAsync(id);

    [HttpPost]
    public async Task<ActionResult<InvoiceDto>> Create(CreateInvoiceDto dto)
    {
        var invoice = await _invoices.CreateAsync(dto);
        return CreatedAtAction(nameof(Get), new { id = invoice.Id }, invoice);
    }

    [HttpPost("{id:int}/void")]
    public Task<InvoiceDto> Void(int id, VoidDocumentDto dto) => _invoices.VoidAsync(id, dto);

    [HttpPost("{id:int}/pdf/regenerate")]
    public async Task<ActionResult<object>> RegeneratePdf(int id)
    {
        var path = await _invoices.RegeneratePdfAsync(id);
        return new { pdfPath = path };
    }

    [HttpGet("{id:int}/pdf")]
    public async Task<IActionResult> GetPdf(int id)
    {
        var invoice = await _invoices.GetAsync(id);
        if (string.IsNullOrWhiteSpace(invoice.PdfPath) || !System.IO.File.Exists(invoice.PdfPath))
            throw DomainException.NotFound("Invoice PDF", id);

        return PhysicalFile(invoice.PdfPath, "application/pdf", $"{invoice.InvoiceNumber}.pdf");
    }
}
