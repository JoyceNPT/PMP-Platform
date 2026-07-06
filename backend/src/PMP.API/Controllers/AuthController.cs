using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using PMP.Application.Features.Auth.DTOs;
using PMP.Application.Features.Auth.Interfaces;
using PMP.Application.Features.System.Interfaces;
using PMP.Domain.Entities.Auth;
using PMP.Shared.Wrappers;

namespace PMP.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IEmailService _emailService;

    public AuthController(IAuthService authService, IEmailService emailService)
    {
        _authService = authService;
        _emailService = emailService;
    }

    private CookieOptions BuildRefreshCookieOptions()
    {
        var isDevelopment = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
        var expirationDays = int.TryParse(Environment.GetEnvironmentVariable("Jwt__RefreshTokenExpirationDays"), out var days)
            ? days
            : 30;

        return new CookieOptions
        {
            HttpOnly = true,
            Expires = DateTime.UtcNow.AddDays(expirationDays),
            Secure = !isDevelopment,
            SameSite = isDevelopment ? SameSiteMode.Lax : SameSiteMode.None,
            Path = "/"
        };
    }

    [HttpPost("register")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Register([FromBody] RegisterRequest request)
    {
        var response = await _authService.RegisterAsync(request);
        if (response.Succeeded)
            return Ok(response);
            
        return BadRequest(response);
    }

    [HttpPost("login")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        if (response.Succeeded)
        {
            Response.Cookies.Append("refreshToken", response.Data!.RefreshToken, BuildRefreshCookieOptions());

            return Ok(response);
        }

        return Unauthorized(response);
    }

    [HttpPost("google-login")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> GoogleLogin([FromBody] string idToken)
    {
        var response = await _authService.GoogleLoginAsync(idToken);
        if (response.Succeeded)
        {
            Response.Cookies.Append("refreshToken", response.Data!.RefreshToken, BuildRefreshCookieOptions());

            return Ok(response);
        }

        return Unauthorized(response);
    }

    [HttpPost("refresh-token")]
    public async Task<ActionResult<ApiResponse<AuthResponse>>> RefreshToken()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        var response = await _authService.RefreshTokenAsync(refreshToken ?? string.Empty);

        if (!response.Succeeded)
            return Unauthorized(response);

        Response.Cookies.Append("refreshToken", response.Data!.RefreshToken, BuildRefreshCookieOptions());
        return Ok(response);
    }

    [HttpPost("logout")]
    public async Task<ActionResult<ApiResponse<bool>>> Logout()
    {
        var refreshToken = Request.Cookies["refreshToken"];
        var response = await _authService.LogoutAsync(refreshToken ?? string.Empty);
        Response.Cookies.Delete("refreshToken", BuildRefreshCookieOptions());
        return Ok(response);
    }

    [HttpPost("test-email")]
    public async Task<ActionResult<ApiResponse<bool>>> SendTestEmail([FromBody] string email)
    {
        var response = await _emailService.SendEmailAsync(
            email, 
            "Test Email from PMP Platform", 
            "Congratulations! Your SendGrid integration is working perfectly.");
            
        if (response.Succeeded)
            return Ok(response);
            
        return BadRequest(response);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<ApiResponse<ApplicationUser>>> GetProfile()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await _authService.GetProfileAsync(userId);
        
        if (response.Succeeded)
            return Ok(response);
            
        return BadRequest(response);
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var response = await _authService.UpdateProfileAsync(userId, request);
        
        if (response.Succeeded)
            return Ok(response);
            
        return BadRequest(response);
    }

    [HttpGet("verify-email")]
    public async Task<ActionResult<ApiResponse<bool>>> VerifyEmail([FromQuery] string email, [FromQuery] string token)
    {
        var response = await _authService.VerifyEmailAsync(email, token);
        if (response.Succeeded) return Ok(response);
        return BadRequest(response);
    }

    [HttpPost("forgot-password")]
    public async Task<ActionResult<ApiResponse<bool>>> ForgotPassword([FromBody] string email)
    {
        var response = await _authService.ForgotPasswordAsync(email);
        if (response.Succeeded) return Ok(response);
        return BadRequest(response);
    }

    [HttpPost("reset-password")]
    public async Task<ActionResult<ApiResponse<bool>>> ResetPassword([FromBody] ResetPasswordRequest request)
    {
        var response = await _authService.ResetPasswordAsync(request);
        if (response.Succeeded) return Ok(response);
        return BadRequest(response);
    }
}
