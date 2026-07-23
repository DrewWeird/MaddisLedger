using MaddisLedger.Api.Entities;

namespace MaddisLedger.Api.Data;

// Ensures the rows a fresh database needs to function exist: the INV/DN counters and the single
// BusinessProfile row (seeded with the real business name/logo and placeholder contact/banking
// text Maddi edits later via Settings).
public static class SeedData
{
    public static async Task EnsureSeededAsync(AppDbContext db, string dataDirectory)
    {
        if (!db.DocumentCounters.Any(c => c.DocumentType == "INV"))
        {
            db.DocumentCounters.Add(new DocumentCounter { DocumentType = "INV", NextValue = 1 });
        }

        if (!db.DocumentCounters.Any(c => c.DocumentType == "DN"))
        {
            db.DocumentCounters.Add(new DocumentCounter { DocumentType = "DN", NextValue = 1 });
        }

        if (!db.BusinessProfiles.Any())
        {
            var brandingDir = Path.Combine(dataDirectory, "branding");
            Directory.CreateDirectory(brandingDir);

            var shippedLogoPath = Path.Combine(AppContext.BaseDirectory, "Resources", "Branding", "logo.png");
            var seededLogoPath = Path.Combine(brandingDir, "logo.png");
            if (File.Exists(shippedLogoPath))
            {
                File.Copy(shippedLogoPath, seededLogoPath, overwrite: true);
            }

            db.BusinessProfiles.Add(new BusinessProfile
            {
                BusinessName = "Maddi's Sweet Temptations",
                AddressLine1 = "<Enter address line 1>",
                AddressLine2 = "<Enter address line 2>",
                City = "<Enter city>",
                PostalCode = "<Enter postal code>",
                Phone = "<Enter phone number>",
                Email = "<Enter email address>",
                BankName = "<Enter bank name>",
                BankAccountHolder = "Maddi's Sweet Temptations",
                BankAccountNumber = "<Enter account number>",
                BankBranchCode = "<Enter branch code>",
                LogoPath = seededLogoPath
            });
        }

        await db.SaveChangesAsync();
    }
}
