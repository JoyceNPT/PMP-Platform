using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMP.Application.Features.GPA.DTOs;
using PMP.Application.Features.GPA.Interfaces;

namespace PMP.API.Controllers.GPA;

[Authorize]
[ApiController]
[Route("api/gpa")]
[Produces("application/json")]
public class GpaController : ControllerBase
{
    private readonly IGpaService _gpaService;

    public GpaController(IGpaService gpaService) => _gpaService = gpaService;

    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── Config ──────────────────────────────────────────────────────────────

    [HttpGet("config")]
    public async Task<IActionResult> GetConfig()
    {
        var result = await _gpaService.GetOrCreateConfigAsync(GetUserId());
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    [HttpPut("config")]
    public async Task<IActionResult> UpsertConfig([FromBody] UpsertGpaConfigRequest request)
    {
        var result = await _gpaService.UpsertConfigAsync(GetUserId(), request);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    // ─── Summary ─────────────────────────────────────────────────────────────

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        var result = await _gpaService.GetSummaryAsync(GetUserId());
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    // ─── Academic Years ───────────────────────────────────────────────────────

    [HttpGet("years")]
    public async Task<IActionResult> GetYears()
    {
        var result = await _gpaService.GetAcademicYearsAsync(GetUserId());
        return Ok(result);
    }

    [HttpPost("years")]
    public async Task<IActionResult> CreateYear([FromBody] CreateAcademicYearRequest request)
    {
        var result = await _gpaService.CreateAcademicYearAsync(GetUserId(), request);
        return result.Succeeded ? CreatedAtAction(nameof(GetSummary), result) : BadRequest(result);
    }

    [HttpDelete("years/{yearId:guid}")]
    public async Task<IActionResult> DeleteYear(Guid yearId)
    {
        var result = await _gpaService.DeleteAcademicYearAsync(GetUserId(), yearId);
        return result.Succeeded ? Ok(result) : NotFound(result);
    }

    // ─── Semesters ───────────────────────────────────────────────────────────

    [HttpPost("semesters")]
    public async Task<IActionResult> CreateSemester([FromBody] CreateSemesterRequest request)
    {
        var result = await _gpaService.CreateSemesterAsync(GetUserId(), request);
        return result.Succeeded ? CreatedAtAction(nameof(GetSummary), result) : BadRequest(result);
    }

    [HttpDelete("semesters/{semesterId:guid}")]
    public async Task<IActionResult> DeleteSemester(Guid semesterId)
    {
        var result = await _gpaService.DeleteSemesterAsync(GetUserId(), semesterId);
        return result.Succeeded ? Ok(result) : NotFound(result);
    }

    // ─── Courses ─────────────────────────────────────────────────────────────

    [HttpPost("courses")]
    public async Task<IActionResult> CreateCourse([FromBody] CreateCourseRequest request)
    {
        var result = await _gpaService.CreateCourseAsync(GetUserId(), request);
        return result.Succeeded ? CreatedAtAction(nameof(GetSummary), result) : BadRequest(result);
    }

    [HttpPut("courses/{courseId:guid}")]
    public async Task<IActionResult> UpdateCourse(Guid courseId, [FromBody] UpdateCourseRequest request)
    {
        var result = await _gpaService.UpdateCourseAsync(GetUserId(), courseId, request);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("courses/{courseId:guid}")]
    public async Task<IActionResult> DeleteCourse(Guid courseId)
    {
        var result = await _gpaService.DeleteCourseAsync(GetUserId(), courseId);
        return result.Succeeded ? Ok(result) : NotFound(result);
    }
}
