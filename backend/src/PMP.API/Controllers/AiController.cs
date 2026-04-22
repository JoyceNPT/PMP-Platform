using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using PMP.Infrastructure.Services.Chat;
using PMP.Shared.Wrappers;

namespace PMP.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class AiController : ControllerBase
{
    private readonly IAiChatService _aiChatService;

    public AiController(IAiChatService aiChatService)
    {
        _aiChatService = aiChatService;
    }

    [HttpPost("chat")]
    public async Task<ActionResult<ApiResponse<string>>> Chat([FromBody] string message)
    {
        if (string.IsNullOrWhiteSpace(message))
            return BadRequest(new ApiResponse<string>("Message cannot be empty."));

        var userIdStr = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();

        var response = await _aiChatService.GetAiResponseAsync(Guid.Parse(userIdStr), message);
        
        if (response.Succeeded)
            return Ok(response);
            
        return BadRequest(response);
    }
}
