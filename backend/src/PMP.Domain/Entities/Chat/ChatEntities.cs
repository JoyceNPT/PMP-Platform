using PMP.Domain.Common;
using PMP.Domain.Enums;

namespace PMP.Domain.Entities.Chat;

// ─────────────────────────────────────────────────────────────────────────────
// CONVERSATION
// ─────────────────────────────────────────────────────────────────────────────
public class Conversation : BaseEntity
{
    public Guid UserId { get; set; }
    public ConversationType Type { get; set; }                  // AI / Admin
    public string? Title { get; set; }                          // auto-generate từ msg đầu
    public bool IsActive { get; set; } = true;
    public DateTime? LastMessageAt { get; set; }

    // ── Navigation ───────────────────────────────────────────────────────────
    public ICollection<Message> Messages { get; set; } = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGE
// ─────────────────────────────────────────────────────────────────────────────
public class Message : BaseEntity
{
    public Guid ConversationId { get; set; }
    public MessageRole Role { get; set; }                       // User / Assistant / System
    public string Content { get; set; } = string.Empty;
    public MessageContentType ContentType { get; set; } = MessageContentType.Text;

    /// <summary>
    /// URL file đính kèm. Hiện tại: URL thuần.
    /// Sau: tham chiếu FileAttachment.Id.
    /// </summary>
    public string? AttachmentUrl { get; set; }                  // max 500

    /// <summary>Track trạng thái streaming từ AI (SignalR)</summary>
    public bool IsStreaming { get; set; } = false;

    /// <summary>Số token AI đã dùng — monitoring cost</summary>
    public int? TokensUsed { get; set; }

    // ── Navigation ───────────────────────────────────────────────────────────
    public Conversation Conversation { get; set; } = null!;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN CHAT AGENT  (chuẩn bị sẵn, kích hoạt sau)
// ─────────────────────────────────────────────────────────────────────────────
public class AdminChatAgent : BaseEntity
{
    public string Name { get; set; } = string.Empty;            // max 100
    public string Email { get; set; } = string.Empty;           // unique
    public bool IsOnline { get; set; } = false;
    public DateTime? LastSeenAt { get; set; }
}
