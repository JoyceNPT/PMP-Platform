using PMP.Application.Features.Auth.DTOs;
using PMP.Shared.Wrappers;

namespace PMP.Application.Features.Auth.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<AuthResponse>> RegisterAsync(RegisterRequest request);
    Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request);
}
