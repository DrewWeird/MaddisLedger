using MaddisLedger.Api.Data;
using MaddisLedger.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace MaddisLedger.Api.Controllers;

[ApiController]
[Route("api/business-profile")]
public class BusinessProfileController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly AppRuntimeConfig _config;

    public BusinessProfileController(AppDbContext db, AppRuntimeConfig config)
    {
        _db = db;
        _config = config;
    }

    [HttpGet]
    public async Task<ActionResult<BusinessProfileDto>> Get()
    {
        var profile = await _db.BusinessProfiles.FirstAsync();
        return ToDto(profile);
    }

    [HttpPut]
    public async Task<ActionResult<BusinessProfileDto>> Update(SaveBusinessProfileDto dto)
    {
        var profile = await _db.BusinessProfiles.FirstAsync();

        profile.BusinessName = dto.BusinessName;
        profile.AddressLine1 = dto.AddressLine1;
        profile.AddressLine2 = dto.AddressLine2;
        profile.City = dto.City;
        profile.PostalCode = dto.PostalCode;
        profile.Phone = dto.Phone;
        profile.Email = dto.Email;
        profile.BankName = dto.BankName;
        profile.BankAccountHolder = dto.BankAccountHolder;
        profile.BankAccountNumber = dto.BankAccountNumber;
        profile.BankBranchCode = dto.BankBranchCode;
        profile.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        return ToDto(profile);
    }

    [HttpPost("logo")]
    [RequestSizeLimit(5 * 1024 * 1024)]
    public async Task<ActionResult<BusinessProfileDto>> UploadLogo(IFormFile file)
    {
        if (file.Length == 0)
            throw new Services.DomainException("No file was uploaded.");

        var allowedExtensions = new[] { ".png", ".jpg", ".jpeg" };
        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!allowedExtensions.Contains(extension))
            throw new Services.DomainException("Logo must be a PNG or JPEG image.");

        var profile = await _db.BusinessProfiles.FirstAsync();

        var brandingDir = Path.Combine(_config.DataDirectory, "branding");
        Directory.CreateDirectory(brandingDir);
        var newLogoPath = Path.Combine(brandingDir, $"logo{extension}");

        await using (var stream = new FileStream(newLogoPath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        profile.LogoPath = newLogoPath;
        profile.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return ToDto(profile);
    }

    [HttpGet("logo")]
    public async Task<IActionResult> GetLogo()
    {
        var profile = await _db.BusinessProfiles.FirstAsync();
        if (string.IsNullOrWhiteSpace(profile.LogoPath) || !System.IO.File.Exists(profile.LogoPath))
            return NotFound();

        var extension = Path.GetExtension(profile.LogoPath).ToLowerInvariant();
        var contentType = extension == ".png" ? "image/png" : "image/jpeg";
        return PhysicalFile(profile.LogoPath, contentType);
    }

    private static BusinessProfileDto ToDto(Entities.BusinessProfile p) => new(
        p.Id, p.BusinessName, p.AddressLine1, p.AddressLine2, p.City, p.PostalCode, p.Phone, p.Email,
        p.BankName, p.BankAccountHolder, p.BankAccountNumber, p.BankBranchCode, p.LogoPath);
}
