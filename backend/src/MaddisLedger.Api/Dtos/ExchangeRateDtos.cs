namespace MaddisLedger.Api.Dtos;

public record ExchangeRateDto(decimal? Rate, DateTime? AsOf, bool Available);
