namespace MaddisLedger.Api.Entities;

// One row per document type ("INV", "DN"); incremented transactionally to mint sequential numbers.
public class DocumentCounter
{
    public string DocumentType { get; set; } = string.Empty;
    public int NextValue { get; set; }
}
