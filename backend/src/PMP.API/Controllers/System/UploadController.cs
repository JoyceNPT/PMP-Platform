using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PMP.Application.Features.System.Interfaces;
using PMP.Shared.Wrappers;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace PMP.API.Controllers;

[Authorize]
[ApiController]
[Route("api/upload")]
[Produces("application/json")]
public class UploadController : ControllerBase
{
    private readonly IStorageService _storageService;

    public UploadController(IStorageService _storageService)
    {
        this._storageService = _storageService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpPost]
    public async Task<IActionResult> UploadFile(IFormFile file, [FromQuery] string feature = "notes")
    {
        if (file == null || file.Length == 0)
            return BadRequest(new ApiResponse<string>("Không tìm thấy file để upload."));

        using var stream = file.OpenReadStream();
        var result = await _storageService.UploadFileAsync(stream, file.FileName, GetUserId(), feature);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }
}
