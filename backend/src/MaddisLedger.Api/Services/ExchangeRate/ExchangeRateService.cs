using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;

namespace MaddisLedger.Api.Services.ExchangeRate;

public record ExchangeRateResult(decimal? Rate, DateTime? AsOf, bool Available)
{
    public static readonly ExchangeRateResult Unavailable = new(null, null, false);
}

// Live rate lookup via Frankfurter.dev (free, no API key, ECB reference rates). Never throws —
// invoice creation must never hard-depend on this external call being reachable; callers get an
// "unavailable" result and fall back to a manually-entered rate.
public class ExchangeRateService
{
    private static readonly TimeSpan CacheDuration = TimeSpan.FromHours(4);

    private readonly HttpClient _http;
    private readonly IMemoryCache _cache;

    public ExchangeRateService(HttpClient http, IMemoryCache cache)
    {
        _http = http;
        _cache = cache;
    }

    public async Task<ExchangeRateResult> GetRateAsync(string from, string to)
    {
        var cacheKey = $"rate:{from}:{to}";
        if (_cache.TryGetValue(cacheKey, out ExchangeRateResult? cached) && cached is not null)
            return cached;

        try
        {
            var response = await _http.GetFromJsonAsync<FrankfurterResponse>($"latest?base={from}&symbols={to}");
            if (response is null || !response.Rates.TryGetValue(to, out var rate))
                return ExchangeRateResult.Unavailable;

            var result = new ExchangeRateResult(rate, response.Date, true);
            _cache.Set(cacheKey, result, CacheDuration);
            return result;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or JsonException)
        {
            return ExchangeRateResult.Unavailable;
        }
    }

    private record FrankfurterResponse(decimal Amount, string Base, DateTime Date, Dictionary<string, decimal> Rates);
}
