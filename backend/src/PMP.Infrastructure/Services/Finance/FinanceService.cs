using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using PMP.Application.Features.Finance.DTOs;
using PMP.Application.Features.Finance.Interfaces;
using PMP.Application.Features.System.Interfaces;
using PMP.Domain.Entities.Auth;
using PMP.Domain.Entities.Finance;
using PMP.Domain.Enums;
using PMP.Infrastructure.Hubs;
using PMP.Infrastructure.Persistence;
using PMP.Infrastructure.Services.System;
using PMP.Shared.Wrappers;
using System.Text.Json;

namespace PMP.Infrastructure.Services.Finance;

public class FinanceService : IFinanceService
{
    private readonly ApplicationDbContext _db;
    private readonly IAiService _aiService;
    private readonly IHubContext<FinanceHub> _financeHub;
    private readonly IHubContext<NotificationHub> _notificationHub;
    private readonly IStorageService _storageService;

    public FinanceService(
        ApplicationDbContext db,
        IAiService aiService,
        IHubContext<FinanceHub> financeHub,
        IHubContext<NotificationHub> notificationHub,
        IStorageService storageService)
    {
        _db = db;
        _aiService = aiService;
        _financeHub = financeHub;
        _notificationHub = notificationHub;
        _storageService = storageService;
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static FinanceCategoryDto MapCategory(FinanceCategory c) => new()
    {
        Id       = c.Id,
        Name     = c.Name,
        Type     = (int)c.Type,
        ColorHex = c.ColorHex,
        Icon     = c.Icon
    };

    private static string DisplayName(ApplicationUser? user)
        => user?.FullName?.Trim().Length > 0 ? user.FullName : user?.Email ?? "Người dùng";

    private static TransactionDto MapTransaction(Transaction t, IReadOnlyDictionary<Guid, string>? ownerNames = null) => new()
    {
        Id              = t.Id,
        OwnerUserId     = t.UserId,
        OwnerName       = ownerNames is not null && ownerNames.TryGetValue(t.UserId, out var ownerName) ? ownerName : "",
        CategoryId      = t.CategoryId,
        CategoryName    = t.Category?.Name ?? "",
        CategoryIcon    = t.Category?.Icon,
        CategoryColor   = t.Category?.ColorHex,
        Type            = (int)t.Type,
        Amount          = t.Amount,
        TransactionDate = t.TransactionDate,
        Note            = t.Note,
        AttachmentUrl   = t.AttachmentUrl
    };

    private static FinanceGroupMemberDto MapMember(FinanceGroupMember m) => new()
    {
        UserId      = m.UserId,
        DisplayName = DisplayName(m.User),
        Email       = m.User.Email,
        Status      = (int)m.Status,
        JoinedAt    = m.JoinedAt
    };

    private static FinanceGroupDto MapGroup(FinanceGroup g) => new()
    {
        Id              = g.Id,
        Name            = g.Name,
        CreatedByUserId = g.CreatedByUserId,
        Members         = g.Members
            .Where(m => m.Status == FinanceGroupMemberStatus.Active)
            .OrderBy(m => m.JoinedAt)
            .Select(MapMember)
            .ToList()
    };

    private static FinanceGroupInviteDto MapInvite(FinanceGroupInvite i) => new()
    {
        Id             = i.Id,
        FinanceGroupId = i.FinanceGroupId,
        GroupName      = i.FinanceGroup.Name,
        InviterUserId  = i.InviterUserId,
        InviterName    = DisplayName(i.InviterUser),
        InviteeUserId  = i.InviteeUserId,
        InviteeName    = DisplayName(i.InviteeUser),
        Status         = (int)i.Status,
        ExpiresAt      = i.ExpiresAt,
        CreatedAt      = i.CreatedAt
    };

    private async Task DeleteAttachmentIfChangedAsync(string? oldUrl, string? newUrl)
    {
        if (string.IsNullOrWhiteSpace(oldUrl))
            return;

        if (string.Equals(oldUrl, newUrl, StringComparison.Ordinal))
            return;

        await _storageService.DeleteFileAsync(oldUrl);
    }

    private async Task<List<Guid>> GetFinanceUserScopeAsync(Guid userId)
    {
        var activeGroupId = await _db.FinanceGroupMembers
            .Where(m => m.UserId == userId && m.Status == FinanceGroupMemberStatus.Active)
            .Select(m => (Guid?)m.FinanceGroupId)
            .FirstOrDefaultAsync();

        if (activeGroupId is null)
            return [userId];

        return await _db.FinanceGroupMembers
            .Where(m => m.FinanceGroupId == activeGroupId && m.Status == FinanceGroupMemberStatus.Active)
            .Select(m => m.UserId)
            .Distinct()
            .ToListAsync();
    }

    private async Task<Guid?> GetActiveGroupIdAsync(Guid userId)
        => await _db.FinanceGroupMembers
            .Where(m => m.UserId == userId && m.Status == FinanceGroupMemberStatus.Active)
            .Select(m => (Guid?)m.FinanceGroupId)
            .FirstOrDefaultAsync();

    private async Task<Dictionary<Guid, string>> GetOwnerNamesAsync(IEnumerable<Guid> userIds)
    {
        var ids = userIds.Distinct().ToList();
        if (ids.Count == 0)
            return [];

        var users = await _db.Users
            .Where(u => ids.Contains(u.Id))
            .Select(u => new { u.Id, u.FullName, u.Email })
            .ToListAsync();

        return users.ToDictionary(
            u => u.Id,
            u => !string.IsNullOrWhiteSpace(u.FullName) ? u.FullName : u.Email ?? "Người dùng");
    }

    private async Task NotifyFinanceTransactionCreatedAsync(Guid actorUserId, Transaction tx)
    {
        var groupId = await GetActiveGroupIdAsync(actorUserId);
        if (groupId is null)
            return;

        var members = await _db.FinanceGroupMembers
            .Include(m => m.User)
            .Where(m => m.FinanceGroupId == groupId && m.Status == FinanceGroupMemberStatus.Active)
            .ToListAsync();

        if (members.Count <= 1)
            return;

        var actor = members.FirstOrDefault(m => m.UserId == actorUserId)?.User;
        var actorName = DisplayName(actor);
        var typeLabel = tx.Type == TransactionType.Income ? "khoản thu" : "khoản chi";
        var amount = tx.Amount.ToString("N0");

        var notifications = members.Select(member => new PMP.Domain.Entities.System.Notification
        {
            UserId = member.UserId,
            Type = NotificationType.Finance,
            Title = "Tài chính gộp có giao dịch mới",
            Body = $"{actorName} vừa tạo {typeLabel} {amount}đ trong nhóm tài chính."
        }).ToList();

        _db.Notifications.AddRange(notifications);
        await _db.SaveChangesAsync();

        foreach (var notification in notifications)
        {
            await _notificationHub.Clients.Group(notification.UserId.ToString()).SendAsync("NotificationReceived", new
            {
                notification.Id,
                notification.Title,
                notification.Body,
                Type = (int)notification.Type,
                notification.IsRead,
                notification.CreatedAt,
                notification.ReadAt
            });
        }
    }

    private async Task<FinanceShareProfile> EnsureShareProfileAsync(Guid userId)
    {
        var profile = await _db.FinanceShareProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile is not null)
            return profile;

        string code;
        do
        {
            code = $"FIN-{Random.Shared.Next(100000, 999999)}";
        } while (await _db.FinanceShareProfiles.AnyAsync(p => p.InviteCode == code));

        profile = new FinanceShareProfile
        {
            UserId = userId,
            InviteCode = code
        };

        _db.FinanceShareProfiles.Add(profile);
        await _db.SaveChangesAsync();
        return profile;
    }

