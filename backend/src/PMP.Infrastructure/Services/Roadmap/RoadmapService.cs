using Microsoft.EntityFrameworkCore;
using PMP.Application.Features.Roadmap.DTOs;
using PMP.Application.Features.Roadmap.Interfaces;
using PMP.Domain.Entities.Roadmap;
using PMP.Domain.Enums;
using PMP.Infrastructure.Persistence;
using PMP.Infrastructure.Services.System;
using PMP.Shared.Wrappers;
using System.Text.Json;

namespace PMP.Infrastructure.Services.Roadmap;

public class RoadmapService : IRoadmapService
{
    private readonly ApplicationDbContext _db;
    private readonly IAiService _aiService;

    public RoadmapService(ApplicationDbContext db, IAiService aiService)
    {
        _db = db;
        _aiService = aiService;
    }

    // ─── Profile ─────────────────────────────────────────────────────────────

    public async Task<ApiResponse<UserCareerProfileDto>> GetOrCreateProfileAsync(Guid userId)
    {
        var profile = await _db.UserCareerProfiles
            .Include(p => p.Skills)
            .FirstOrDefaultAsync(p => p.UserId == userId);

        if (profile == null)
        {
            profile = new UserCareerProfile { UserId = userId, Major = "Chưa cập nhật" };
            _db.UserCareerProfiles.Add(profile);
            await _db.SaveChangesAsync();
        }

        return new ApiResponse<UserCareerProfileDto>(MapProfile(profile));
    }

    public async Task<ApiResponse<UserCareerProfileDto>> UpdateProfileAsync(Guid userId, UpdateCareerProfileRequest req)
    {
        var profile = await _db.UserCareerProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null)
        {
            profile = new UserCareerProfile { UserId = userId };
            _db.UserCareerProfiles.Add(profile);
        }

        profile.Major = req.Major;
        profile.CurrentJob = req.CurrentJob;
        profile.ExperienceYears = req.ExperienceYears;

        await _db.SaveChangesAsync();
        
