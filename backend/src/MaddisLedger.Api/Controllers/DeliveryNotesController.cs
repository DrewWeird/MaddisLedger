using MaddisLedger.Api.Dtos;
using MaddisLedger.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MaddisLedger.Api.Controllers;

[ApiController]
[Route("api/delivery-notes")]
public class DeliveryNotesController : ControllerBase
{
    private readonly DeliveryNoteService _deliveryNotes;

    public DeliveryNotesController(DeliveryNoteService deliveryNotes)
    {
        _deliveryNotes = deliveryNotes;
    }

    [HttpGet]
    public Task<List<DeliveryNoteSummaryDto>> List([FromQuery] int? invoiceId, [FromQuery] int? customerId) =>
        _deliveryNotes.ListAsync(invoiceId, customerId);

    [HttpGet("{id:int}")]
    public Task<DeliveryNoteDto> Get(int id) => _deliveryNotes.GetAsync(id);

    [HttpPost]
    public async Task<ActionResult<DeliveryNoteDto>> Create(CreateDeliveryNoteDto dto)
    {
        var note = await _deliveryNotes.CreateAsync(dto);
        return CreatedAtAction(nameof(Get), new { id = note.Id }, note);
    }

    [HttpPost("{id:int}/void")]
    public Task<DeliveryNoteDto> Void(int id, VoidDocumentDto dto) => _deliveryNotes.VoidAsync(id, dto);

    [HttpPost("{id:int}/pdf/regenerate")]
    public async Task<ActionResult<object>> RegeneratePdf(int id)
    {
        var path = await _deliveryNotes.RegeneratePdfAsync(id);
        return new { pdfPath = path };
    }

    [HttpGet("{id:int}/pdf")]
    public async Task<IActionResult> GetPdf(int id)
    {
        var note = await _deliveryNotes.GetAsync(id);
        if (string.IsNullOrWhiteSpace(note.PdfPath) || !System.IO.File.Exists(note.PdfPath))
            throw DomainException.NotFound("DeliveryNote PDF", id);

        return PhysicalFile(note.PdfPath, "application/pdf", $"{note.DeliveryNoteNumber}.pdf");
    }
}
