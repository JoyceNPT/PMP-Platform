using Microsoft.EntityFrameworkCore;
using PMP.Application.Features.Note.DTOs;
using PMP.Application.Features.Note.Interfaces;
using PMP.Infrastructure.Persistence;
using PMP.Shared.Wrappers;

namespace PMP.Infrastructure.Services.Note;

public class NoteService : INoteService
{
    private readonly ApplicationDbContext _context;

    public NoteService(ApplicationDbContext context)
    {
        _context = context;
    }

    private NoteDto MapToDto(Domain.Entities.Note.Note note)
    {
        return new NoteDto
        {
            Id = note.Id,
            Title = note.Title,
            Content = note.Content,
            CoverImage = note.CoverImage,
            Icon = note.Icon,
            IsPinned = note.IsPinned,
            CreatedAt = note.CreatedAt,
            UpdatedAt = note.UpdatedAt
        };
    }

    public async Task<ApiResponse<List<NoteDto>>> GetUserNotesAsync(Guid userId)
    {
        var notes = await _context.Notes
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.IsPinned)
            .ThenByDescending(n => n.UpdatedAt)
            .ToListAsync();

        return new ApiResponse<List<NoteDto>>(notes.Select(MapToDto).ToList());
    }

    public async Task<ApiResponse<NoteDto>> GetNoteByIdAsync(Guid userId, Guid noteId)
    {
        var note = await _context.Notes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.UserId == userId);

        if (note == null)
            return new ApiResponse<NoteDto>("Note not found.");

        return new ApiResponse<NoteDto>(MapToDto(note));
    }

    public async Task<ApiResponse<NoteDto>> CreateNoteAsync(Guid userId, CreateNoteRequest request)
    {
        var note = new Domain.Entities.Note.Note
        {
            UserId = userId,
            Title = request.Title,
            Content = request.Content,
            CoverImage = request.CoverImage,
            Icon = request.Icon,
            IsPinned = request.IsPinned
        };

        _context.Notes.Add(note);
        await _context.SaveChangesAsync();

        return new ApiResponse<NoteDto>(MapToDto(note), "Note created successfully.");
    }

    public async Task<ApiResponse<NoteDto>> UpdateNoteAsync(Guid userId, Guid noteId, UpdateNoteRequest request)
    {
        var note = await _context.Notes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.UserId == userId);

        if (note == null)
            return new ApiResponse<NoteDto>("Note not found.");

        if (request.Title != null) note.Title = request.Title;
        if (request.Content != null) note.Content = request.Content;
        if (request.CoverImage != null) note.CoverImage = request.CoverImage;
        if (request.Icon != null) note.Icon = request.Icon;
        if (request.IsPinned.HasValue) note.IsPinned = request.IsPinned.Value;

        await _context.SaveChangesAsync();

        return new ApiResponse<NoteDto>(MapToDto(note), "Note updated successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteNoteAsync(Guid userId, Guid noteId)
    {
        var note = await _context.Notes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.UserId == userId);

        if (note == null)
            return new ApiResponse<bool>("Note not found.");

        note.IsDeleted = true; // Soft delete
        await _context.SaveChangesAsync();

        return new ApiResponse<bool>(true, "Note deleted successfully.");
    }

    public async Task<ApiResponse<bool>> TogglePinAsync(Guid userId, Guid noteId)
    {
        var note = await _context.Notes
            .FirstOrDefaultAsync(n => n.Id == noteId && n.UserId == userId);

        if (note == null)
            return new ApiResponse<bool>("Note not found.");

        note.IsPinned = !note.IsPinned;
        await _context.SaveChangesAsync();

        return new ApiResponse<bool>(note.IsPinned, $"Note {(note.IsPinned ? "pinned" : "unpinned")}.");
    }
}
