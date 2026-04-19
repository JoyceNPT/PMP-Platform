using Microsoft.EntityFrameworkCore;
using PMP.Application.Features.Finance.DTOs;
using PMP.Application.Features.Finance.Interfaces;
using PMP.Domain.Entities.Finance;
using PMP.Domain.Enums;
using PMP.Infrastructure.Persistence;
using PMP.Shared.Wrappers;

namespace PMP.Infrastructure.Services.Finance;

public class FinanceService : IFinanceService
{
    private readonly ApplicationDbContext _db;

    public FinanceService(ApplicationDbContext db) => _db = db;

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static FinanceCategoryDto MapCategory(FinanceCategory c) => new()
    {
        Id       = c.Id,
        Name     = c.Name,
        Type     = (int)c.Type,
        ColorHex = c.ColorHex,
        Icon     = c.Icon
    };

    private static TransactionDto MapTransaction(Transaction t) => new()
    {
        Id              = t.Id,
        CategoryId      = t.CategoryId,
        CategoryName    = t.Category?.Name ?? "",
        CategoryIcon    = t.Category?.Icon,
        CategoryColor   = t.Category?.ColorHex,
        Type            = (int)t.Type,
        Amount          = t.Amount,
        TransactionDate = t.TransactionDate,
        Note            = t.Note
    };

    private static SavingGoalDto MapGoal(SavingGoal g) => new()
    {
        Id              = g.Id,
        Name            = g.Name,
        TargetAmount    = g.TargetAmount,
        CurrentAmount   = g.CurrentAmount,
        TargetDate      = g.TargetDate,
        Status          = (int)g.Status,
        ProgressPercent = g.TargetAmount > 0 ? Math.Round(g.CurrentAmount / g.TargetAmount * 100, 1) : 0,
        RemainingAmount = Math.Max(0, g.TargetAmount - g.CurrentAmount)
    };

    // ─── Categories ──────────────────────────────────────────────────────────

    public async Task<ApiResponse<List<FinanceCategoryDto>>> GetCategoriesAsync(Guid userId)
    {
        var cats = await _db.FinanceCategories
            .Where(c => c.UserId == userId)
            .OrderBy(c => c.Type).ThenBy(c => c.Name)
            .ToListAsync();
        return new ApiResponse<List<FinanceCategoryDto>>(cats.Select(MapCategory).ToList());
    }

    public async Task<ApiResponse<FinanceCategoryDto>> CreateCategoryAsync(Guid userId, CreateCategoryRequest req)
    {
        var cat = new FinanceCategory
        {
            UserId   = userId,
            Name     = req.Name,
            Type     = (TransactionType)req.Type,
            ColorHex = req.ColorHex,
            Icon     = req.Icon
        };
        _db.FinanceCategories.Add(cat);
        await _db.SaveChangesAsync();
        return new ApiResponse<FinanceCategoryDto>(MapCategory(cat), "Tạo danh mục thành công.");
    }

    public async Task<ApiResponse<FinanceCategoryDto>> UpdateCategoryAsync(Guid userId, Guid categoryId, UpdateCategoryRequest req)
    {
        var cat = await _db.FinanceCategories.FirstOrDefaultAsync(c => c.Id == categoryId && c.UserId == userId);
        if (cat is null) return new ApiResponse<FinanceCategoryDto>("Không tìm thấy danh mục.");

        cat.Name = req.Name;
        cat.ColorHex = req.ColorHex;
        cat.Icon = req.Icon;

        await _db.SaveChangesAsync();
        return new ApiResponse<FinanceCategoryDto>(MapCategory(cat), "Đã cập nhật danh mục.");
    }

    public async Task<ApiResponse<bool>> DeleteCategoryAsync(Guid userId, Guid categoryId)
    {
        var cat = await _db.FinanceCategories.FirstOrDefaultAsync(c => c.Id == categoryId && c.UserId == userId);
        if (cat is null) return new ApiResponse<bool>("Không tìm thấy danh mục.");
        _db.FinanceCategories.Remove(cat);
        await _db.SaveChangesAsync();
        return new ApiResponse<bool>(true, "Đã xoá danh mục.");
    }

