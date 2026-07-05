using PMP.Application.Features.Note.DTOs;
using PMP.Shared.Wrappers;

namespace PMP.Application.Features.Note.Interfaces;

public interface INoteService
{
    Task<ApiResponse<List<NoteDto>>> GetUserNotesAsync(Guid userId);
    Task<ApiResponse<NoteDto>> GetNoteByIdAsync(Guid userId, Guid noteId);
    Task<ApiResponse<NoteDto>> CreateNoteAsync(Guid userId, CreateNoteRequest request);
    Task<ApiResponse<NoteDto>> UpdateNoteAsync(Guid userId, Guid noteId, UpdateNoteRequest request);
    Task<ApiResponse<bool>> DeleteNoteAsync(Guid userId, Guid noteId);
    Task<ApiResponse<bool>> TogglePinAsync(Guid userId, Guid noteId);
}
