namespace MaddisLedger.Api.Data;

// Shape of the config.json file written by Electron into its userData folder and
// pointed at via the MADDISLEDGER_CONFIG_PATH environment variable at launch.
public class AppRuntimeConfig
{
    public string ConnectionString { get; set; } = string.Empty;
    public string DataDirectory { get; set; } = string.Empty;
}
