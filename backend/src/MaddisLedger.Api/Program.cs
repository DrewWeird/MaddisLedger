using Microsoft.EntityFrameworkCore;
using MaddisLedger.Api.Data;
using MaddisLedger.Api.Services;
using MaddisLedger.Api.Services.ExchangeRate;
using MaddisLedger.Api.Services.Numbering;
using MaddisLedger.Api.Services.Pdf;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

var runtimeConfig = RuntimeConfigProvider.Load(builder.Configuration);
Directory.CreateDirectory(runtimeConfig.DataDirectory);
builder.Services.AddSingleton(runtimeConfig);

QuestPDF.Settings.License = LicenseType.Community;

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        runtimeConfig.ConnectionString,
        new MySqlServerVersion(new Version(9, 7, 1))));

builder.Services.AddScoped<NumberingService>();
builder.Services.AddScoped<PdfService>();
builder.Services.AddScoped<InvoiceService>();
builder.Services.AddScoped<DeliveryNoteService>();
builder.Services.AddScoped<SupplierInvoiceService>();
builder.Services.AddScoped<ReportService>();

builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<ExchangeRateService>(client =>
{
    client.BaseAddress = new Uri("https://api.frankfurter.dev/v1/");
    client.Timeout = TimeSpan.FromSeconds(5);
});

builder.Services.AddExceptionHandler<DomainExceptionHandler>();
builder.Services.AddProblemDetails();

const string DevCorsPolicy = "DevCorsPolicy";
builder.Services.AddCors(options =>
{
    options.AddPolicy(DevCorsPolicy, policy =>
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();

Console.WriteLine("MaddisLedger backend starting...");

// Applying migrations at startup keeps this a zero-touch, single-user desktop app: no separate
// migration step for a non-technical user to run. MySQL may still be starting up on the same
// machine, so retry briefly rather than failing on the very first attempt.
const int maxMigrationAttempts = 10;
for (var attempt = 1; attempt <= maxMigrationAttempts; attempt++)
{
    try
    {
        Console.WriteLine($"Connecting to database (attempt {attempt}/{maxMigrationAttempts})...");
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();
        Console.WriteLine("Database is up to date.");
        SeedData.EnsureSeededAsync(db, runtimeConfig.DataDirectory).GetAwaiter().GetResult();
        Console.WriteLine("Seed data verified.");
        break;
    }
    catch (Exception ex) when (attempt < maxMigrationAttempts)
    {
        Console.WriteLine($"Database not ready yet ({ex.Message}); retrying in 2s...");
        Thread.Sleep(2000);
    }
}

app.UseExceptionHandler();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors(DevCorsPolicy);
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapControllers();
app.MapFallbackToFile("index.html");

Console.WriteLine("MaddisLedger backend ready.");
app.Run();
