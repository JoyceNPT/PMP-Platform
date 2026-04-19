namespace PMP.Application.Features.Chat.DTOs;

// ─── Conversation ───────────────────────────────────────────────────────────

public class ConversationDto
{
    public Guid Id { get; set; }
    public string? Title { get; set; }
    public int Type { get; set; }           // 0 = AI, 1 = Admin
    public DateTime? LastMessageAt { get; set; }
    public MessageDto? LastMessage { get; set; }
}

public class CreateConversationRequest
{
    public int Type { get; set; }           // 0 = AI, 1 = Admin
    public string? InitialMessage { get; set; }
}

// ─── Message ─────────────────────────────────────────────────────────────────

public class MessageDto
{
    public Guid Id { get; set; }
    public Guid ConversationId { get; set; }
    public int Role { get; set; }           // 0 = User, 1 = Assistant, 2 = System
    public string Content { get; set; } = string.Empty;
    public int ContentType { get; set; }    // 0 = Text, 1 = Markdown, 2 = Image
    public string? AttachmentUrl { get; set; }
    public bool IsStreaming { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class SendMessageRequest
{
    public Guid ConversationId { get; set; }
    public string Content { get; set; } = string.Empty;
    public string? AttachmentUrl { get; set; }
}
