using PMP.Application.Features.Dashboard.DTOs;
using PMP.Shared.Wrappers;

namespace PMP.Application.Features.Dashboard.Interfaces;

public interface IDashboardService
{
    Task<ApiResponse<DashboardOverviewDto>> GetOverviewAsync(Guid userId);
}
