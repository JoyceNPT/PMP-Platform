using PMP.Domain.Common;
using PMP.Domain.Enums;

namespace PMP.Domain.Entities.System;

// ─────────────────────────────────────────────────────────────────────────────
// USER SETTING  (1:1 với User — tạo cùng lúc khi register)
// ─────────────────────────────────────────────────────────────────────────────
public class UserSetting
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }                            // unique
    public AppTheme Theme { get; set; } = AppTheme.Light;
    public AppLanguage Language { get; set; } = AppLanguage.VI;
    public bool NotificationsEnabled { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────
public class Notification : BaseEntity
{
    public Guid UserId { get; set; }
    public string Title { get; set; } = string.Empty;           // max 200
    public string Body { get; set; } = string.Empty;
    public NotificationType Type { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime? ReadAt { get; set; }
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE ATTACHMENT  (cơ bản — mở rộng sau)
// Thiết kế polymorphic: 1 bảng cho tất cả loại file của mọi entity
// ─────────────────────────────────────────────────────────────────────────────
public class FileAttachment : BaseEntity
{
    public Guid UserId { get; set; }
    public string OriginalFileName { get; set; } = string.Empty; // max 255
    public StorageType StorageType { get; set; } = StorageType.Url;

    /// <summary>
    /// Với Url: chứa URL đầy đủ.
    /// Với S3/AzureBlob: chứa storage key (object key).
    /// Khi chuyển storage: chỉ đổi StorageType + FileUrl, không đụng business logic.
    /// </summary>
    public string FileUrl { get; set; } = string.Empty;         // max 1000

    public string MimeType { get; set; } = string.Empty;        // max 100
    public long? FileSizeBytes { get; set; }

    /// <summary>Polymorphic reference: "Certificate", "Avatar", "ChatAttachment"</summary>
    public string EntityType { get; set; } = string.Empty;      // max 50
    public Guid? EntityId { get; set; }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG  (append-only, KHÔNG soft delete, KHÔNG update)
// ─────────────────────────────────────────────────────────────────────────────
public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }                           // null = system action
    public string Action { get; set; } = string.Empty;          // "LOGIN", "UPDATE_PROFILE"
    public string? EntityType { get; set; }                     // max 100
    public Guid? EntityId { get; set; }
    public string? OldValues { get; set; }                      // JSON
    public string? NewValues { get; set; }                      // JSON
    public string? IpAddress { get; set; }                      // max 45 (IPv6)
    public string? UserAgent { get; set; }                      // max 500
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /*
     * Retention policy (gợi ý):
     *   - Development : không xoá
     *   - Production  : giữ 90 ngày, Hangfire job chạy hàng đêm cleanup
     */
}
