namespace MaddisLedger.Api.Dtos;

public record BusinessProfileDto(
    int Id,
    string BusinessName,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? PostalCode,
    string? Phone,
    string? Email,
    string? BankName,
    string? BankAccountHolder,
    string? BankAccountNumber,
    string? BankBranchCode,
    string? LogoPath);

public record SaveBusinessProfileDto(
    string BusinessName,
    string? AddressLine1,
    string? AddressLine2,
    string? City,
    string? PostalCode,
    string? Phone,
    string? Email,
    string? BankName,
    string? BankAccountHolder,
    string? BankAccountNumber,
    string? BankBranchCode);
