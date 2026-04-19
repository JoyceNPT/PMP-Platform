using PMP.Domain.Common;
using PMP.Domain.Enums;

namespace PMP.Domain.Entities.Roadmap;

// ─────────────────────────────────────────────────────────────────────────────
// USER CAREER PROFILE  (1:1 với User)
// ─────────────────────────────────────────────────────────────────────────────
public class UserCareerProfile : BaseEntity
{
    public Guid UserId { get; set; }                            // unique
    public string Major { get; set; } = string.Empty;           // max 200
    public string? CurrentJob { get; set; }                     // max 200
    public int? ExperienceYears { get; set; }

    // ── Navigation ───────────────────────────────────────────────────────────
    public ICollection<UserSkill> Skills { get; set; } = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// USER SKILL
// ─────────────────────────────────────────────────────────────────────────────
public class UserSkill : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid CareerProfileId { get; set; }
    public string SkillName { get; set; } = string.Empty;       // max 100
    public SkillType SkillType { get; set; }                    // Current / Planned
    public ProficiencyLevel? ProficiencyLevel { get; set; }     // chỉ áp dụng Current

    // ── Navigation ───────────────────────────────────────────────────────────
    public UserCareerProfile CareerProfile { get; set; } = null!;
}

// ─────────────────────────────────────────────────────────────────────────────
// CAREER ROADMAP
// 1 user chỉ có 1 IsActive = true tại 1 thời điểm
// ─────────────────────────────────────────────────────────────────────────────
public class CareerRoadmap : BaseEntity
{
    public Guid UserId { get; set; }
    public string CareerPath { get; set; } = string.Empty;      // "Software Engineer"
    public RoadmapSource Source { get; set; }                   // RoadmapSh / AiGenerated
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Raw JSON từ roadmap.sh API hoặc AI response.
    /// Lưu để: (1) tránh gọi lại API/AI, (2) render lại graph khi cần.
    /// PostgreSQL jsonb — có thể query bên trong nếu cần.
    /// </summary>
    public string RawData { get; set; } = "{}";

    // ── Navigation ───────────────────────────────────────────────────────────
    public ICollection<RoadmapNode> Nodes { get; set; } = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// ROADMAP NODE  (mỗi kỹ năng / topic trong roadmap)
// ─────────────────────────────────────────────────────────────────────────────
public class RoadmapNode : BaseEntity
{
    public Guid RoadmapId { get; set; }
    public string NodeKey { get; set; } = string.Empty;         // unique trong roadmap
    public string Title { get; set; } = string.Empty;           // max 200
    public string? Description { get; set; }
    public string? Category { get; set; }                       // nhóm kỹ năng, max 100
    public int OrderIndex { get; set; }                         // thứ tự hiển thị
    public decimal? PositionX { get; set; }                     // toạ độ render graph
    public decimal? PositionY { get; set; }

    // ── Navigation ───────────────────────────────────────────────────────────
    public CareerRoadmap Roadmap { get; set; } = null!;
    public ICollection<RoadmapNodePrerequisite> Prerequisites { get; set; } = [];
    public ICollection<RoadmapNodePrerequisite> RequiredBy { get; set; } = [];
    public ICollection<UserNodeProgress> UserProgress { get; set; } = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// ROADMAP NODE PREREQUISITE  (junction table — self-referencing)
// ─────────────────────────────────────────────────────────────────────────────
public class RoadmapNodePrerequisite
{
    public Guid NodeId { get; set; }                            // node cần học
    public Guid PrerequisiteNodeId { get; set; }                // node phải học trước

    // ── Navigation ───────────────────────────────────────────────────────────
    public RoadmapNode Node { get; set; } = null!;
    public RoadmapNode PrerequisiteNode { get; set; } = null!;
}

// ─────────────────────────────────────────────────────────────────────────────
// USER NODE PROGRESS  (unique: UserId + NodeId)
// ─────────────────────────────────────────────────────────────────────────────
public class UserNodeProgress : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid NodeId { get; set; }
    public NodeStatus Status { get; set; } = NodeStatus.NotStarted;

    /// <summary>
    /// Ghi chú khi đang học (In Progress).
    /// </summary>
    public string? Note { get; set; }                           // max 1000

    /// <summary>
    /// URL chứng chỉ khi hoàn thành.
    /// Hiện tại: URL thuần. Sau: chuyển sang FileAttachment.Id.
    /// </summary>
    public string? CertificateUrl { get; set; }                 // max 500
    public DateTime? CompletedAt { get; set; }

    // ── Navigation ───────────────────────────────────────────────────────────
    public RoadmapNode Node { get; set; } = null!;
}
