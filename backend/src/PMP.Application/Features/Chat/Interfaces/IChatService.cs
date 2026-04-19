using PMP.Application.Features.Chat.DTOs;
using PMP.Shared.Wrappers;

namespace PMP.Application.Features.Chat.Interfaces;

public interface IChatService
{
    // Conversations
    Task<ApiResponse<List<ConversationDto>>> GetUserConversationsAsync(Guid userId);
    Task<ApiResponse<ConversationDto>> CreateConversationAsync(Guid userId, CreateConversationRequest request);
    Task<ApiResponse<bool>> DeleteConversationAsync(Guid userId, Guid conversationId);

    // Messages
    Task<ApiResponse<List<MessageDto>>> GetConversationMessagesAsync(Guid userId, Guid conversationId);
    Task<ApiResponse<MessageDto>> SendMessageAsync(Guid userId, SendMessageRequest request);
}
