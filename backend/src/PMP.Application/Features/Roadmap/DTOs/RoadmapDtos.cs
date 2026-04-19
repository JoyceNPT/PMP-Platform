namespace PMP.Application.Features.Roadmap.DTOs;

// ─── Career Profile ─────────────────────────────────────────────────────────

public class UserCareerProfileDto
{
    public Guid Id { get; set; }
    public string Major { get; set; } = string.Empty;
    public string? CurrentJob { get; set; }
    public int? ExperienceYears { get; set; }
    public List<UserSkillDto> Skills { get; set; } = [];
}

public class UpdateCareerProfileRequest
{
    public string Major { get; set; } = string.Empty;
    public string? CurrentJob { get; set; }
    public int? ExperienceYears { get; set; }
}

// ─── User Skill ──────────────────────────────────────────────────────────────

public class UserSkillDto
{
    public Guid Id { get; set; }
    public string SkillName { get; set; } = string.Empty;
    public int SkillType { get; set; }              // 0 = Current, 1 = Planned
    public int? ProficiencyLevel { get; set; }     // 0-4
}

public class AddSkillRequest
{
    public string SkillName { get; set; } = string.Empty;
    public int SkillType { get; set; }
    public int? ProficiencyLevel { get; set; }
}

// ─── Career Roadmap ──────────────────────────────────────────────────────────

public class CareerRoadmapDto
{
    public Guid Id { get; set; }
    public string CareerPath { get; set; } = string.Empty;
    public int Source { get; set; }                 // 0 = RoadmapSh, 1 = AiGenerated
    public bool IsActive { get; set; }
    public string RawData { get; set; } = "{}";
    public List<RoadmapNodeDto> Nodes { get; set; } = [];
}

public class GenerateRoadmapRequest
{
    public string CareerPath { get; set; } = string.Empty;  // e.g. "Fullstack Developer"
    public int TargetLevel { get; set; }                    // 0=Beginner, 1=Intermediate, 2=Advanced, 3=Expert
}

// ─── Roadmap Node ────────────────────────────────────────────────────────────

public class RoadmapNodeDto
{
    public Guid Id { get; set; }
    public string NodeKey { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public int OrderIndex { get; set; }
    public decimal? PositionX { get; set; }
    public decimal? PositionY { get; set; }
    public int Status { get; set; }                 // 0 = NotStarted, 1 = InProgress, 2 = Completed
    public string? Note { get; set; }
    public string? CertificateUrl { get; set; }
    public List<string> PrerequisiteKeys { get; set; } = [];
}

// ─── Progress ────────────────────────────────────────────────────────────────

public class UpdateNodeProgressRequest
{
    public Guid NodeId { get; set; }
    public int Status { get; set; }
    public string? Note { get; set; }
    public string? CertificateUrl { get; set; }
}
