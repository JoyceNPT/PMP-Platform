using PMP.Domain.Common;
using PMP.Domain.Enums;

namespace PMP.Domain.Entities.Finance;

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE CATEGORY  (user-defined, không dùng danh mục cứng)
// ─────────────────────────────────────────────────────────────────────────────
public class FinanceCategory : BaseEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;            // max 100
    public TransactionType Type { get; set; }                   // Income / Expense
    public string? ColorHex { get; set; }                       // "#FF5733" — dùng chart
    public string? Icon { get; set; }                           // tên icon (lucide / emoji)

    // ── Navigation ───────────────────────────────────────────────────────────
    public ICollection<Transaction> Transactions { get; set; } = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// TRANSACTION
// ─────────────────────────────────────────────────────────────────────────────
public class Transaction : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid CategoryId { get; set; }
    public TransactionType Type { get; set; }                   // phải khớp CategoryType
    public decimal Amount { get; set; }                         // precision(18,2), > 0
    public DateOnly TransactionDate { get; set; }
    public string? Note { get; set; }                           // max 500

    // ── Navigation ───────────────────────────────────────────────────────────
    public FinanceCategory Category { get; set; } = null!;
}

// ─────────────────────────────────────────────────────────────────────────────
// SAVING GOAL
// ─────────────────────────────────────────────────────────────────────────────
public class SavingGoal : BaseEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;            // max 200
    public decimal TargetAmount { get; set; }                   // precision(18,2)
    public decimal CurrentAmount { get; set; } = 0;             // precision(18,2)
    public DateOnly? TargetDate { get; set; }
    public SavingGoalStatus Status { get; set; } = SavingGoalStatus.InProgress;

    /*
     * NOTE — Computed (Application layer):
     *   ProgressPercent = (CurrentAmount / TargetAmount) * 100
     *   RemainingAmount = TargetAmount - CurrentAmount
     */
}

// ─────────────────────────────────────────────────────────────────────────────
// AI SPENDING PREDICTION
// Lưu kết quả dự đoán để tránh gọi AI lặp + track accuracy sau này
// ─────────────────────────────────────────────────────────────────────────────
public class AiSpendingPrediction : BaseEntity
{
    public Guid UserId { get; set; }

    /// <summary>Ngày đầu của tháng dự đoán. VD: 2024-06-01</summary>
    public DateOnly PredictionMonth { get; set; }

    public decimal PredictedAmount { get; set; }                // precision(18,2)
    public decimal? ActualAmount { get; set; }                  // cập nhật cuối tháng
    public decimal? Confidence { get; set; }                    // 0.0 – 1.0, precision(5,4)

    /// <summary>Raw JSON response từ AI — dùng để debug & audit</summary>
    public string? RawResponse { get; set; }
}
