using System.ComponentModel.DataAnnotations;

namespace PMP.Application.Features.Note.DTOs;

public class NoteDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string? CoverImage { get; set; }
    public string? Icon { get; set; }
    public bool IsPinned { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class CreateNoteRequest
{
    [Required]
    [MaxLength(255)]
    public string Title { get; set; } = "Khong co tieu de";

    public string Content { get; set; } = "[]";
    public string? CoverImage { get; set; }
    public string? Icon { get; set; }
    public bool IsPinned { get; set; } = false;
}

public class UpdateNoteRequest
{
    [MaxLength(255)]
    public string? Title { get; set; }

    public string? Content { get; set; }
    public string? CoverImage { get; set; }
    public string? Icon { get; set; }
    public bool? IsPinned { get; set; }
}
