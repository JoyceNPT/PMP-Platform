using PMP.Domain.Common;
using PMP.Domain.Entities.Auth;

namespace PMP.Domain.Entities.Note;

public class Note : BaseEntity
{
    public Guid UserId { get; set; }
    
    // Virtual navigation property for EF Core
    public virtual ApplicationUser? User { get; set; }

    public string Title { get; set; } = "Khong co tieu de";
    
    // JSON content from BlockNote/TipTap
    public string Content { get; set; } = "[]";

    public string? CoverImage { get; set; }
    public string? Icon { get; set; }

    public bool IsPinned { get; set; } = false;
}
