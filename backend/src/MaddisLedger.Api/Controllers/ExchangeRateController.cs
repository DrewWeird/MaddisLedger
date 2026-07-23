using MaddisLedger.Api.Dtos;
using MaddisLedger.Api.Services.ExchangeRate;
using Microsoft.AspNetCore.Mvc;

namespace MaddisLedger.Api.Controllers;

[ApiController]
[Route("api/exchange-rate")]
public class ExchangeRateController : ControllerBase
{
    private readonly ExchangeRateService _exchangeRate;

    public ExchangeRateController(ExchangeRateService exchangeRate)
    {
        _exchangeRate = exchangeRate;
    }

    // Always 200, even when the live rate is unreachable — the frontend renders a graceful
    // "enter manually" state instead of an error toast.
    [HttpGet]
    public async Task<ExchangeRateDto> Get([FromQuery] string from, [FromQuery] string to)
    {
        var result = await _exchangeRate.GetRateAsync(from, to);
        return new ExchangeRateDto(result.Rate, result.AsOf, result.Available);
    }
}
