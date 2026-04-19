namespace PMP.Domain.Common;

/// <summary>
/// Base entity cho tất cả các bảng: PK UUID, audit timestamps, soft delete.
/// </summary>
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;
}

/// <summary>
/// Base cho các bảng token (không soft delete — hard delete sau khi expired).
/// </summary>
public abstract class BaseTokenEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
