namespace MaddisLedger.Api.Dtos;

public record CustomerDto(
    int Id,
    string Name,
    string? Phone,
    string? Email,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? PostalCode);

public record SaveCustomerDto(
    string Name,
    string? Phone,
    string? Email,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? PostalCode);