    // ─── Transactions ─────────────────────────────────────────────────────────

    public async Task<ApiResponse<List<TransactionDto>>> GetTransactionsAsync(Guid userId, TransactionQueryParams q)
    {
        var query = _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId);

        if (q.Month.HasValue && q.Year.HasValue)
            query = query.Where(t => t.TransactionDate.Month == q.Month && t.TransactionDate.Year == q.Year);
        else if (q.Year.HasValue)
            query = query.Where(t => t.TransactionDate.Year == q.Year);

        if (q.Type.HasValue)
            query = query.Where(t => (int)t.Type == q.Type.Value);

        if (q.CategoryId.HasValue)
            query = query.Where(t => t.CategoryId == q.CategoryId.Value);

        var data = await query
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .ToListAsync();

        return new ApiResponse<List<TransactionDto>>(data.Select(MapTransaction).ToList());
    }

    public async Task<ApiResponse<TransactionDto>> CreateTransactionAsync(Guid userId, CreateTransactionRequest req)
    {
        var cat = await _db.FinanceCategories.FirstOrDefaultAsync(c => c.Id == req.CategoryId && c.UserId == userId);
        if (cat is null) return new ApiResponse<TransactionDto>("Danh mục không hợp lệ.");

        var tx = new Transaction
        {
            UserId          = userId,
            CategoryId      = req.CategoryId,
            Type            = (TransactionType)req.Type,
            Amount          = req.Amount,
            TransactionDate = req.TransactionDate,
            Note            = req.Note
        };
        tx.Category = cat;
        _db.Transactions.Add(tx);
        await _db.SaveChangesAsync();
        return new ApiResponse<TransactionDto>(MapTransaction(tx), "Đã thêm giao dịch.");
    }

    public async Task<ApiResponse<TransactionDto>> UpdateTransactionAsync(Guid userId, Guid txId, UpdateTransactionRequest req)
    {
        var tx = await _db.Transactions.Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == txId && t.UserId == userId);
        if (tx is null) return new ApiResponse<TransactionDto>("Không tìm thấy giao dịch.");

        tx.CategoryId      = req.CategoryId;
        tx.Amount          = req.Amount;
        tx.TransactionDate = req.TransactionDate;
        tx.Note            = req.Note;
        await _db.SaveChangesAsync();

        // reload category
        tx.Category = await _db.FinanceCategories.FindAsync(req.CategoryId) ?? tx.Category;
        return new ApiResponse<TransactionDto>(MapTransaction(tx), "Đã cập nhật giao dịch.");
    }

    public async Task<ApiResponse<bool>> DeleteTransactionAsync(Guid userId, Guid txId)
    {
        var tx = await _db.Transactions.FirstOrDefaultAsync(t => t.Id == txId && t.UserId == userId);
        if (tx is null) return new ApiResponse<bool>("Không tìm thấy giao dịch.");
        _db.Transactions.Remove(tx);
        await _db.SaveChangesAsync();
        return new ApiResponse<bool>(true, "Đã xoá giao dịch.");
    }

    // ─── Saving Goals ─────────────────────────────────────────────────────────

    public async Task<ApiResponse<List<SavingGoalDto>>> GetSavingGoalsAsync(Guid userId)
    {
        var goals = await _db.SavingGoals.Where(g => g.UserId == userId)
            .OrderBy(g => g.Status).ThenBy(g => g.TargetDate)
            .ToListAsync();
        return new ApiResponse<List<SavingGoalDto>>(goals.Select(MapGoal).ToList());
    }

    public async Task<ApiResponse<SavingGoalDto>> CreateSavingGoalAsync(Guid userId, CreateSavingGoalRequest req)
    {
        var goal = new SavingGoal
        {
            UserId        = userId,
            Name          = req.Name,
            TargetAmount  = req.TargetAmount,
            CurrentAmount = req.CurrentAmount,
            TargetDate    = req.TargetDate
        };
        _db.SavingGoals.Add(goal);
        await _db.SaveChangesAsync();
        return new ApiResponse<SavingGoalDto>(MapGoal(goal), "Tạo mục tiêu tiết kiệm thành công.");
    }

    public async Task<ApiResponse<SavingGoalDto>> UpdateSavingGoalAsync(Guid userId, Guid goalId, UpdateSavingGoalRequest req)
    {
        var goal = await _db.SavingGoals.FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId);
        if (goal is null) return new ApiResponse<SavingGoalDto>("Không tìm thấy mục tiêu.");
        goal.Name          = req.Name;
        goal.TargetAmount  = req.TargetAmount;
        goal.CurrentAmount = req.CurrentAmount;
        goal.TargetDate    = req.TargetDate;
        goal.Status        = (SavingGoalStatus)req.Status;
        await _db.SaveChangesAsync();
        return new ApiResponse<SavingGoalDto>(MapGoal(goal), "Cập nhật thành công.");
    }

    public async Task<ApiResponse<bool>> DeleteSavingGoalAsync(Guid userId, Guid goalId)
    {
        var goal = await _db.SavingGoals.FirstOrDefaultAsync(g => g.Id == goalId && g.UserId == userId);
        if (goal is null) return new ApiResponse<bool>("Không tìm thấy mục tiêu.");
        _db.SavingGoals.Remove(goal);
        await _db.SaveChangesAsync();
        return new ApiResponse<bool>(true, "Đã xoá mục tiêu.");
    }

    // ─── Summary ─────────────────────────────────────────────────────────────

    public async Task<ApiResponse<MonthlySummaryDto>> GetMonthlySummaryAsync(Guid userId, int year, int month)
    {
        var txs = await _db.Transactions
            .Include(t => t.Category)
            .Where(t => t.UserId == userId && t.TransactionDate.Year == year && t.TransactionDate.Month == month)
            .ToListAsync();

        var income  = txs.Where(t => t.Type == TransactionType.Income).ToList();
        var expense = txs.Where(t => t.Type == TransactionType.Expense).ToList();

        var totalIncome  = income.Sum(t => t.Amount);
        var totalExpense = expense.Sum(t => t.Amount);
        var savingsRate  = totalIncome > 0 ? Math.Round((totalIncome - totalExpense) / totalIncome * 100, 1) : 0;

        // Expense breakdown by category
        var expBreakdown = expense
            .GroupBy(t => t.Category)
            .Select(g => new CategoryBreakdownDto
            {
                CategoryName = g.Key?.Name ?? "",
                ColorHex     = g.Key?.ColorHex,
                Icon         = g.Key?.Icon,
                Amount       = g.Sum(t => t.Amount),
                Percent      = totalExpense > 0 ? Math.Round(g.Sum(t => t.Amount) / totalExpense * 100, 1) : 0
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        // Income breakdown
        var incBreakdown = income
            .GroupBy(t => t.Category)
            .Select(g => new CategoryBreakdownDto
            {
                CategoryName = g.Key?.Name ?? "",
                ColorHex     = g.Key?.ColorHex,
                Icon         = g.Key?.Icon,
                Amount       = g.Sum(t => t.Amount),
                Percent      = totalIncome > 0 ? Math.Round(g.Sum(t => t.Amount) / totalIncome * 100, 1) : 0
            })
            .OrderByDescending(c => c.Amount)
            .ToList();

        // Daily expenses
        var daily = expense
            .GroupBy(t => t.TransactionDate.Day)
            .Select(g => new DailyAmountDto { Day = g.Key, Amount = g.Sum(t => t.Amount) })
            .OrderBy(d => d.Day)
            .ToList();

        // Monthly trend (6 months)
        var trend = new List<MonthlyTrendDto>();
        for (int i = 5; i >= 0; i--)
        {
            var d = new DateOnly(year, month, 1).AddMonths(-i);
            var monthTxs = await _db.Transactions
                .Where(t => t.UserId == userId && t.TransactionDate.Year == d.Year && t.TransactionDate.Month == d.Month)
                .ToListAsync();
            trend.Add(new MonthlyTrendDto
            {
                Label   = $"Th.{d.Month}",
                Income  = monthTxs.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount),
                Expense = monthTxs.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount)
            });
        }

        return new ApiResponse<MonthlySummaryDto>(new MonthlySummaryDto
        {
            Year             = year,
            Month            = month,
            TotalIncome      = totalIncome,
            TotalExpense     = totalExpense,
            Balance          = totalIncome - totalExpense,
            SavingsRate      = savingsRate,
            ExpenseBreakdown = expBreakdown,
            IncomeBreakdown  = incBreakdown,
            DailyExpenses    = daily,
            MonthlyTrend     = trend
        });
    }

    // ─── AI Prediction (Gemini mock — Phase 5 placeholder) ───────────────────

    public async Task<ApiResponse<AiPredictionDto>> GetAiPredictionAsync(Guid userId)
    {
        var now   = DateTime.UtcNow;
        var last3 = await _db.Transactions
            .Where(t => t.UserId == userId
                && t.Type == TransactionType.Expense
                && t.TransactionDate >= DateOnly.FromDateTime(now.AddMonths(-3)))
            .ToListAsync();

        if (!last3.Any())
        {
            return new ApiResponse<AiPredictionDto>(new AiPredictionDto
            {
                PredictedAmount = 0,
                Confidence      = 0,
                Month           = $"Th.{now.Month + 1}/{now.Year}",
                Insight         = "Chưa đủ dữ liệu để dự đoán. Hãy ghi lại chi tiêu trong ít nhất 1 tháng."
            });
        }

        // Simple linear average prediction
        var avgMonthly = last3.Sum(t => t.Amount) / 3;
        var predicted  = Math.Round(avgMonthly * 1.05m, 0); // +5% trend

        // Save prediction to DB
        var predictionDate = DateOnly.FromDateTime(new DateTime(now.Year, now.Month, 1).AddMonths(1));
        var existing = await _db.AiSpendingPredictions
            .FirstOrDefaultAsync(p => p.UserId == userId && p.PredictionMonth == predictionDate);

        if (existing is null)
        {
            _db.AiSpendingPredictions.Add(new Domain.Entities.Finance.AiSpendingPrediction
            {
                UserId          = userId,
                PredictionMonth = predictionDate,
                PredictedAmount = predicted,
                Confidence      = 0.72m,
                RawResponse     = "Mock prediction — Gemini integration pending"
            });
            await _db.SaveChangesAsync();
        }

        return new ApiResponse<AiPredictionDto>(new AiPredictionDto
        {
            PredictedAmount = predicted,
            Confidence      = 0.72m,
            Month           = $"Th.{predictionDate.Month}/{predictionDate.Year}",
            Insight         = $"Dựa trên chi tiêu trung bình 3 tháng gần nhất ({avgMonthly:N0}đ/tháng), " +
                              $"dự đoán tháng tới bạn sẽ chi khoảng {predicted:N0}đ. " +
                              $"Hãy lên kế hoạch ngân sách phù hợp!"
        });
    }

    // ─── Reset ───────────────────────────────────────────────────────────────

    public async Task<ApiResponse<bool>> ResetFinanceDataAsync(Guid userId)
    {
        // Must delete transactions first due to foreign keys to Category
        var txs = await _db.Transactions.Where(t => t.UserId == userId).ToListAsync();
        _db.Transactions.RemoveRange(txs);

        var cats = await _db.FinanceCategories.Where(c => c.UserId == userId).ToListAsync();
        _db.FinanceCategories.RemoveRange(cats);

        var goals = await _db.SavingGoals.Where(g => g.UserId == userId).ToListAsync();
        _db.SavingGoals.RemoveRange(goals);

        var predictions = await _db.AiSpendingPredictions.Where(p => p.UserId == userId).ToListAsync();
        _db.AiSpendingPredictions.RemoveRange(predictions);

        await _db.SaveChangesAsync();
        return new ApiResponse<bool>(true, "Đã xoá toàn bộ dữ liệu tài chính.");
    }
}
