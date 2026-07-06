using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using Microsoft.Extensions.Configuration;
using PMP.Application.Features.System.Interfaces;
using PMP.Shared.Wrappers;
using System;
using System.IO;
using System.Threading.Tasks;

namespace PMP.Infrastructure.Services.System;

public class S3StorageService : IStorageService
{
    private readonly IAmazonS3 _s3Client;
    private readonly string _bucketName;
    private readonly string _region;

    public S3StorageService(IConfiguration configuration)
    {
        var accessKey = configuration["AWS:AccessKey"] ?? Environment.GetEnvironmentVariable("AWS_ACCESS_KEY_ID");
        var secretKey = configuration["AWS:SecretKey"] ?? Environment.GetEnvironmentVariable("AWS_SECRET_ACCESS_KEY");
        var regionName = configuration["AWS:Region"] ?? Environment.GetEnvironmentVariable("AWS_REGION") ?? "us-east-1";
        _bucketName = configuration["AWS:BucketName"] ?? Environment.GetEnvironmentVariable("AWS_BUCKET_NAME") ?? "pmp-bucket";

        var region = RegionEndpoint.GetBySystemName(regionName);
        _s3Client = new AmazonS3Client(accessKey, secretKey, region);
        _region = regionName;
    }

    public async Task<ApiResponse<string>> UploadFileAsync(Stream fileStream, string fileName, Guid userId, string feature = "notes")
    {
        if (fileStream == null || fileStream.Length == 0)
            return new ApiResponse<string>("Không tìm thấy file để upload.");

        try
        {
            var extension = Path.GetExtension(fileName);
            var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
            
            // Format S3 key: pmp/{name_feature}/{userId}/{name_file}
            // If feature is system, format is pmp/{name_file}
            var key = feature.Equals("system", StringComparison.OrdinalIgnoreCase)
                ? $"pmp/{uniqueFileName}"
                : $"pmp/{feature.ToLower()}/{userId}/{uniqueFileName}";

            var uploadRequest = new TransferUtilityUploadRequest
            {
                InputStream = fileStream,
                Key = key,
                BucketName = _bucketName,
                CannedACL = S3CannedACL.PublicRead
            };

            var fileTransferUtility = new TransferUtility(_s3Client);
            await fileTransferUtility.UploadAsync(uploadRequest);

            // Construct public S3 URL
            var fileUrl = $"https://{_bucketName}.s3.{_region}.amazonaws.com/{key}";

            return new ApiResponse<string>(fileUrl, "Upload AWS S3 thành công.");
        }
        catch (Exception ex)
        {
            return new ApiResponse<string>($"Lỗi khi upload file lên AWS S3: {ex.Message}");
        }
    }

    public async Task<ApiResponse<bool>> DeleteFileAsync(string fileUrl)
    {
        if (string.IsNullOrWhiteSpace(fileUrl))
            return new ApiResponse<bool>(true);

        if (!Uri.TryCreate(fileUrl, UriKind.Absolute, out var uri))
            return new ApiResponse<bool>("URL file S3 không hợp lệ.");

        var key = uri.AbsolutePath.TrimStart('/');
        if (string.IsNullOrWhiteSpace(key))
            return new ApiResponse<bool>("Không thể xác định key S3 từ URL file.");

        try
        {
            await _s3Client.DeleteObjectAsync(new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = key
            });

            return new ApiResponse<bool>(true, "Đã xoá file AWS S3.");
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool>($"Lỗi khi xoá file AWS S3: {ex.Message}");
        }
    }
}
