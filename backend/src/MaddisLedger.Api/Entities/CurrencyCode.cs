namespace MaddisLedger.Api.Entities;

// Member names are deliberately all-caps: ToString() is used directly as the wire-format currency
// code (e.g. "ZAR", "USD"), and the frontend's CurrencyCode type expects exactly that casing.
public enum CurrencyCode
{
    ZAR = 0,
    USD = 1
}
