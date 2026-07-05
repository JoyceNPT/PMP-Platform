using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMP.Application.Features.System.Interfaces;
using PMP.Shared.Wrappers;

namespace PMP.API.Controllers;

[AllowAnonymous]
[ApiController]
[Route("api/system")]
[Produces("application/json")]
public class SystemController : ControllerBase
{
    private readonly ISystemSettingService _settingService;

    public SystemController(ISystemSettingService settingService)
    {
        _settingService = settingService;
    }

    [HttpGet("announcement")]
    public async Task<IActionResult> GetAnnouncement()
    {
        var announcement = await _settingService.GetSettingAsync("NavbarAnnouncement", "");
        return Ok(new ApiResponse<string>(announcement, "Success"));
    }
}
