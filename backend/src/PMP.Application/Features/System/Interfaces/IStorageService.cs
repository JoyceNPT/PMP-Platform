using PMP.Shared.Wrappers;
using System;
using System.IO;
using System.Threading.Tasks;

namespace PMP.Application.Features.System.Interfaces;

public interface IStorageService
{
    Task<ApiResponse<string>> UploadFileAsync(Stream fileStream, string fileName, Guid userId, string feature = "notes");
    Task<ApiResponse<bool>> DeleteFileAsync(string fileUrl);
}
