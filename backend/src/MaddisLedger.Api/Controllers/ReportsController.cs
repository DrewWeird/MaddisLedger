using MaddisLedger.Api.Dtos;
using MaddisLedger.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace MaddisLedger.Api.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly ReportService _reports;

    public ReportsController(ReportService reports)
    {
        _reports = reports;
    }

    [HttpGet("ledger-summary")]
    public Task<LedgerSummaryDto> LedgerSummary([FromQuery] DateTime from, [FromQuery] DateTime to) =>
        _reports.GetLedgerSummaryAsync(from, to);

    [HttpGet("ledger-trend")]
    public Task<List<LedgerTrendPointDto>> LedgerTrend([FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] string bucket = "month") =>
        _reports.GetLedgerTrendAsync(from, to, bucket);

    [HttpGet("category-breakdown")]
    public Task<List<CategoryBreakdownPointDto>> CategoryBreakdown([FromQuery] DateTime from, [FromQuery] DateTime to) =>
        _reports.GetCategoryBreakdownAsync(from, to);
}
