using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMP.Application.Features.Finance.DTOs;
using PMP.Application.Features.Finance.Interfaces;

namespace PMP.API.Controllers.Finance;

[Authorize]
[ApiController]
[Route("api/finance")]
[Produces("application/json")]
public class FinanceController : ControllerBase
{
    private readonly IFinanceService _financeService;
    public FinanceController(IFinanceService financeService) => _financeService = financeService;

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ─── Categories ──────────────────────────────────────────────────────────

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
        => Ok(await _financeService.GetCategoriesAsync(GetUserId()));

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest req)
    {
        var result = await _financeService.CreateCategoryAsync(GetUserId(), req);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    [HttpPut("categories/{id:guid}")]
    public async Task<IActionResult> UpdateCategory(Guid id, [FromBody] UpdateCategoryRequest req)
    {
        var result = await _financeService.UpdateCategoryAsync(GetUserId(), id, req);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("categories/{id:guid}")]
    public async Task<IActionResult> DeleteCategory(Guid id)
    {
        var result = await _financeService.DeleteCategoryAsync(GetUserId(), id);
        return result.Succeeded ? Ok(result) : NotFound(result);
    }

    // ─── Transactions ─────────────────────────────────────────────────────────

    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] TransactionQueryParams q)
        => Ok(await _financeService.GetTransactionsAsync(GetUserId(), q));

    [HttpPost("transactions")]
    public async Task<IActionResult> CreateTransaction([FromBody] CreateTransactionRequest req)
    {
        var result = await _financeService.CreateTransactionAsync(GetUserId(), req);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    [HttpPut("transactions/{id:guid}")]
    public async Task<IActionResult> UpdateTransaction(Guid id, [FromBody] UpdateTransactionRequest req)
    {
        var result = await _financeService.UpdateTransactionAsync(GetUserId(), id, req);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("transactions/{id:guid}")]
    public async Task<IActionResult> DeleteTransaction(Guid id)
    {
        var result = await _financeService.DeleteTransactionAsync(GetUserId(), id);
        return result.Succeeded ? Ok(result) : NotFound(result);
    }

    // ─── Saving Goals ─────────────────────────────────────────────────────────

    [HttpGet("saving-goals")]
    public async Task<IActionResult> GetSavingGoals()
        => Ok(await _financeService.GetSavingGoalsAsync(GetUserId()));

    [HttpPost("saving-goals")]
    public async Task<IActionResult> CreateSavingGoal([FromBody] CreateSavingGoalRequest req)
    {
        var result = await _financeService.CreateSavingGoalAsync(GetUserId(), req);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    [HttpPut("saving-goals/{id:guid}")]
    public async Task<IActionResult> UpdateSavingGoal(Guid id, [FromBody] UpdateSavingGoalRequest req)
    {
        var result = await _financeService.UpdateSavingGoalAsync(GetUserId(), id, req);
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }

    [HttpDelete("saving-goals/{id:guid}")]
    public async Task<IActionResult> DeleteSavingGoal(Guid id)
    {
        var result = await _financeService.DeleteSavingGoalAsync(GetUserId(), id);
        return result.Succeeded ? Ok(result) : NotFound(result);
    }

    // ─── Summary & AI ─────────────────────────────────────────────────────────

    [HttpGet("summary")]
    public async Task<IActionResult> GetMonthlySummary([FromQuery] int? year, [FromQuery] int? month)
    {
        var now = DateTime.UtcNow;
        var result = await _financeService.GetMonthlySummaryAsync(GetUserId(), year ?? now.Year, month ?? now.Month);
        return Ok(result);
    }

    [HttpGet("ai-prediction")]
    public async Task<IActionResult> GetAiPrediction()
        => Ok(await _financeService.GetAiPredictionAsync(GetUserId()));

    [HttpDelete("reset")]
    public async Task<IActionResult> ResetFinanceData()
    {
        var result = await _financeService.ResetFinanceDataAsync(GetUserId());
        return result.Succeeded ? Ok(result) : BadRequest(result);
    }
}
