using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using PMP.Application.Features.System.Interfaces;
using PMP.Shared.Wrappers;
using System;
using System.IO;
using System.Threading.Tasks;

namespace PMP.Infrastructure.Services.System;

public class CloudinaryStorageService : IStorageService
{
    private readonly Cloudinary _cloudinary;

    public CloudinaryStorageService(IConfiguration configuration)
    {
        var cloudName = configuration["Cloudinary:CloudName"];
        var apiKey = configuration["Cloudinary:ApiKey"];
        var apiSecret = configuration["Cloudinary:ApiSecret"];

        if (string.IsNullOrEmpty(cloudName) || string.IsNullOrEmpty(apiKey) || string.IsNullOrEmpty(apiSecret))
        {
            // Fallback to env variables
            cloudName ??= Environment.GetEnvironmentVariable("CLOUDINARY_CLOUD_NAME");
            apiKey ??= Environment.GetEnvironmentVariable("CLOUDINARY_API_KEY");
            apiSecret ??= Environment.GetEnvironmentVariable("CLOUDINARY_API_SECRET");
        }

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
    }

    public async Task<ApiResponse<string>> UploadFileAsync(Stream fileStream, string fileName, Guid userId, string feature = "notes")
    {
        if (fileStream == null || fileStream.Length == 0)
            return new ApiResponse<string>("Không tìm thấy file để upload.");

        try
        {
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(fileName, fileStream),
                Folder = $"pmp/{feature}/{userId}",
                PublicId = Guid.NewGuid().ToString("N")
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
                return new ApiResponse<string>($"Lỗi Cloudinary: {uploadResult.Error.Message}");

            return new ApiResponse<string>(uploadResult.SecureUrl.ToString(), "Upload Cloudinary thành công.");
        }
        catch (Exception ex)
        {
            return new ApiResponse<string>($"Lỗi khi upload file lên Cloudinary: {ex.Message}");
        }
    }
}
