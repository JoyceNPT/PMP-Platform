using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMP.Application.Features.Chat.DTOs;
using PMP.Application.Features.Chat.Interfaces;
using System.Security.Claims;

namespace PMP.API.Controllers.Chat;

[Authorize]
[ApiController]
[Route("api/chat")]
[Produces("application/json")]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── Conversations ───────────────────────────────────────────────────────

    [HttpGet("conversations")]
    public async Task<IActionResult> GetConversations()
        => Ok(await _chatService.GetUserConversationsAsync(GetUserId()));

    [HttpPost("conversations")]
    public async Task<IActionResult> CreateConversation([FromBody] CreateConversationRequest request)
    {
        var result = await _chatService.CreateConversationAsync(GetUserId(), request);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("conversations/{id:guid}")]
    public async Task<IActionResult> DeleteConversation(Guid id)
    {
        var result = await _chatService.DeleteConversationAsync(GetUserId(), id);
        return result.Succeeded ? Ok(result) : NotFound(result);
    }

    // ─── Messages ────────────────────────────────────────────────────────────

    [HttpGet("conversations/{id:guid}/messages")]
    public async Task<IActionResult> GetMessages(Guid id)
        => Ok(await _chatService.GetConversationMessagesAsync(GetUserId(), id));

    [HttpPost("messages")]
    public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
    {
        var result = await _chatService.SendMessageAsync(GetUserId(), request);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }
}
