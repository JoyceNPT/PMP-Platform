using PMP.Application.Features.Roadmap.DTOs;
using PMP.Shared.Wrappers;

namespace PMP.Application.Features.Roadmap.Interfaces;

public interface IRoadmapService
{
    // Profile
    Task<ApiResponse<UserCareerProfileDto>> GetOrCreateProfileAsync(Guid userId);
    Task<ApiResponse<UserCareerProfileDto>> UpdateProfileAsync(Guid userId, UpdateCareerProfileRequest request);
    
    // Skills
    Task<ApiResponse<UserSkillDto>> AddSkillAsync(Guid userId, AddSkillRequest request);
    Task<ApiResponse<bool>> DeleteSkillAsync(Guid userId, Guid skillId);

    // Roadmap
    Task<ApiResponse<CareerRoadmapDto>> GetActiveRoadmapAsync(Guid userId);
    Task<ApiResponse<CareerRoadmapDto>> GenerateAiRoadmapAsync(Guid userId, GenerateRoadmapRequest request);
    Task<ApiResponse<bool>> DeleteRoadmapAsync(Guid userId, Guid roadmapId);

    // Progress
    Task<ApiResponse<bool>> UpdateNodeProgressAsync(Guid userId, UpdateNodeProgressRequest request);
}
