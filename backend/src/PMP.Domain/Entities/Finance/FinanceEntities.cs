using PMP.Domain.Common;
using PMP.Domain.Entities.Auth;
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
    public string? AttachmentUrl { get; set; }                  // receipt/image URL

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

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE SHARE PROFILE
// Mỗi user có một mã mời riêng để người khác gửi lời mời gộp tài chính.
// ─────────────────────────────────────────────────────────────────────────────
public class FinanceShareProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public string InviteCode { get; set; } = string.Empty;

    public ApplicationUser User { get; set; } = null!;
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCE GROUP
// Nhóm gộp tài chính. Dữ liệu giao dịch vẫn nằm ở từng user, group chỉ quản lý
// membership để query gom khi xem báo cáo/danh sách.
// ─────────────────────────────────────────────────────────────────────────────
public class FinanceGroup : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public Guid CreatedByUserId { get; set; }

    public ICollection<FinanceGroupMember> Members { get; set; } = [];
    public ICollection<FinanceGroupInvite> Invites { get; set; } = [];
}

public class FinanceGroupMember : BaseEntity
{
    public Guid FinanceGroupId { get; set; }
    public Guid UserId { get; set; }
    public FinanceGroupMemberStatus Status { get; set; } = FinanceGroupMemberStatus.Active;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LeftAt { get; set; }

    public FinanceGroup FinanceGroup { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
}

public class FinanceGroupInvite : BaseEntity
{
    public Guid FinanceGroupId { get; set; }
    public Guid InviterUserId { get; set; }
    public Guid InviteeUserId { get; set; }
    public FinanceGroupInviteStatus Status { get; set; } = FinanceGroupInviteStatus.Pending;
    public DateTime ExpiresAt { get; set; } = DateTime.UtcNow.AddDays(7);
    public DateTime? RespondedAt { get; set; }

    public FinanceGroup FinanceGroup { get; set; } = null!;
    public ApplicationUser InviterUser { get; set; } = null!;
    public ApplicationUser InviteeUser { get; set; } = null!;
}
