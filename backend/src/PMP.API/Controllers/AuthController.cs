using Microsoft.AspNetCore.Mvc;
using PMP.Application.Features.Auth.DTOs;
using PMP.Application.Features.Auth.Interfaces;
using PMP.Shared.Wrappers;

namespace PMP.API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
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
}
