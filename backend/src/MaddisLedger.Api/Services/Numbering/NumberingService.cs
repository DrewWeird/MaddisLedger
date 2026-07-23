using Microsoft.EntityFrameworkCore;
using MaddisLedger.Api.Data;

namespace MaddisLedger.Api.Services.Numbering;

// Mints sequential document numbers like "INV-0001". Must be called from within a transaction
// already started by the caller (invoice/delivery-note creation), so the counter increment commits
// atomically with the document it numbers. "FOR UPDATE" row-locks the counter row for the duration
// of that transaction, preventing two concurrent creations from reusing the same number.
public class NumberingService
{
    private readonly AppDbContext _db;

    public NumberingService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<string> NextNumberAsync(string documentType, string prefix)
    {
        // EF Core's SqlQueryRaw<T> for a scalar type requires the single result column to be
        // named "Value" — it does not just take the first column.
        var current = await _db.Database
            .SqlQueryRaw<int>(
                "SELECT `NextValue` AS `Value` FROM `DocumentCounters` WHERE `DocumentType` = {0} FOR UPDATE",
                documentType)
            .SingleAsync();

        await _db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE `DocumentCounters` SET `NextValue` = {current + 1} WHERE `DocumentType` = {documentType}");

        return $"{prefix}-{current:D4}";
    }
}