        // Reload with skills
        profile = await _db.UserCareerProfiles.Include(p => p.Skills).FirstAsync(p => p.UserId == userId);
        return new ApiResponse<UserCareerProfileDto>(MapProfile(profile), "Cập nhật hồ sơ thành công.");
    }

    // ─── Skills ──────────────────────────────────────────────────────────────

    public async Task<ApiResponse<UserSkillDto>> AddSkillAsync(Guid userId, AddSkillRequest req)
    {
        var profile = await _db.UserCareerProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        if (profile == null) return new ApiResponse<UserSkillDto>("Hãy tạo hồ sơ trước.");

        var skill = new UserSkill
        {
            UserId = userId,
            CareerProfileId = profile.Id,
            SkillName = req.SkillName,
            SkillType = (SkillType)req.SkillType,
            ProficiencyLevel = (ProficiencyLevel?)req.ProficiencyLevel
        };

        _db.UserSkills.Add(skill);
        await _db.SaveChangesAsync();

        return new ApiResponse<UserSkillDto>(MapSkill(skill), "Đã thêm kỹ năng.");
    }

    public async Task<ApiResponse<bool>> DeleteSkillAsync(Guid userId, Guid skillId)
    {
        var skill = await _db.UserSkills.FirstOrDefaultAsync(s => s.Id == skillId && s.UserId == userId);
        if (skill == null) return new ApiResponse<bool>("Không tìm thấy kỹ năng.");

        _db.UserSkills.Remove(skill);
        await _db.SaveChangesAsync();
        return new ApiResponse<bool>(true, "Đã xoá kỹ năng.");
    }

    // ─── Roadmap ─────────────────────────────────────────────────────────────

    public async Task<ApiResponse<CareerRoadmapDto>> GetActiveRoadmapAsync(Guid userId)
    {
        var roadmap = await _db.CareerRoadmaps
            .Include(r => r.Nodes).ThenInclude(n => n.Prerequisites)
            .Include(r => r.Nodes).ThenInclude(n => n.UserProgress)
            .FirstOrDefaultAsync(r => r.UserId == userId && r.IsActive);

        if (roadmap == null) return new ApiResponse<CareerRoadmapDto>("Chưa có roadmap nào được kích hoạt.");

        return new ApiResponse<CareerRoadmapDto>(MapRoadmap(roadmap, userId));
    }

    public async Task<ApiResponse<CareerRoadmapDto>> GenerateAiRoadmapAsync(Guid userId, GenerateRoadmapRequest req)
    {
        try
        {
            // 1. Deactivate current roadmap
            var activeRoadmap = await _db.CareerRoadmaps.FirstOrDefaultAsync(r => r.UserId == userId && r.IsActive);
            if (activeRoadmap != null)
            {
                activeRoadmap.IsActive = false;
            }

            // 2. Call Gemini AI
            var profile = await _db.UserCareerProfiles.Include(p => p.Skills).FirstOrDefaultAsync(p => p.UserId == userId);
            
            if (profile == null || string.IsNullOrWhiteSpace(profile.Major))
                return new ApiResponse<CareerRoadmapDto>("Vui lòng cập nhật Hồ sơ năng lực (Chuyên ngành) trước khi tạo lộ trình.");

            var currentSkills = string.Join(", ", profile.Skills.Select(s => s.SkillName));
            var targetLevelStr = req.TargetLevel switch {
                0 => "Beginner",
                1 => "Intermediate",
                2 => "Advanced",
                3 => "Expert",
                _ => "Intermediate"
            };

            var prompt = $@"
                Create a detailed career roadmap for a user with the following profile:
                - Major/Study: {profile.Major}
                - Current Job: {profile.CurrentJob ?? "None/Student"}
                - Experience: {profile.ExperienceYears} years
                - Current Skills: {currentSkills}
                - Goal: Become a {req.CareerPath} at {targetLevelStr} level.

                The roadmap should be a list of steps (nodes) to achieve this goal.
                Each step must include a unique key, title, brief description, a category (e.g., Fundamentals, Advanced, Tools), and an order index.
                Also specify prerequisite keys if a step depends on another.

                Return ONLY a JSON array of objects with this schema:
                [
                  {{
                    ""key"": ""unique_id_string"",
                    ""title"": ""Step Title"",
                    ""desc"": ""Brief explanation"",
                    ""cat"": ""Category Name"",
                    ""order"": 1,
                    ""pre"": [""prerequisite_key1""]
                  }}
                ]";

            var systemPrompt = "You are a professional Career Coach and Technical Expert. You provide highly accurate, practical, and CONCISE career roadmaps. Return raw JSON array only.";

            var mockNodes = await _aiService.GetStructuredResponseAsync<List<RoadmapNodeTemplate>>(prompt, systemPrompt);

            if (mockNodes == null || mockNodes.Count == 0)
            {
                // FALLBACK: Generate a high-quality static roadmap if AI fails (Quota issue)
                mockNodes = GenerateFallbackNodes(profile, req);
            }

            var roadmap = new CareerRoadmap
            {
                UserId = userId,
                CareerPath = req.CareerPath,
                Source = RoadmapSource.AiGenerated,
                IsActive = true,
                RawData = JsonSerializer.Serialize(mockNodes)
            };

            _db.CareerRoadmaps.Add(roadmap);
            await _db.SaveChangesAsync();

            // 3. Create nodes with better positioning
            var nodeEntities = mockNodes.Select((n, idx) => new RoadmapNode
            {
                RoadmapId = roadmap.Id,
                NodeKey = n.Key,
                Title = n.Title,
                Description = n.Desc,
                Category = n.Cat,
                OrderIndex = n.Order,
                PositionX = (idx % 3) * 300 + 100,
                PositionY = (idx / 3) * 200 + 100
            }).ToList();

            _db.RoadmapNodes.AddRange(nodeEntities);
            await _db.SaveChangesAsync();

            // 4. Create prerequisites
            foreach (var nodeTemplate in mockNodes.Where(n => n.Pre != null))
            {
                var node = nodeEntities.First(n => n.NodeKey == nodeTemplate.Key);
                foreach (var preKey in nodeTemplate.Pre!)
                {
                    var preNode = nodeEntities.FirstOrDefault(n => n.NodeKey == preKey);
                    if (preNode != null)
                    {
                        _db.RoadmapNodePrerequisites.Add(new RoadmapNodePrerequisite
                        {
                            NodeId = node.Id,
                            PrerequisiteNodeId = preNode.Id
                        });
                    }
                }
            }

            await _db.SaveChangesAsync();

            return await GetActiveRoadmapAsync(userId);
        }
        catch (Exception ex)
        {
            return new ApiResponse<CareerRoadmapDto>($"Lỗi hệ thống khi tạo lộ trình: {ex.Message}");
        }
    }

    public async Task<ApiResponse<bool>> DeleteRoadmapAsync(Guid userId, Guid roadmapId)
    {
        var roadmap = await _db.CareerRoadmaps
            .Include(r => r.Nodes).ThenInclude(n => n.Prerequisites)
            .Include(r => r.Nodes).ThenInclude(n => n.UserProgress)
            .FirstOrDefaultAsync(r => r.Id == roadmapId && r.UserId == userId);
            
        if (roadmap == null) return new ApiResponse<bool>("Không tìm thấy roadmap.");

        // Manually cascade delete to avoid FK errors if not configured in DB
        foreach (var node in roadmap.Nodes)
        {
            _db.RoadmapNodePrerequisites.RemoveRange(node.Prerequisites);
            _db.UserNodeProgress.RemoveRange(node.UserProgress);
        }
        _db.RoadmapNodes.RemoveRange(roadmap.Nodes);
        _db.CareerRoadmaps.Remove(roadmap);
        
        await _db.SaveChangesAsync();
        return new ApiResponse<bool>(true, "Đã xoá roadmap.");
    }

    // ─── Progress ────────────────────────────────────────────────────────────

    public async Task<ApiResponse<bool>> UpdateNodeProgressAsync(Guid userId, UpdateNodeProgressRequest req)
    {
        var progress = await _db.UserNodeProgress
            .FirstOrDefaultAsync(p => p.UserId == userId && p.NodeId == req.NodeId);

        if (progress == null)
        {
            progress = new UserNodeProgress
            {
                UserId = userId,
                NodeId = req.NodeId,
                Status = (NodeStatus)req.Status,
                Note = req.Status == (int)NodeStatus.InProgress ? req.Note : null,
                CertificateUrl = req.Status == (int)NodeStatus.Completed ? req.CertificateUrl : null,
                CompletedAt = req.Status == (int)NodeStatus.Completed ? DateTime.UtcNow : null
            };
            _db.UserNodeProgress.Add(progress);
        }
        else
        {
            progress.Status = (NodeStatus)req.Status;
            
            if (req.Status == (int)NodeStatus.InProgress) {
                progress.Note = req.Note;
                progress.CertificateUrl = null;
                progress.CompletedAt = null;
            } 
            else if (req.Status == (int)NodeStatus.Completed) {
                progress.CertificateUrl = req.CertificateUrl;
                if (progress.CompletedAt == null) progress.CompletedAt = DateTime.UtcNow;
            }
            else {
                progress.Note = null;
                progress.CertificateUrl = null;
                progress.CompletedAt = null;
            }
        }

        await _db.SaveChangesAsync();
        return new ApiResponse<bool>(true, "Cập nhật tiến độ thành công.");
    }

    // ─── Mapping ─────────────────────────────────────────────────────────────

    private UserCareerProfileDto MapProfile(UserCareerProfile p) => new()
    {
        Id = p.Id,
        Major = p.Major,
        CurrentJob = p.CurrentJob,
        ExperienceYears = p.ExperienceYears,
        Skills = p.Skills.Select(MapSkill).ToList()
    };

    private UserSkillDto MapSkill(UserSkill s) => new()
    {
        Id = s.Id,
        SkillName = s.SkillName,
        SkillType = (int)s.SkillType,
        ProficiencyLevel = (int?)s.ProficiencyLevel
    };

    private CareerRoadmapDto MapRoadmap(CareerRoadmap r, Guid userId) => new()
    {
        Id = r.Id,
        CareerPath = r.CareerPath,
        Source = (int)r.Source,
        IsActive = r.IsActive,
        RawData = r.RawData,
        Nodes = r.Nodes.Select(n => MapNode(n, userId)).OrderBy(n => n.OrderIndex).ToList()
    };

    private RoadmapNodeDto MapNode(RoadmapNode n, Guid userId)
    {
        var progress = n.UserProgress.FirstOrDefault(p => p.UserId == userId);
        return new RoadmapNodeDto
        {
            Id = n.Id,
            NodeKey = n.NodeKey,
            Title = n.Title,
            Description = n.Description,
            Category = n.Category,
            OrderIndex = n.OrderIndex,
            PositionX = n.PositionX,
            PositionY = n.PositionY,
            Status = progress != null ? (int)progress.Status : 0,
            Note = progress?.Note,
            CertificateUrl = progress?.CertificateUrl,
            PrerequisiteKeys = n.Prerequisites.Select(p => p.PrerequisiteNode.NodeKey).ToList()
        };
    }

    private List<RoadmapNodeTemplate> GenerateFallbackNodes(UserCareerProfile profile, GenerateRoadmapRequest req)
    {
        // Simple but high-quality fallback based on the goal
        var nodes = new List<RoadmapNodeTemplate>
        {
            new() { Key = "f1", Title = $"Nền tảng {profile.Major}", Desc = "Ôn tập các kiến thức cốt lõi và tư duy căn bản.", Cat = "Nền tảng", Order = 1 },
            new() { Key = "f2", Title = "Kỹ năng chuyên môn", Desc = $"Nghiệp vụ cần thiết cho vị trí {req.CareerPath}.", Cat = "Chuyên môn", Order = 2, Pre = ["f1"] },
            new() { Key = "f3", Title = "Công cụ & Quy trình", Desc = "Làm quen với các phần mềm và phương pháp làm việc thực tế.", Cat = "Công cụ", Order = 3, Pre = ["f2"] },
            new() { Key = "f4", Title = "Dự án thực tế", Desc = "Xây dựng portfolio và áp dụng kiến thức vào bài toán thực tế.", Cat = "Thực hành", Order = 4, Pre = ["f3"] },
            new() { Key = "f5", Title = "Nâng cao & Mở rộng", Desc = $"Hoàn thiện kỹ năng để đạt mức {req.TargetLevel}.", Cat = "Nâng cao", Order = 5, Pre = ["f4"] }
        };

        if (req.TargetLevel >= 2) // Advanced
        {
            nodes.Add(new() { Key = "f6", Title = "Tối ưu hóa & Kiến trúc", Desc = "Nâng cao hiệu suất và tư duy hệ thống quy mô lớn.", Cat = "Expert", Order = 6, Pre = ["f5"] });
        }

        return nodes;
    }

    private class RoadmapNodeTemplate
    {
        public string Key { get; set; } = "";
        public string Title { get; set; } = "";
        public string Desc { get; set; } = "";
        public string Cat { get; set; } = "";
        public int Order { get; set; }
        public List<string>? Pre { get; set; }
    }
}