    private async Task<FinanceGroup> EnsureActiveGroupAsync(Guid userId)
    {
        var existing = await _db.FinanceGroups
            .Include(g => g.Members).ThenInclude(m => m.User)
            .FirstOrDefaultAsync(g => g.Members.Any(m => m.UserId == userId && m.Status == FinanceGroupMemberStatus.Active));

        if (existing is not null)
            return existing;

        var user = await _db.Users.FirstAsync(u => u.Id == userId);
        var group = new FinanceGroup
        {
            CreatedByUserId = userId,
            Name = $"Tài chính gộp của {DisplayName(user)}"
        };

        group.Members.Add(new FinanceGroupMember
        {
            UserId = userId,
            Status = FinanceGroupMemberStatus.Active
        });

        _db.FinanceGroups.Add(group);
        await _db.SaveChangesAsync();
        return group;
    }

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
        var scopeUserIds = await GetFinanceUserScopeAsync(userId);
        var query = _db.Transactions
            .Include(t => t.Category)
            .Where(t => scopeUserIds.Contains(t.UserId));

        if (q.FromDate.HasValue)
            query = query.Where(t => t.TransactionDate >= q.FromDate.Value);

        if (q.ToDate.HasValue)
            query = query.Where(t => t.TransactionDate <= q.ToDate.Value);

