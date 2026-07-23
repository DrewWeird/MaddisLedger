namespace MaddisLedger.Api.Entities;

// Singleton entity — a single row holds the business's own details used on document headers.
public class BusinessProfile
{
    public int Id { get; set; }
    public string BusinessName { get; set; } = string.Empty;
    public string? AddressLine1 { get; set; }
    public string? AddressLine2 { get; set; }
    public string? City { get; set; }
    public string? PostalCode { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? BankName { get; set; }
    public string? BankAccountHolder { get; set; }
    public string? BankAccountNumber { get; set; }
    public string? BankBranchCode { get; set; }
    public string? LogoPath { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
