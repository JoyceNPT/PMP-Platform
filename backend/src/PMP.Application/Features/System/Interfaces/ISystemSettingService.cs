using PMP.Shared.Wrappers;

namespace PMP.Application.Features.System.Interfaces;

public interface ISystemSettingService
{
    Task<string> GetSettingAsync(string key, string defaultValue = "");
    Task<bool> GetSettingBoolAsync(string key, bool defaultValue = false);
    Task SetSettingAsync(string key, string value);
}