        if (!q.FromDate.HasValue && !q.ToDate.HasValue && q.Month.HasValue && q.Year.HasValue)
            query = query.Where(t => t.TransactionDate.Month == q.Month && t.TransactionDate.Year == q.Year);
        else if (!q.FromDate.HasValue && !q.ToDate.HasValue && q.Year.HasValue)
            query = query.Where(t => t.TransactionDate.Year == q.Year);

        if (q.Type.HasValue)
            query = query.Where(t => (int)t.Type == q.Type.Value);

        if (q.CategoryId.HasValue)
            query = query.Where(t => t.CategoryId == q.CategoryId.Value);

        if (q.OwnerUserId.HasValue && scopeUserIds.Contains(q.OwnerUserId.Value))
            query = query.Where(t => t.UserId == q.OwnerUserId.Value);

        if (!string.IsNullOrWhiteSpace(q.Note))
        {
            var noteKeyword = q.Note.Trim();
            query = query.Where(t => t.Note != null && EF.Functions.ILike(t.Note, $"%{noteKeyword}%"));
        }

        var data = await query
            .OrderByDescending(t => t.TransactionDate)
            .ThenByDescending(t => t.CreatedAt)
            .Skip((q.Page - 1) * q.PageSize)
            .Take(q.PageSize)
            .ToListAsync();

