namespace MaddisLedger.Api.Dtos;

public record SupplierDto(
    int Id,
    string Name,
    string? Phone,
    string? Email,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? PostalCode);

public record SaveSupplierDto(
    string Name,
    string? Phone,
    string? Email,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? PostalCode);
