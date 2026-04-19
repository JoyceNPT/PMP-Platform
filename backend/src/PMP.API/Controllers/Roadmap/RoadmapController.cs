using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMP.Application.Features.Roadmap.DTOs;
using PMP.Application.Features.Roadmap.Interfaces;
using System.Security.Claims;

namespace PMP.API.Controllers.Roadmap;

[Authorize]
[ApiController]
[Route("api/roadmap")]
[Produces("application/json")]
public class RoadmapController : ControllerBase
{
    private readonly IRoadmapService _roadmapService;

    public RoadmapController(IRoadmapService roadmapService)
    {
        _roadmapService = roadmapService;
    }

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── Profile & Skills ───────────────────────────────────────────────────

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
        => Ok(await _roadmapService.GetOrCreateProfileAsync(GetUserId()));

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateCareerProfileRequest request)
    {
        var result = await _roadmapService.UpdateProfileAsync(GetUserId(), request);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    [HttpPost("skills")]
    public async Task<IActionResult> AddSkill([FromBody] AddSkillRequest request)
    {
        var result = await _roadmapService.AddSkillAsync(GetUserId(), request);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("skills/{skillId:guid}")]
    public async Task<IActionResult> DeleteSkill(Guid skillId)
    {
        var result = await _roadmapService.DeleteSkillAsync(GetUserId(), skillId);
        return result.Succeeded ? Ok(result) : NotFound(result);
    }

    // ─── Roadmap ─────────────────────────────────────────────────────────────

    [HttpGet("active")]
    public async Task<IActionResult> GetActiveRoadmap()
    {
        var result = await _roadmapService.GetActiveRoadmapAsync(GetUserId());
        return result.Succeeded ? Ok(result) : NotFound(result);
    }

    [HttpPost("generate")]
    public async Task<IActionResult> GenerateRoadmap([FromBody] GenerateRoadmapRequest request)
    {
        var result = await _roadmapService.GenerateAiRoadmapAsync(GetUserId(), request);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("{roadmapId:guid}")]
    public async Task<IActionResult> DeleteRoadmap(Guid roadmapId)
    {
        var result = await _roadmapService.DeleteRoadmapAsync(GetUserId(), roadmapId);
        return result.Succeeded ? Ok(result) : NotFound(result);
    }

    // ─── Progress ────────────────────────────────────────────────────────────

    [HttpPut("progress")]
    public async Task<IActionResult> UpdateProgress([FromBody] UpdateNodeProgressRequest request)
    {
        var result = await _roadmapService.UpdateNodeProgressAsync(GetUserId(), request);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }
}
