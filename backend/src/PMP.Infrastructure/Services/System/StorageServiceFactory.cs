using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using PMP.Application.Features.System.Interfaces;
using PMP.Shared.Wrappers;

namespace PMP.Infrastructure.Services.System;

public class StorageServiceFactory : IStorageService
{
    private readonly ISystemSettingService _settingService;
    private readonly IServiceProvider _serviceProvider;

    public StorageServiceFactory(ISystemSettingService settingService, IServiceProvider serviceProvider)
    {
        _settingService = settingService;
        _serviceProvider = serviceProvider;
    }

    public async Task<ApiResponse<string>> UploadFileAsync(Stream fileStream, string fileName, Guid userId, string feature = "notes")
    {
        var provider = await _settingService.GetSettingAsync("Storage", "Cloudinary");

        IStorageService actualService;
        if (provider.Equals("S3", StringComparison.OrdinalIgnoreCase))
        {
            actualService = _serviceProvider.GetRequiredService<S3StorageService>();
        }
        else
        {
            actualService = _serviceProvider.GetRequiredService<CloudinaryStorageService>();
        }

        return await actualService.UploadFileAsync(fileStream, fileName, userId, feature);
    }
}
