using PMP.Application.Features.Finance.DTOs;
using PMP.Shared.Wrappers;

namespace PMP.Application.Features.Finance.Interfaces;

public interface IFinanceService
{
    // ─── Categories ──────────────────────────────────────────────────────────
    Task<ApiResponse<List<FinanceCategoryDto>>> GetCategoriesAsync(Guid userId);
    Task<ApiResponse<FinanceCategoryDto>> CreateCategoryAsync(Guid userId, CreateCategoryRequest req);
    Task<ApiResponse<FinanceCategoryDto>> UpdateCategoryAsync(Guid userId, Guid categoryId, UpdateCategoryRequest req);
    Task<ApiResponse<bool>> DeleteCategoryAsync(Guid userId, Guid categoryId);

    // Transactions
    Task<ApiResponse<List<TransactionDto>>> GetTransactionsAsync(Guid userId, TransactionQueryParams query);
    Task<ApiResponse<TransactionDto>> CreateTransactionAsync(Guid userId, CreateTransactionRequest request);
    Task<ApiResponse<TransactionDto>> UpdateTransactionAsync(Guid userId, Guid transactionId, UpdateTransactionRequest request);
    Task<ApiResponse<bool>> DeleteTransactionAsync(Guid userId, Guid transactionId);

    // Saving Goals
    Task<ApiResponse<List<SavingGoalDto>>> GetSavingGoalsAsync(Guid userId);
    Task<ApiResponse<SavingGoalDto>> CreateSavingGoalAsync(Guid userId, CreateSavingGoalRequest request);
    Task<ApiResponse<SavingGoalDto>> UpdateSavingGoalAsync(Guid userId, Guid goalId, UpdateSavingGoalRequest request);
    Task<ApiResponse<bool>> DeleteSavingGoalAsync(Guid userId, Guid goalId);

    // ─── Summary & AI ─────────────────────────────────────────────────────────
    Task<ApiResponse<MonthlySummaryDto>> GetMonthlySummaryAsync(Guid userId, int year, int month);
    Task<ApiResponse<AiPredictionDto>> GetAiPredictionAsync(Guid userId, bool forceReload = false, string scope = "group");

    // ─── Reset ───────────────────────────────────────────────────────────────
    Task<ApiResponse<bool>> ResetFinanceDataAsync(Guid userId);

    // ─── Sharing ─────────────────────────────────────────────────────────────
    Task<ApiResponse<FinanceSharingOverviewDto>> GetSharingOverviewAsync(Guid userId);
    Task<ApiResponse<FinanceGroupInviteDto>> CreateGroupInviteAsync(Guid userId, CreateFinanceInviteRequest request);
    Task<ApiResponse<bool>> AcceptGroupInviteAsync(Guid userId, Guid inviteId);
    Task<ApiResponse<bool>> RejectGroupInviteAsync(Guid userId, Guid inviteId);
    Task<ApiResponse<bool>> CancelGroupInviteAsync(Guid userId, Guid inviteId);
    Task<ApiResponse<bool>> LeaveActiveGroupAsync(Guid userId);
    Task<ApiResponse<FinanceGroupDto>> UpdateActiveGroupAsync(Guid userId, UpdateFinanceGroupRequest request);
}
