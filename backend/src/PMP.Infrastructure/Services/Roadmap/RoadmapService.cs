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
                Each step must include a unique key, title, brief explanation (desc), a category (cat), and an order index (order).
                Also specify prerequisite keys (pre) if a step depends on another.

                IMPORTANT: The category (cat) MUST be exactly one of these three values:
                1. ""Basic"": Core language syntax/rules (e.g. C# if the path is .NET), OOP principles, basic Frontend (HTML/CSS/JS), or basic Backend concepts.
                2. ""Advanced"": Database (SQL/NoSQL), Web development (APIs, MVC), Git, and Docker.
                3. ""Master"": DevOps, CI/CD, testing, cloud deployment, and advanced architecture.

                Return ONLY a JSON array of objects with this schema:
                [
                  {{
                    ""key"": ""unique_id_string"",
                    ""title"": ""Step Title"",
                    ""desc"": ""Brief explanation"",
                    ""cat"": ""Basic"" | ""Advanced"" | ""Master"",
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

            // 3. Create nodes with structured positioning based on Basic, Advanced, Master columns
            var basicCount = 0;
            var advancedCount = 0;
            var masterCount = 0;

            var nodeEntities = mockNodes.Select(n => {
                var catNormalized = n.Cat?.Trim() ?? "Basic";
                if (catNormalized.Contains("basic", StringComparison.OrdinalIgnoreCase)) catNormalized = "Basic";
                else if (catNormalized.Contains("advanced", StringComparison.OrdinalIgnoreCase) || catNormalized.Contains("advented", StringComparison.OrdinalIgnoreCase)) catNormalized = "Advanced";
                else if (catNormalized.Contains("master", StringComparison.OrdinalIgnoreCase) || catNormalized.Contains("expert", StringComparison.OrdinalIgnoreCase)) catNormalized = "Master";
                else catNormalized = "Basic"; // fallback

                decimal posX = 100;
                decimal posY = 100;

                if (catNormalized == "Basic") {
                    posX = 100;
                    posY = basicCount * 180 + 100;
                    basicCount++;
                } else if (catNormalized == "Advanced") {
                    posX = 450;
                    posY = advancedCount * 180 + 100;
                    advancedCount++;
                } else { // Master
                    posX = 800;
                    posY = masterCount * 180 + 100;
                    masterCount++;
                }

                return new RoadmapNode
                {
                    RoadmapId = roadmap.Id,
                    NodeKey = n.Key,
                    Title = n.Title,
                    Description = n.Desc,
                    Category = catNormalized,
                    OrderIndex = n.Order,
                    PositionX = posX,
                    PositionY = posY,
                    IsCustom = false
                };
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

    public async Task<ApiResponse<RoadmapNodeDto>> AddCustomNodeAsync(Guid userId, AddCustomNodeRequest request)
    {
        try
        {
            var roadmap = await _db.CareerRoadmaps.FirstOrDefaultAsync(r => r.UserId == userId && r.IsActive);
            if (roadmap == null) return new ApiResponse<RoadmapNodeDto>("Không tìm thấy lộ trình đang hoạt động.");

            var catNormalized = request.Category?.Trim() ?? "Basic";
            if (catNormalized.Contains("basic", StringComparison.OrdinalIgnoreCase)) catNormalized = "Basic";
            else if (catNormalized.Contains("advanced", StringComparison.OrdinalIgnoreCase) || catNormalized.Contains("advented", StringComparison.OrdinalIgnoreCase)) catNormalized = "Advanced";
            else if (catNormalized.Contains("master", StringComparison.OrdinalIgnoreCase) || catNormalized.Contains("expert", StringComparison.OrdinalIgnoreCase)) catNormalized = "Master";
            else catNormalized = "Basic";

            // Tự động tính tọa độ Y ở dưới cùng của cột tương ứng
            var maxY = await _db.RoadmapNodes
                .Where(n => n.RoadmapId == roadmap.Id && n.Category == catNormalized)
                .Select(n => (decimal?)n.PositionY)
                .MaxAsync() ?? 0;

            decimal posX = catNormalized switch
            {
                "Basic" => 100,
                "Advanced" => 450,
                "Master" => 800,
                _ => 100
            };

            var maxOrder = await _db.RoadmapNodes
                .Where(n => n.RoadmapId == roadmap.Id)
                .Select(n => (int?)n.OrderIndex)
                .MaxAsync() ?? 0;

            var nodeKey = "custom_" + Guid.NewGuid().ToString("N").Substring(0, 8);

            var node = new RoadmapNode
            {
                RoadmapId = roadmap.Id,
                NodeKey = nodeKey,
                Title = request.Title,
                Description = request.Description,
                Category = catNormalized,
                OrderIndex = maxOrder + 1,
                PositionX = posX,
                PositionY = maxY + 180,
                IsCustom = true
            };

            _db.RoadmapNodes.Add(node);
            await _db.SaveChangesAsync();

            // Thêm các node tiền đề (prerequisites)
            if (request.PrerequisiteNodeIds != null && request.PrerequisiteNodeIds.Any())
            {
                foreach (var preId in request.PrerequisiteNodeIds)
                {
                    var preNode = await _db.RoadmapNodes.FirstOrDefaultAsync(n => n.Id == preId && n.RoadmapId == roadmap.Id);
                    if (preNode != null)
                    {
                        _db.RoadmapNodePrerequisites.Add(new RoadmapNodePrerequisite
                        {
                            NodeId = node.Id,
                            PrerequisiteNodeId = preNode.Id
                        });
                    }
                }
                await _db.SaveChangesAsync();
            }

            // Reload node với UserProgress và Prerequisites để map đúng
            var savedNode = await _db.RoadmapNodes
                .Include(n => n.Prerequisites).ThenInclude(p => p.PrerequisiteNode)
                .Include(n => n.UserProgress)
                .FirstAsync(n => n.Id == node.Id);

            return new ApiResponse<RoadmapNodeDto>(MapNode(savedNode, userId), "Thêm kỹ năng tự chọn thành công.");
        }
        catch (Exception ex)
        {
            return new ApiResponse<RoadmapNodeDto>($"Lỗi khi thêm kỹ năng tự chọn: {ex.Message}");
        }
    }

    public async Task<ApiResponse<bool>> DeleteCustomNodeAsync(Guid userId, Guid nodeId)
    {
        try
        {
            var node = await _db.RoadmapNodes
                .Include(n => n.Roadmap)
                .Include(n => n.Prerequisites)
                .Include(n => n.RequiredBy)
                .Include(n => n.UserProgress)
                .FirstOrDefaultAsync(n => n.Id == nodeId);

            if (node == null) return new ApiResponse<bool>("Không tìm thấy kỹ năng.");
            if (node.Roadmap.UserId != userId) return new ApiResponse<bool>("Bạn không có quyền xóa kỹ năng này.");
            if (!node.IsCustom) return new ApiResponse<bool>("Không thể xóa kỹ năng do AI đề xuất.");

            // Manually delete prerequisites (both direction)
            _db.RoadmapNodePrerequisites.RemoveRange(node.Prerequisites);
            _db.RoadmapNodePrerequisites.RemoveRange(node.RequiredBy);
            _db.UserNodeProgress.RemoveRange(node.UserProgress);
            
            _db.RoadmapNodes.Remove(node);
            await _db.SaveChangesAsync();

            return new ApiResponse<bool>(true, "Đã xóa kỹ năng tự chọn thành công.");
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool>($"Lỗi khi xóa kỹ năng tự chọn: {ex.Message}");
        }
    }

    public async Task<ApiResponse<RoadmapNodeDto>> UpdateCustomNodeAsync(Guid userId, Guid nodeId, UpdateCustomNodeRequest request)
    {
        try
        {
            var node = await _db.RoadmapNodes
                .Include(n => n.Roadmap)
                .Include(n => n.Prerequisites)
                .Include(n => n.UserProgress)
                .FirstOrDefaultAsync(n => n.Id == nodeId);

            if (node == null) return new ApiResponse<RoadmapNodeDto>("Không tìm thấy kỹ năng.");
            if (node.Roadmap.UserId != userId) return new ApiResponse<RoadmapNodeDto>("Bạn không có quyền chỉnh sửa kỹ năng này.");
            if (!node.IsCustom) return new ApiResponse<RoadmapNodeDto>("Không thể chỉnh sửa kỹ năng do AI đề xuất.");

            node.Title = request.Title;
            node.Description = request.Description;

            var catNormalized = request.Category?.Trim() ?? "Basic";
            if (catNormalized.Contains("basic", StringComparison.OrdinalIgnoreCase)) catNormalized = "Basic";
            else if (catNormalized.Contains("advanced", StringComparison.OrdinalIgnoreCase) || catNormalized.Contains("advented", StringComparison.OrdinalIgnoreCase)) catNormalized = "Advanced";
            else if (catNormalized.Contains("master", StringComparison.OrdinalIgnoreCase) || catNormalized.Contains("expert", StringComparison.OrdinalIgnoreCase)) catNormalized = "Master";
            else catNormalized = "Basic";

            // Nếu thay đổi category thì tính lại vị trí X và Y ở cuối cột mới
            if (node.Category != catNormalized)
            {
                node.Category = catNormalized;
                var maxY = await _db.RoadmapNodes
                    .Where(n => n.RoadmapId == node.RoadmapId && n.Category == catNormalized && n.Id != node.Id)
                    .Select(n => (decimal?)n.PositionY)
                    .MaxAsync() ?? 0;

                node.PositionX = catNormalized switch
                {
                    "Basic" => 100,
                    "Advanced" => 450,
                    "Master" => 800,
                    _ => 100
                };
                node.PositionY = maxY + 180;
            }

            // Cập nhật prerequisites
            _db.RoadmapNodePrerequisites.RemoveRange(node.Prerequisites);
            await _db.SaveChangesAsync();

            if (request.PrerequisiteNodeIds != null && request.PrerequisiteNodeIds.Any())
            {
                foreach (var preId in request.PrerequisiteNodeIds)
                {
                    var preNode = await _db.RoadmapNodes.FirstOrDefaultAsync(n => n.Id == preId && n.RoadmapId == node.RoadmapId);
                    if (preNode != null && preNode.Id != node.Id)
                    {
                        _db.RoadmapNodePrerequisites.Add(new RoadmapNodePrerequisite
                        {
                            NodeId = node.Id,
                            PrerequisiteNodeId = preNode.Id
                        });
                    }
                }
                await _db.SaveChangesAsync();
            }

            await _db.SaveChangesAsync();

            var savedNode = await _db.RoadmapNodes
                .Include(n => n.Prerequisites).ThenInclude(p => p.PrerequisiteNode)
                .Include(n => n.UserProgress)
                .FirstAsync(n => n.Id == node.Id);

            return new ApiResponse<RoadmapNodeDto>(MapNode(savedNode, userId), "Cập nhật kỹ năng tự chọn thành công.");
        }
        catch (Exception ex)
        {
            return new ApiResponse<RoadmapNodeDto>($"Lỗi khi cập nhật kỹ năng tự chọn: {ex.Message}");
        }
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
            PrerequisiteKeys = n.Prerequisites.Select(p => p.PrerequisiteNode.NodeKey).ToList(),
            IsCustom = n.IsCustom
        };
    }

    private List<RoadmapNodeTemplate> GenerateFallbackNodes(UserCareerProfile profile, GenerateRoadmapRequest req)
    {
        // Simple but high-quality fallback based on the goal
        var nodes = new List<RoadmapNodeTemplate>
        {
            new() { Key = "f1", Title = $"Nền tảng {profile.Major}", Desc = "Ôn tập các kiến thức cốt lõi và tư duy căn bản.", Cat = "Basic", Order = 1 },
            new() { Key = "f2", Title = "Kỹ năng chuyên môn", Desc = $"Nghiệp vụ cần thiết cho vị trí {req.CareerPath}.", Cat = "Basic", Order = 2, Pre = ["f1"] },
            new() { Key = "f3", Title = "Công cụ & Quy trình", Desc = "Làm quen với các phần mềm và phương pháp làm việc thực tế.", Cat = "Advanced", Order = 3, Pre = ["f2"] },
            new() { Key = "f4", Title = "Dự án thực tế", Desc = "Xây dựng portfolio và áp dụng kiến thức vào bài toán thực tế.", Cat = "Advanced", Order = 4, Pre = ["f3"] },
            new() { Key = "f5", Title = "Nâng cao & Mở rộng", Desc = $"Hoàn thiện kỹ năng để đạt mức {req.TargetLevel}.", Cat = "Master", Order = 5, Pre = ["f4"] }
        };

        if (req.TargetLevel >= 2) // Advanced
        {
            nodes.Add(new() { Key = "f6", Title = "Tối ưu hóa & Kiến trúc", Desc = "Nâng cao hiệu suất và tư duy hệ thống quy mô lớn.", Cat = "Master", Order = 6, Pre = ["f5"] });
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
