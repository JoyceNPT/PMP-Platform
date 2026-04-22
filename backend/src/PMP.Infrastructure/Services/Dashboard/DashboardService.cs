using Microsoft.EntityFrameworkCore;
using PMP.Application.Features.Dashboard.DTOs;
using PMP.Application.Features.Dashboard.Interfaces;
using PMP.Domain.Enums;
using PMP.Infrastructure.Persistence;
using PMP.Shared.Wrappers;

namespace PMP.Infrastructure.Services.Dashboard;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _db;

    public DashboardService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ApiResponse<DashboardOverviewDto>> GetOverviewAsync(Guid userId)
    {
        // 1. GPA Calc
        var courses = await _db.Courses.Where(c => c.UserId == userId && c.Score != null).ToListAsync();
        decimal currentGpa = 0;
        if (courses.Any())
        {
            var totalCr = courses.Sum(c => c.Credits);
            if (totalCr > 0)
                currentGpa = courses.Sum(c => c.Score!.Value * c.Credits) / totalCr;
        }

        string ranking = currentGpa switch
        {
            < 5.0m => "Trung bình",
            < 8.0m => "Khá",
            < 9.0m => "Giỏi",
            _ => "Xuất sắc"
        };

        // 2. Finance Calc (Current Month)
        var now = DateOnly.FromDateTime(DateTime.UtcNow);
        var startOfMonth = new DateOnly(now.Year, now.Month, 1);
        var financeData = await _db.Transactions
            .Where(t => t.UserId == userId && t.TransactionDate >= startOfMonth)
            .ToListAsync();

        decimal income = financeData.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
        decimal expense = financeData.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);

        // 3. Savings Goal
        var activeGoal = await _db.SavingGoals
            .Where(g => g.UserId == userId && g.Status == SavingGoalStatus.InProgress)
            .OrderByDescending(g => g.CreatedAt)
            .FirstOrDefaultAsync();

        decimal savingsProgress = 0;
        if (activeGoal != null && activeGoal.TargetAmount > 0)
        {
            savingsProgress = (activeGoal.CurrentAmount / activeGoal.TargetAmount) * 100;
        }

        // 4. Roadmap
        var activeRoadmap = await _db.CareerRoadmaps
            .Include(r => r.Nodes).ThenInclude(n => n.UserProgress)
            .FirstOrDefaultAsync(r => r.UserId == userId && r.IsActive);

        int totalNodes = activeRoadmap?.Nodes.Count ?? 0;
        int completedNodes = activeRoadmap?.Nodes
            .Count(n => n.UserProgress.Any(p => p.UserId == userId && p.Status == NodeStatus.Completed)) ?? 0;

        var overview = new DashboardOverviewDto
        {
            CurrentGpa = Math.Round(currentGpa, 2),
            GpaRanking = ranking,
            MonthlyIncome = income,
            MonthlyExpense = expense,
            SavingsProgress = Math.Round(savingsProgress, 1),
            TotalRoadmapNodes = totalNodes,
            CompletedRoadmapNodes = completedNodes,
            RecentActivities = [] // Optional: implement activity logging later
        };

        return new ApiResponse<DashboardOverviewDto>(overview);
    }
}
