using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Configuration;
using PMP.Application.Features.System.Interfaces;
using PMP.Shared.Wrappers;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace PMP.Infrastructure.Services.System;

public class CloudinaryStorageService : IStorageService
{
    private readonly Cloudinary _cloudinary;
    private readonly bool _isConfigured;
    private readonly string? _configurationError;

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

        _isConfigured = IsConfiguredValue(cloudName)
            && IsConfiguredValue(apiKey)
            && IsConfiguredValue(apiSecret);

        if (!_isConfigured)
        {
            _configurationError = "Cloudinary chưa được cấu hình. Vui lòng set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY và CLOUDINARY_API_SECRET bằng giá trị thật.";
        }

        var account = new Account(cloudName, apiKey, apiSecret);
        _cloudinary = new Cloudinary(account);
    }

    private static bool IsConfiguredValue(string? value)
    {
        return !string.IsNullOrWhiteSpace(value)
            && !value.StartsWith("YOUR_", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<ApiResponse<string>> UploadFileAsync(Stream fileStream, string fileName, Guid userId, string feature = "notes")
    {
        if (fileStream == null || fileStream.Length == 0)
            return new ApiResponse<string>("Không tìm thấy file để upload.");

        if (!_isConfigured)
            return new ApiResponse<string>(_configurationError!);

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

    public async Task<ApiResponse<bool>> DeleteFileAsync(string fileUrl)
    {
        if (string.IsNullOrWhiteSpace(fileUrl))
            return new ApiResponse<bool>(true);

        if (!_isConfigured)
            return new ApiResponse<bool>(_configurationError!);

        var publicId = TryGetPublicId(fileUrl);
        if (string.IsNullOrWhiteSpace(publicId))
            return new ApiResponse<bool>("Không thể xác định publicId Cloudinary từ URL ảnh.");

        try
        {
            var result = await _cloudinary.DestroyAsync(new DeletionParams(publicId)
            {
                ResourceType = ResourceType.Image
            });

            if (result.Error != null)
                return new ApiResponse<bool>($"Lỗi Cloudinary khi xoá file: {result.Error.Message}");

            return new ApiResponse<bool>(true, "Đã xoá file Cloudinary.");
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool>($"Lỗi khi xoá file Cloudinary: {ex.Message}");
        }
    }

    private static string? TryGetPublicId(string fileUrl)
    {
        if (!Uri.TryCreate(fileUrl, UriKind.Absolute, out var uri))
            return null;

        var uploadMarker = "/upload/";
        var uploadIndex = uri.AbsolutePath.IndexOf(uploadMarker, StringComparison.OrdinalIgnoreCase);
        if (uploadIndex < 0)
            return null;

        var publicPath = uri.AbsolutePath[(uploadIndex + uploadMarker.Length)..].Trim('/');
        var segments = publicPath.Split('/', StringSplitOptions.RemoveEmptyEntries).ToList();
        if (segments.Count == 0)
            return null;

        if (segments[0].Length > 1 && segments[0][0] == 'v' && segments[0][1..].All(char.IsDigit))
            segments.RemoveAt(0);

        if (segments.Count == 0)
            return null;

        var publicId = Uri.UnescapeDataString(string.Join("/", segments));
        var extensionIndex = publicId.LastIndexOf('.');
        return extensionIndex > 0 ? publicId[..extensionIndex] : publicId;
    }
}
