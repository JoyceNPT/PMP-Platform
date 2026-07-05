using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMP.Application.Features.Note.DTOs;
using PMP.Application.Features.Note.Interfaces;
using PMP.Shared.Wrappers;
using System.Security.Claims;

namespace PMP.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class NoteController : ControllerBase
{
    private readonly INoteService _noteService;

    public NoteController(INoteService noteService)
    {
        _noteService = noteService;
    }

    private Guid GetUserId()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(userIdString, out var userId))
            return userId;
        throw new UnauthorizedAccessException("Invalid user token.");
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<NoteDto>>>> GetNotes()
    {
        var response = await _noteService.GetUserNotesAsync(GetUserId());
        return Ok(response);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponse<NoteDto>>> GetNote(Guid id)
    {
        var response = await _noteService.GetNoteByIdAsync(GetUserId(), id);
        if (!response.Succeeded)
            return NotFound(response);
        return Ok(response);
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponse<NoteDto>>> CreateNote([FromBody] CreateNoteRequest request)
    {
        var response = await _noteService.CreateNoteAsync(GetUserId(), request);
        return Ok(response);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ApiResponse<NoteDto>>> UpdateNote(Guid id, [FromBody] UpdateNoteRequest request)
    {
        var response = await _noteService.UpdateNoteAsync(GetUserId(), id, request);
        if (!response.Succeeded)
            return BadRequest(response);
        return Ok(response);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteNote(Guid id)
    {
        var response = await _noteService.DeleteNoteAsync(GetUserId(), id);
        if (!response.Succeeded)
            return BadRequest(response);
        return Ok(response);
    }

    [HttpPatch("{id}/pin")]
    public async Task<ActionResult<ApiResponse<bool>>> TogglePin(Guid id)
    {
        var response = await _noteService.TogglePinAsync(GetUserId(), id);
        if (!response.Succeeded)
            return BadRequest(response);
        return Ok(response);
    }
}
