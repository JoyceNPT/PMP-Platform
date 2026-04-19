namespace PMP.Application.Features.Finance.DTOs;

// ─── Category ─────────────────────────────────────────────────────────────────

public class FinanceCategoryDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Type { get; set; }           // 0 = Income, 1 = Expense
    public string? ColorHex { get; set; }
    public string? Icon { get; set; }
}

public class CreateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public int Type { get; set; }
    public string? ColorHex { get; set; }
    public string? Icon { get; set; }
}

public class UpdateCategoryRequest
{
    public string Name { get; set; } = string.Empty;
    public string? ColorHex { get; set; }
    public string? Icon { get; set; }
}

// ─── Transaction ──────────────────────────────────────────────────────────────

public class TransactionDto
{
    public Guid Id { get; set; }
    public Guid CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string? CategoryIcon { get; set; }
    public string? CategoryColor { get; set; }
    public int Type { get; set; }           // 0 = Income, 1 = Expense
    public decimal Amount { get; set; }
    public DateOnly TransactionDate { get; set; }
    public string? Note { get; set; }
}

public class CreateTransactionRequest
{
    public Guid CategoryId { get; set; }
    public int Type { get; set; }
    public decimal Amount { get; set; }
    public DateOnly TransactionDate { get; set; }
    public string? Note { get; set; }
}

public class UpdateTransactionRequest
{
    public Guid CategoryId { get; set; }
    public decimal Amount { get; set; }
    public DateOnly TransactionDate { get; set; }
    public string? Note { get; set; }
}

public class TransactionQueryParams
{
    public int? Month { get; set; }     // 1-12
    public int? Year { get; set; }
    public int? Type { get; set; }      // 0=Income, 1=Expense, null=all
    public Guid? CategoryId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

// ─── Saving Goal ─────────────────────────────────────────────────────────────

public class SavingGoalDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateOnly? TargetDate { get; set; }
    public int Status { get; set; }         // 0=InProgress, 1=Completed, 2=Cancelled
    public decimal ProgressPercent { get; set; }
    public decimal RemainingAmount { get; set; }
}

public class CreateSavingGoalRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateOnly? TargetDate { get; set; }
}

public class UpdateSavingGoalRequest
{
    public string Name { get; set; } = string.Empty;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateOnly? TargetDate { get; set; }
    public int Status { get; set; }
}

// ─── Finance Summary ─────────────────────────────────────────────────────────

public class MonthlySummaryDto
{
    public int Year { get; set; }
    public int Month { get; set; }
    public decimal TotalIncome { get; set; }
    public decimal TotalExpense { get; set; }
    public decimal Balance { get; set; }
    public decimal SavingsRate { get; set; }    // %
    public List<CategoryBreakdownDto> ExpenseBreakdown { get; set; } = [];
    public List<CategoryBreakdownDto> IncomeBreakdown { get; set; } = [];
    public List<DailyAmountDto> DailyExpenses { get; set; } = [];
    public List<MonthlyTrendDto> MonthlyTrend { get; set; } = [];  // 6 tháng gần nhất
}

public class CategoryBreakdownDto
{
    public string CategoryName { get; set; } = string.Empty;
    public string? ColorHex { get; set; }
    public string? Icon { get; set; }
    public decimal Amount { get; set; }
    public decimal Percent { get; set; }
}

public class DailyAmountDto
{
    public int Day { get; set; }
    public decimal Amount { get; set; }
}

public class MonthlyTrendDto
{
    public string Label { get; set; } = string.Empty;  // "Th.1", "Th.2"...
    public decimal Income { get; set; }
    public decimal Expense { get; set; }
}

// ─── AI Prediction ───────────────────────────────────────────────────────────

public class AiPredictionDto
{
    public decimal PredictedAmount { get; set; }
    public decimal? Confidence { get; set; }
    public string Insight { get; set; } = string.Empty;
    public string Month { get; set; } = string.Empty;
}
