using System.Text.Json;

namespace MaddisLedger.Api.Data;

// Resolves the MySQL connection string and data directory (for PDFs, uploaded logos, etc).
// In production, Electron writes config.json into its userData folder and points us at it via
// MADDISLEDGER_CONFIG_PATH. During local `dotnet run` development (no Electron involved), we fall
// back to the Database section of appsettings.Development.json so the backend can run standalone.
public static class RuntimeConfigProvider
{
    public static AppRuntimeConfig Load(IConfiguration configuration)
    {
        var configPath = Environment.GetEnvironmentVariable("MADDISLEDGER_CONFIG_PATH");

        if (!string.IsNullOrWhiteSpace(configPath) && File.Exists(configPath))
        {
            var json = File.ReadAllText(configPath);
            var fromFile = JsonSerializer.Deserialize<AppRuntimeConfig>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });

            if (fromFile is not null && !string.IsNullOrWhiteSpace(fromFile.ConnectionString))
            {
                if (string.IsNullOrWhiteSpace(fromFile.DataDirectory))
                {
                    fromFile.DataDirectory = Path.Combine(Path.GetDirectoryName(configPath)!, "data");
                }

                fromFile.DataDirectory = Path.GetFullPath(fromFile.DataDirectory);
                return fromFile;
            }
        }

        var devConnectionString = configuration["Database:ConnectionString"];
        var devDataDirectory = configuration["Database:DataDirectory"];

        if (string.IsNullOrWhiteSpace(devConnectionString))
        {
            throw new InvalidOperationException(
                "No database configuration found. Set MADDISLEDGER_CONFIG_PATH to a valid config.json, " +
                "or set Database:ConnectionString in appsettings.Development.json for local development.");
        }

        // PhysicalFileResult (used to serve generated PDFs back to the client) requires an absolute
        // path and throws otherwise — GetFullPath guarantees that regardless of what's configured
        // or what the process's current working directory happens to be.
        return new AppRuntimeConfig
        {
            ConnectionString = devConnectionString,
            DataDirectory = Path.GetFullPath(string.IsNullOrWhiteSpace(devDataDirectory)
                ? Path.Combine(AppContext.BaseDirectory, "App_Data")
                : devDataDirectory)
        };
    }
}
