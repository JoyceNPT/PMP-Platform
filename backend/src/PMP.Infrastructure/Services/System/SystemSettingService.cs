using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using PMP.Application.Features.System.Interfaces;
using PMP.Domain.Entities.System;
using PMP.Infrastructure.Persistence;

namespace PMP.Infrastructure.Services.System;

public class SystemSettingService : ISystemSettingService
{
    private readonly ApplicationDbContext _db;

    public SystemSettingService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<string> GetSettingAsync(string key, string defaultValue = "")
    {
        var setting = await _db.SystemSettings
            .FirstOrDefaultAsync(s => s.Key.ToLower() == key.ToLower());
        return setting?.Value ?? defaultValue;
    }

    public async Task<bool> GetSettingBoolAsync(string key, bool defaultValue = false)
    {
        var val = await GetSettingAsync(key);
        if (string.IsNullOrEmpty(val)) return defaultValue;
        return bool.TryParse(val, out var result) ? result : defaultValue;
    }

    public async Task SetSettingAsync(string key, string value)
    {
        var setting = await _db.SystemSettings
            .FirstOrDefaultAsync(s => s.Key.ToLower() == key.ToLower());

        if (setting == null)
        {
            setting = new SystemSetting
            {
                Key = key,
                Value = value
            };
            _db.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = value;
        }

        await _db.SaveChangesAsync();
    }
}