        var ownerNames = await GetOwnerNamesAsync(data.Select(t => t.UserId));
        return new ApiResponse<List<TransactionDto>>(data.Select(t => MapTransaction(t, ownerNames)).ToList());
    }

    public async Task<ApiResponse<TransactionDto>> CreateTransactionAsync(Guid userId, CreateTransactionRequest req)
    {
        var cat = await _db.FinanceCategories.FirstOrDefaultAsync(c => c.Id == req.CategoryId && c.UserId == userId);
        if (cat is null) return new ApiResponse<TransactionDto>("Danh mục không hợp lệ.");
        var userNames = await GetOwnerNamesAsync([userId]);

        var tx = new Transaction
        {
            UserId          = userId,
            CategoryId      = req.CategoryId,
            Type            = (TransactionType)req.Type,
            Amount          = req.Amount,
            TransactionDate = req.TransactionDate,
            Note            = req.Note,
            AttachmentUrl   = req.AttachmentUrl
        };
        tx.Category = cat;
        _db.Transactions.Add(tx);
        await _db.SaveChangesAsync();
        await NotifyFinanceTransactionCreatedAsync(userId, tx);
        return new ApiResponse<TransactionDto>(MapTransaction(tx, userNames), "Đã thêm giao dịch.");
    }

    public async Task<ApiResponse<TransactionDto>> UpdateTransactionAsync(Guid userId, Guid txId, UpdateTransactionRequest req)
    {
        var tx = await _db.Transactions.Include(t => t.Category)
            .FirstOrDefaultAsync(t => t.Id == txId && t.UserId == userId);
        if (tx is null) return new ApiResponse<TransactionDto>("Không tìm thấy giao dịch.");

        var oldAttachmentUrl = tx.AttachmentUrl;
        tx.CategoryId      = req.CategoryId;
        tx.Amount          = req.Amount;
        tx.TransactionDate = req.TransactionDate;
        tx.Note            = req.Note;
        tx.AttachmentUrl   = req.AttachmentUrl;
        await _db.SaveChangesAsync();
        await DeleteAttachmentIfChangedAsync(oldAttachmentUrl, req.AttachmentUrl);

        // reload category
        tx.Category = await _db.FinanceCategories.FindAsync(req.CategoryId) ?? tx.Category;
        var userNames = await GetOwnerNamesAsync([userId]);
        return new ApiResponse<TransactionDto>(MapTransaction(tx, userNames), "Đã cập nhật giao dịch.");
    }

    public async Task<ApiResponse<bool>> DeleteTransactionAsync(Guid userId, Guid txId)
    {
        var tx = await _db.Transactions.FirstOrDefaultAsync(t => t.Id == txId && t.UserId == userId);
        if (tx is null) return new ApiResponse<bool>("Không tìm thấy giao dịch.");
        var oldAttachmentUrl = tx.AttachmentUrl;
        _db.Transactions.Remove(tx);
        await _db.SaveChangesAsync();
        await DeleteAttachmentIfChangedAsync(oldAttachmentUrl, null);
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
        var scopeUserIds = await GetFinanceUserScopeAsync(userId);
        var txs = await _db.Transactions
            .Include(t => t.Category)
            .Where(t => scopeUserIds.Contains(t.UserId) && t.TransactionDate.Year == year && t.TransactionDate.Month == month)
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
                .Where(t => scopeUserIds.Contains(t.UserId) && t.TransactionDate.Year == d.Year && t.TransactionDate.Month == d.Month)
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

    // ─── AI Prediction (Real Gemini Integration) ─────────────────────────────

    public async Task<ApiResponse<AiPredictionDto>> GetAiPredictionAsync(Guid userId, bool forceReload = false, string scope = "group")
    {
        var now = DateTime.UtcNow;
        var predictionMonth = DateOnly.FromDateTime(new DateTime(now.Year, now.Month, 1).AddMonths(1));
        var useGroupScope = scope.Equals("group", StringComparison.OrdinalIgnoreCase);
        var scopeUserIds = useGroupScope ? await GetFinanceUserScopeAsync(userId) : new List<Guid> { userId };

        // 1. Check existing prediction if not forced
        if (!forceReload && !useGroupScope)
        {
            var existing = await _db.AiSpendingPredictions
                .FirstOrDefaultAsync(p => p.UserId == userId && p.PredictionMonth == predictionMonth);

            if (existing != null)
            {
                return new ApiResponse<AiPredictionDto>(new AiPredictionDto
                {
                    PredictedAmount = existing.PredictedAmount,
                    Confidence      = existing.Confidence,
                    Month           = $"Th.{existing.PredictionMonth.Month}/{existing.PredictionMonth.Year}",
                    Insight         = existing.RawResponse ?? "Không có chi tiết."
                });
            }
        }

        // 2. Fetch context for AI
        var last3Months = await _db.Transactions
            .Include(t => t.Category)
            .Where(t => scopeUserIds.Contains(t.UserId) && t.TransactionDate >= DateOnly.FromDateTime(now.AddMonths(-3)))
            .ToListAsync();

        var activeGoals = await _db.SavingGoals
            .Where(g => scopeUserIds.Contains(g.UserId) && g.Status == SavingGoalStatus.InProgress)
            .ToListAsync();

        if (last3Months.Count < 5)
        {
            return new ApiResponse<AiPredictionDto>(new AiPredictionDto
            {
                PredictedAmount = 0,
                Confidence      = 0,
                Month           = $"Th.{predictionMonth.Month}/{predictionMonth.Year}",
                Insight         = useGroupScope
                    ? "Nhóm cần ghi chép thêm ít nhất 5 giao dịch để AI có thể phân tích tài chính gộp chính xác."
                    : "Bạn cần ghi chép thêm ít nhất 5 giao dịch để AI có thể phân tích và đưa ra lời khuyên chính xác."
            });
        }

        // 3. Prepare AI Prompt
        var income = last3Months.Where(t => t.Type == TransactionType.Income).Sum(t => t.Amount);
        var expense = last3Months.Where(t => t.Type == TransactionType.Expense).Sum(t => t.Amount);
        var categories = last3Months.Where(t => t.Type == TransactionType.Expense)
            .GroupBy(t => t.Category?.Name ?? "Khác")
            .Select(g => $"- {g.Key}: {g.Sum(t => t.Amount):N0}đ")
            .ToList();

        var goalsStr = string.Join("\n", activeGoals.Select(g => $"- {g.Name}: {g.CurrentAmount:N0}/{g.TargetAmount:N0}đ"));

        var prompt = $@"
            Dựa trên dữ liệu tài chính {(useGroupScope ? "gộp của nhóm" : "cá nhân của tôi")} trong 3 tháng qua:
            - Tổng thu nhập: {income:N0}đ
            - Tổng chi tiêu: {expense:N0}đ
            - Chi tiêu theo hạng mục:
            {string.Join("\n", categories)}

            Mục tiêu tiết kiệm đang thực hiện:
            {goalsStr}

            Hãy thực hiện 2 việc:
            1. Dự đoán số tiền tôi sẽ chi tiêu trong tháng tới (Tháng {predictionMonth.Month}).
            2. Đưa ra 1 lời khuyên tài chính cực kỳ ngắn gọn (tối đa 2 câu) để giúp tôi đạt được mục tiêu tiết kiệm.

            Trả về kết quả dưới định dạng JSON sau:
            {{
                ""predictedAmount"": 0,
                ""confidence"": 0.8,
                ""insight"": ""Lời khuyên của bạn ở đây""
            }}
        ";

        var systemPrompt = "Bạn là chuyên gia tư vấn tài chính cá nhân. Trả lời bằng tiếng Việt, ngắn gọn, súc tích và chỉ trả về JSON.";

        var aiResult = await _aiService.GetStructuredResponseAsync<AiPredictionDto>(prompt, systemPrompt);

        if (aiResult == null)
            return new ApiResponse<AiPredictionDto>("AI hiện không phản hồi, vui lòng thử lại sau.");

        if (useGroupScope)
        {
            aiResult.Month = $"Th.{predictionMonth.Month}/{predictionMonth.Year}";
            return new ApiResponse<AiPredictionDto>(aiResult, "Cập nhật gợi ý AI cho tài chính gộp thành công.");
        }

        // 4. Save personal prediction to DB
        var dbPrediction = await _db.AiSpendingPredictions
            .FirstOrDefaultAsync(p => p.UserId == userId && p.PredictionMonth == predictionMonth);

        if (dbPrediction == null)
        {
            dbPrediction = new AiSpendingPrediction { UserId = userId, PredictionMonth = predictionMonth };
            _db.AiSpendingPredictions.Add(dbPrediction);
        }

        dbPrediction.PredictedAmount = aiResult.PredictedAmount;
        dbPrediction.Confidence      = aiResult.Confidence ?? 0.8m;
        dbPrediction.RawResponse     = aiResult.Insight;
        dbPrediction.UpdatedAt       = DateTime.UtcNow;

        await _db.SaveChangesAsync();

        aiResult.Month = $"Th.{predictionMonth.Month}/{predictionMonth.Year}";
        return new ApiResponse<AiPredictionDto>(aiResult, "Cập nhật gợi ý AI thành công.");
    }

    // ─── Reset ───────────────────────────────────────────────────────────────

    public async Task<ApiResponse<bool>> ResetFinanceDataAsync(Guid userId)
    {
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

    // ─── Sharing ─────────────────────────────────────────────────────────────

    public async Task<ApiResponse<FinanceSharingOverviewDto>> GetSharingOverviewAsync(Guid userId)
    {
        var shareProfile = await EnsureShareProfileAsync(userId);

        var activeGroup = await _db.FinanceGroups
            .Include(g => g.Members).ThenInclude(m => m.User)
            .FirstOrDefaultAsync(g => g.Members.Any(m => m.UserId == userId && m.Status == FinanceGroupMemberStatus.Active));

        var incoming = await _db.FinanceGroupInvites
            .Include(i => i.FinanceGroup)
            .Include(i => i.InviterUser)
            .Include(i => i.InviteeUser)
            .Where(i => i.InviteeUserId == userId && i.Status == FinanceGroupInviteStatus.Pending && i.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        var outgoing = await _db.FinanceGroupInvites
            .Include(i => i.FinanceGroup)
            .Include(i => i.InviterUser)
            .Include(i => i.InviteeUser)
            .Where(i => i.InviterUserId == userId && i.Status == FinanceGroupInviteStatus.Pending && i.ExpiresAt > DateTime.UtcNow)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();

        return new ApiResponse<FinanceSharingOverviewDto>(new FinanceSharingOverviewDto
        {
            InviteCode = shareProfile.InviteCode,
            ActiveGroup = activeGroup is null ? null : MapGroup(activeGroup),
            IncomingInvites = incoming.Select(MapInvite).ToList(),
            OutgoingInvites = outgoing.Select(MapInvite).ToList()
        });
    }

    public async Task<ApiResponse<FinanceGroupInviteDto>> CreateGroupInviteAsync(Guid userId, CreateFinanceInviteRequest request)
    {
        var inviteCode = request.InviteCode.Trim().ToUpperInvariant();
        if (string.IsNullOrWhiteSpace(inviteCode))
            return new ApiResponse<FinanceGroupInviteDto>("Vui lòng nhập mã mời.");

        var inviteeProfile = await _db.FinanceShareProfiles.FirstOrDefaultAsync(p => p.InviteCode == inviteCode);
        if (inviteeProfile is null)
            return new ApiResponse<FinanceGroupInviteDto>("Mã mời không tồn tại.");

        if (inviteeProfile.UserId == userId)
            return new ApiResponse<FinanceGroupInviteDto>("Không thể tự mời chính mình.");

        var group = await EnsureActiveGroupAsync(userId);

        var alreadyMember = await _db.FinanceGroupMembers
            .AnyAsync(m => m.FinanceGroupId == group.Id && m.UserId == inviteeProfile.UserId && m.Status == FinanceGroupMemberStatus.Active);
        if (alreadyMember)
            return new ApiResponse<FinanceGroupInviteDto>("Người này đã ở trong nhóm tài chính.");

        var pending = await _db.FinanceGroupInvites
            .AnyAsync(i => i.FinanceGroupId == group.Id
                && i.InviteeUserId == inviteeProfile.UserId
                && i.Status == FinanceGroupInviteStatus.Pending
                && i.ExpiresAt > DateTime.UtcNow);
        if (pending)
            return new ApiResponse<FinanceGroupInviteDto>("Đã có lời mời đang chờ phản hồi.");

        var invite = new FinanceGroupInvite
        {
            FinanceGroupId = group.Id,
            InviterUserId = userId,
            InviteeUserId = inviteeProfile.UserId,
            Status = FinanceGroupInviteStatus.Pending,
            ExpiresAt = DateTime.UtcNow.AddDays(7)
        };

        _db.FinanceGroupInvites.Add(invite);
        await _db.SaveChangesAsync();

        invite = await _db.FinanceGroupInvites
            .Include(i => i.FinanceGroup)
            .Include(i => i.InviterUser)
            .Include(i => i.InviteeUser)
            .FirstAsync(i => i.Id == invite.Id);

        var dto = MapInvite(invite);
        await _financeHub.Clients.Group(invite.InviteeUserId.ToString()).SendAsync("FinanceInviteReceived", dto);
        await _financeHub.Clients.Group(invite.InviterUserId.ToString()).SendAsync("FinanceSharingChanged");

        return new ApiResponse<FinanceGroupInviteDto>(dto, "Đã gửi lời mời gộp tài chính.");
    }

    public async Task<ApiResponse<bool>> AcceptGroupInviteAsync(Guid userId, Guid inviteId)
    {
        var invite = await _db.FinanceGroupInvites
            .Include(i => i.FinanceGroup)
            .ThenInclude(g => g.Members)
            .FirstOrDefaultAsync(i => i.Id == inviteId && i.InviteeUserId == userId);

        if (invite is null)
            return new ApiResponse<bool>("Không tìm thấy lời mời.");

        if (invite.Status != FinanceGroupInviteStatus.Pending || invite.ExpiresAt <= DateTime.UtcNow)
            return new ApiResponse<bool>("Lời mời không còn hiệu lực.");

        var currentActiveMember = await _db.FinanceGroupMembers
            .FirstOrDefaultAsync(m => m.UserId == userId && m.Status == FinanceGroupMemberStatus.Active);
        if (currentActiveMember is not null && currentActiveMember.FinanceGroupId != invite.FinanceGroupId)
            return new ApiResponse<bool>("Bạn đang ở trong một nhóm tài chính khác. Vui lòng rời nhóm hiện tại trước.");

        var member = await _db.FinanceGroupMembers
            .FirstOrDefaultAsync(m => m.FinanceGroupId == invite.FinanceGroupId && m.UserId == userId);

        if (member is null)
        {
            _db.FinanceGroupMembers.Add(new FinanceGroupMember
            {
                FinanceGroupId = invite.FinanceGroupId,
                UserId = userId,
                Status = FinanceGroupMemberStatus.Active
            });
        }
        else
        {
            member.Status = FinanceGroupMemberStatus.Active;
            member.JoinedAt = DateTime.UtcNow;
            member.LeftAt = null;
        }

        invite.Status = FinanceGroupInviteStatus.Accepted;
        invite.RespondedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        await NotifyGroupChangedAsync(invite.FinanceGroupId);
        await _financeHub.Clients.Group(invite.InviterUserId.ToString()).SendAsync("FinanceInviteAccepted", inviteId);
        await _financeHub.Clients.Group(userId.ToString()).SendAsync("FinanceSharingChanged");

        return new ApiResponse<bool>(true, "Đã chấp nhận lời mời gộp tài chính.");
    }

    public async Task<ApiResponse<bool>> RejectGroupInviteAsync(Guid userId, Guid inviteId)
    {
        var invite = await _db.FinanceGroupInvites.FirstOrDefaultAsync(i => i.Id == inviteId && i.InviteeUserId == userId);
        if (invite is null)
            return new ApiResponse<bool>("Không tìm thấy lời mời.");

        invite.Status = FinanceGroupInviteStatus.Rejected;
        invite.RespondedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _financeHub.Clients.Group(invite.InviterUserId.ToString()).SendAsync("FinanceInviteRejected", inviteId);
        await _financeHub.Clients.Group(userId.ToString()).SendAsync("FinanceSharingChanged");

        return new ApiResponse<bool>(true, "Đã từ chối lời mời.");
    }

    public async Task<ApiResponse<bool>> CancelGroupInviteAsync(Guid userId, Guid inviteId)
    {
        var invite = await _db.FinanceGroupInvites.FirstOrDefaultAsync(i => i.Id == inviteId && i.InviterUserId == userId);
        if (invite is null)
            return new ApiResponse<bool>("Không tìm thấy lời mời.");

        invite.Status = FinanceGroupInviteStatus.Cancelled;
        invite.RespondedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await _financeHub.Clients.Group(invite.InviteeUserId.ToString()).SendAsync("FinanceSharingChanged");
        await _financeHub.Clients.Group(userId.ToString()).SendAsync("FinanceSharingChanged");

        return new ApiResponse<bool>(true, "Đã huỷ lời mời.");
    }

    public async Task<ApiResponse<bool>> LeaveActiveGroupAsync(Guid userId)
    {
        var member = await _db.FinanceGroupMembers
            .FirstOrDefaultAsync(m => m.UserId == userId && m.Status == FinanceGroupMemberStatus.Active);

        if (member is null)
            return new ApiResponse<bool>("Bạn chưa tham gia nhóm tài chính nào.");

        member.Status = FinanceGroupMemberStatus.Left;
        member.LeftAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var groupId = member.FinanceGroupId;
        var hasActiveMembers = await _db.FinanceGroupMembers
            .AnyAsync(m => m.FinanceGroupId == groupId && m.Status == FinanceGroupMemberStatus.Active);

        if (!hasActiveMembers)
        {
            var group = await _db.FinanceGroups
                .Include(g => g.Members)
                .Include(g => g.Invites)
                .FirstOrDefaultAsync(g => g.Id == groupId);

            if (group is not null)
            {
                _db.FinanceGroupInvites.RemoveRange(group.Invites);
                _db.FinanceGroupMembers.RemoveRange(group.Members);
                _db.FinanceGroups.Remove(group);
                await _db.SaveChangesAsync();
            }
        }
        else
        {
            await NotifyGroupChangedAsync(groupId);
        }

        await _financeHub.Clients.Group(userId.ToString()).SendAsync("FinanceSharingChanged");

        return new ApiResponse<bool>(true, "Đã rời nhóm tài chính.");
    }

    public async Task<ApiResponse<FinanceGroupDto>> UpdateActiveGroupAsync(Guid userId, UpdateFinanceGroupRequest request)
    {
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return new ApiResponse<FinanceGroupDto>("Tên tài khoản gộp không được để trống.");

        var group = await _db.FinanceGroups
            .Include(g => g.Members).ThenInclude(m => m.User)
            .FirstOrDefaultAsync(g => g.Members.Any(m => m.UserId == userId && m.Status == FinanceGroupMemberStatus.Active));

        if (group is null)
            return new ApiResponse<FinanceGroupDto>("Bạn chưa tham gia nhóm tài chính nào.");

        group.Name = name;
        await _db.SaveChangesAsync();
        await NotifyGroupChangedAsync(group.Id);

        return new ApiResponse<FinanceGroupDto>(MapGroup(group), "Đã cập nhật tên tài khoản gộp.");
    }

    private async Task NotifyGroupChangedAsync(Guid groupId)
    {
        var userIds = await _db.FinanceGroupMembers
            .IgnoreQueryFilters()
            .Where(m => m.FinanceGroupId == groupId)
            .Select(m => m.UserId)
            .Distinct()
            .ToListAsync();

        foreach (var id in userIds)
        {
            await _financeHub.Clients.Group(id.ToString()).SendAsync("FinanceSharingChanged");
        }
    }
}
