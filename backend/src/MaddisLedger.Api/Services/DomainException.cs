using System.Net;

namespace MaddisLedger.Api.Services;

// Thrown for expected business-rule violations (not found, invalid state transitions, over-delivery, etc).
// Caught by DomainExceptionHandler and turned into a ProblemDetails response with the given status code.
public class DomainException : Exception
{
    public HttpStatusCode StatusCode { get; }

    public DomainException(string message, HttpStatusCode statusCode = HttpStatusCode.BadRequest) : base(message)
    {
        StatusCode = statusCode;
    }

    public static DomainException NotFound(string entity, object id) =>
        new($"{entity} '{id}' was not found.", HttpStatusCode.NotFound);
}
