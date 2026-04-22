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
            // Set Refresh Token as HttpOnly Cookie
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(7),
                Secure = true,
                SameSite = SameSiteMode.Strict
            };
            Response.Cookies.Append("refreshToken", response.Data!.RefreshToken, cookieOptions);

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
            var cookieOptions = new CookieOptions
            {
                HttpOnly = true,
                Expires = DateTime.UtcNow.AddDays(7),
                Secure = true,
                SameSite = SameSiteMode.Strict
            };
            Response.Cookies.Append("refreshToken", response.Data!.RefreshToken, cookieOptions);

            return Ok(response);
        }

        return Unauthorized(response);
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
