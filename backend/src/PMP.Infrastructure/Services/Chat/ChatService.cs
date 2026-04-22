using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using PMP.Infrastructure.Services.System;
using PMP.Infrastructure.Hubs;
using PMP.Application.Features.Chat.DTOs;
using PMP.Application.Features.Chat.Interfaces;
using PMP.Domain.Entities.Chat;
using PMP.Domain.Enums;
using PMP.Infrastructure.Persistence;
using PMP.Shared.Wrappers;

namespace PMP.Infrastructure.Services.Chat;

public class ChatService : IChatService
{
    private readonly ApplicationDbContext _db;
    private readonly IHubContext<ChatHub> _hubContext;
    private readonly IServiceScopeFactory _scopeFactory;

    public ChatService(ApplicationDbContext db, IHubContext<ChatHub> hubContext, IServiceScopeFactory scopeFactory)
    {
        _db = db;
        _hubContext = hubContext;
        _scopeFactory = scopeFactory;
    }

    // ─── Conversations ───────────────────────────────────────────────────────

    public async Task<ApiResponse<List<ConversationDto>>> GetUserConversationsAsync(Guid userId)
    {
        var convs = await _db.Conversations
            .Where(c => c.UserId == userId && c.IsActive)
            .OrderByDescending(c => c.LastMessageAt ?? c.CreatedAt)
            .Select(c => new ConversationDto
            {
                Id = c.Id,
                Title = c.Title,
                Type = (int)c.Type,
                LastMessageAt = c.LastMessageAt,
                LastMessage = c.Messages.OrderByDescending(m => m.CreatedAt).Select(m => new MessageDto
                {
                    Content = m.Content,
                    CreatedAt = m.CreatedAt
                }).FirstOrDefault()
            })
            .ToListAsync();

        return new ApiResponse<List<ConversationDto>>(convs);
    }

    public async Task<ApiResponse<ConversationDto>> CreateConversationAsync(Guid userId, CreateConversationRequest req)
    {
        var conv = new Conversation
        {
            UserId = userId,
            Type = (ConversationType)req.Type,
            Title = string.IsNullOrEmpty(req.InitialMessage) 
                ? "Cuộc hội thoại mới" 
                : (req.InitialMessage.Length > 30 ? req.InitialMessage[..30] + "..." : req.InitialMessage),
            IsActive = true,
            LastMessageAt = DateTime.UtcNow
        };

        _db.Conversations.Add(conv);
        await _db.SaveChangesAsync();

        if (!string.IsNullOrEmpty(req.InitialMessage))
        {
            var msg = new Message
            {
                ConversationId = conv.Id,
                Role = MessageRole.User,
                Content = req.InitialMessage,
                ContentType = MessageContentType.Text
            };
            _db.Messages.Add(msg);
            await _db.SaveChangesAsync();
        }

        return new ApiResponse<ConversationDto>(new ConversationDto
        {
            Id = conv.Id,
            Title = conv.Title,
            Type = (int)conv.Type,
            LastMessageAt = conv.LastMessageAt
        });
    }

    public async Task<ApiResponse<bool>> DeleteConversationAsync(Guid userId, Guid convId)
    {
        var conv = await _db.Conversations.FirstOrDefaultAsync(c => c.Id == convId && c.UserId == userId);
        if (conv == null) return new ApiResponse<bool>("Không tìm thấy cuộc hội thoại.");

        conv.IsActive = false; // Soft delete
        await _db.SaveChangesAsync();
        return new ApiResponse<bool>(true, "Đã xoá cuộc hội thoại.");
    }

    // ─── Messages ────────────────────────────────────────────────────────────

    public async Task<ApiResponse<List<MessageDto>>> GetConversationMessagesAsync(Guid userId, Guid convId)
    {
        var conv = await _db.Conversations.AnyAsync(c => c.Id == convId && c.UserId == userId);
        if (!conv) return new ApiResponse<List<MessageDto>>("Không tìm thấy cuộc hội thoại.");

        var msgs = await _db.Messages
            .Where(m => m.ConversationId == convId)
            .OrderBy(m => m.CreatedAt)
            .Select(m => MapMessage(m))
            .ToListAsync();

        return new ApiResponse<List<MessageDto>>(msgs);
    }

    public async Task<ApiResponse<MessageDto>> SendMessageAsync(Guid userId, SendMessageRequest req)
    {
        var conv = await _db.Conversations.FirstOrDefaultAsync(c => c.Id == req.ConversationId && c.UserId == userId);
        if (conv == null) return new ApiResponse<MessageDto>("Không tìm thấy cuộc hội thoại.");

        var msg = new Message
        {
            ConversationId = req.ConversationId,
            Role = MessageRole.User,
            Content = req.Content,
            AttachmentUrl = req.AttachmentUrl,
            ContentType = MessageContentType.Text
        };

        _db.Messages.Add(msg);
        conv.LastMessageAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        var dto = MapMessage(msg);

        // Broadcast to group (real-time update for other client tabs or admin)
        await _hubContext.Clients.Group(req.ConversationId.ToString()).SendAsync("ReceiveMessage", dto);

        // If it's an AI conversation, we could trigger AI response here
        if (conv.Type == ConversationType.AI)
        {
            _ = Task.Run(() => HandleAiResponse(userId, conv.Id, req.Content));
        }

        return new ApiResponse<MessageDto>(dto);
    }

    // ─── AI Response Simulation ──────────────────────────────────────────────

    private async Task HandleAiResponse(Guid userId, Guid convId, string userMessage)
    {
        using var scope = _scopeFactory.CreateScope();
        var aiChatService = scope.ServiceProvider.GetRequiredService<IAiChatService>();
        var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();

        var aiResponse = await aiChatService.GetAiResponseAsync(userId, userMessage);
        var content = aiResponse.Succeeded ? aiResponse.Data! : (aiResponse.Message ?? "Xin lỗi, tôi gặp sự cố khi kết nối với não bộ AI.");

        var aiMsg = new Message
        {
            ConversationId = convId,
            Role = MessageRole.Assistant,
            Content = content,
            ContentType = MessageContentType.Text,
            CreatedAt = DateTime.UtcNow
        };

        db.Messages.Add(aiMsg);
        await db.SaveChangesAsync();

        var dto = MapMessage(aiMsg);
        await _hubContext.Clients.Group(convId.ToString()).SendAsync("ReceiveMessage", dto);
    }

    private static MessageDto MapMessage(Message m) => new()
    {
        Id = m.Id,
        ConversationId = m.ConversationId,
        Role = (int)m.Role,
        Content = m.Content,
        ContentType = (int)m.ContentType,
        AttachmentUrl = m.AttachmentUrl,
        IsStreaming = m.IsStreaming,
        CreatedAt = m.CreatedAt
    };
}
