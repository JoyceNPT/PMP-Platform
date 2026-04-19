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
    Task<ApiResponse<AiPredictionDto>> GetAiPredictionAsync(Guid userId);

    // ─── Reset ───────────────────────────────────────────────────────────────
    Task<ApiResponse<bool>> ResetFinanceDataAsync(Guid userId);
}
