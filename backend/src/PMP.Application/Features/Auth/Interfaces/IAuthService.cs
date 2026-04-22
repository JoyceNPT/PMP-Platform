using PMP.Application.Features.Auth.DTOs;
using PMP.Domain.Entities.Auth;
using PMP.Shared.Wrappers;

namespace PMP.Application.Features.Auth.Interfaces;

public interface IAuthService
{
    Task<ApiResponse<AuthResponse>> RegisterAsync(RegisterRequest request);
    Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request);
    Task<ApiResponse<AuthResponse>> GoogleLoginAsync(string idToken);
    Task<ApiResponse<bool>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
    Task<ApiResponse<ApplicationUser>> GetProfileAsync(Guid userId);
    Task<ApiResponse<bool>> VerifyEmailAsync(string email, string token);
    Task<ApiResponse<bool>> ForgotPasswordAsync(string email);
    Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequest request);
}
