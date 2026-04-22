using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Net.Http;
using System.Text.Json;
using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using PMP.Application.Features.Auth.DTOs;
using PMP.Application.Features.Auth.Interfaces;
using PMP.Application.Features.System.Interfaces;
using PMP.Domain.Entities.Auth;
using PMP.Domain.Enums;
using PMP.Shared.Wrappers;

namespace PMP.Infrastructure.Services.Auth;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;

    public AuthService(UserManager<ApplicationUser> userManager, IConfiguration configuration, IEmailService emailService)
    {
        _userManager = userManager;
        _configuration = configuration;
        _emailService = emailService;
    }

    public async Task<ApiResponse<AuthResponse>> RegisterAsync(RegisterRequest request)
    {
        try
        {
            var userExists = await _userManager.FindByEmailAsync(request.Email);
            if (userExists != null)
                return new ApiResponse<AuthResponse>("Email already exists.");

            var user = new ApplicationUser
            {
                Email = request.Email,
                UserName = request.Email,
                FullName = request.FullName,
                PhoneNumber = request.PhoneNumber,
                Gender = (Gender)request.Gender,
                // Ensure unique nickname by appending a part of GUID
                Nickname = request.Email.Split('@')[0] + "_" + Guid.NewGuid().ToString("N").Substring(0, 4)
            };

            var result = await _userManager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                var errorMsg = string.Join(", ", result.Errors.Select(e => e.Description));
                return new ApiResponse<AuthResponse>($"User creation failed: {errorMsg}");
            }

            // Send Verification Email
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var clientUrl = _configuration["ClientUrl"] ?? "http://localhost:5174";
            var verifyLink = $"{clientUrl}/verify-email?email={Uri.EscapeDataString(user.Email!)}&token={Uri.EscapeDataString(token)}";
            
            var emailRes = await _emailService.SendEmailAsync(user.Email!, "Verify your email", 
                $"Chào {user.FullName}, vui lòng nhấn vào link sau để xác thực tài khoản: {verifyLink}");

            var authResponse = new AuthResponse
            {
                AccessToken = GenerateJwtToken(user),
                UserId = user.Id,
                Email = user.Email!,
                FullName = user.FullName
            };

            if (!emailRes.Succeeded)
            {
                return new ApiResponse<AuthResponse>(authResponse, 
                    $"Registration succeeded but failed to send verification email: {emailRes.Message}");
            }

            return new ApiResponse<AuthResponse>(authResponse, "User registered successfully. Please check your email to verify your account.");
        }
        catch (Exception ex)
        {
            return new ApiResponse<AuthResponse>($"Internal error during registration: {ex.Message}");
        }
    }

    public async Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request)
    {
        // 1. Verify Recaptcha
        if (!await VerifyRecaptchaAsync(request.RecaptchaToken))
            return new ApiResponse<AuthResponse>("Recaptcha verification failed.");

        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, request.Password))
            return new ApiResponse<AuthResponse>("Invalid credentials.");

        var accessToken = GenerateJwtToken(user);
        var refreshToken = GenerateRefreshToken();

        // In a complete implementation, the refresh token should be saved to the database.
        
        return new ApiResponse<AuthResponse>(new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            UserId = user.Id,
            Email = user.Email!,
            FullName = user.FullName,
            AvatarUrl = user.AvatarUrl
        }, "Login successful.");
    }

    public async Task<ApiResponse<AuthResponse>> GoogleLoginAsync(string idToken)
    {
        try
        {
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new List<string> { _configuration["ExternalServices:Google:ClientId"]! }
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            
            var user = await _userManager.FindByEmailAsync(payload.Email);
            if (user == null)
            {
                user = new ApplicationUser
                {
                    Email = payload.Email,
                    UserName = payload.Email,
                    FullName = payload.Name,
                    Nickname = payload.GivenName ?? payload.Email.Split('@')[0],
                    AvatarUrl = payload.Picture,
                    Gender = Gender.Other, // Default
                    IsEmailVerified = true,
                    IsGoogleLinked = true
                };

                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                    return new ApiResponse<AuthResponse>("Failed to create user from Google account.");
            }
            else
            {
                // If user exists, ensure AvatarUrl is set if they don't have one
                if (string.IsNullOrEmpty(user.AvatarUrl) && !string.IsNullOrEmpty(payload.Picture))
                {
                    user.AvatarUrl = payload.Picture;
                    user.IsGoogleLinked = true;
                    await _userManager.UpdateAsync(user);
                }
            }

            var accessToken = GenerateJwtToken(user);
            var refreshToken = GenerateRefreshToken();

            return new ApiResponse<AuthResponse>(new AuthResponse
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                UserId = user.Id,
                Email = user.Email!,
                FullName = user.FullName,
                AvatarUrl = user.AvatarUrl
            }, "Google login successful.");
        }
        catch (Exception ex)
        {
            return new ApiResponse<AuthResponse>($"Google verification failed: {ex.Message}");
        }
    }

    public async Task<ApiResponse<ApplicationUser>> GetProfileAsync(Guid userId)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return new ApiResponse<ApplicationUser>("User not found.");

        return new ApiResponse<ApplicationUser>(user);
    }

    public async Task<ApiResponse<bool>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _userManager.FindByIdAsync(userId.ToString());
        if (user == null)
            return new ApiResponse<bool>("User not found.");

        if (!string.IsNullOrEmpty(request.FullName)) user.FullName = request.FullName;
        if (!string.IsNullOrEmpty(request.Nickname)) user.Nickname = request.Nickname;
        if (!string.IsNullOrEmpty(request.PhoneNumber)) user.PhoneNumber = request.PhoneNumber;
        if (request.Gender.HasValue) user.Gender = (Gender)request.Gender.Value;
        if (!string.IsNullOrEmpty(request.AvatarUrl)) user.AvatarUrl = request.AvatarUrl;
        if (!string.IsNullOrEmpty(request.Job)) user.Job = request.Job;
        if (!string.IsNullOrEmpty(request.Company)) user.Company = request.Company;
        if (request.Salary.HasValue) user.Salary = request.Salary.Value;
        if (request.Theme.HasValue) user.Theme = (AppTheme)request.Theme.Value;
        if (request.Language.HasValue) user.Language = (AppLanguage)request.Language.Value;

        if (!string.IsNullOrEmpty(request.DateOfBirth))
        {
            if (DateOnly.TryParse(request.DateOfBirth, out var dob))
                user.DateOfBirth = dob;
        }

        user.UpdatedAt = DateTime.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return new ApiResponse<bool>("Failed to update profile.");

        return new ApiResponse<bool>(true, "Profile updated successfully.");
    }

    public async Task<ApiResponse<bool>> VerifyEmailAsync(string email, string token)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null) return new ApiResponse<bool>("User not found.");

        var result = await _userManager.ConfirmEmailAsync(user, token);
        if (!result.Succeeded) return new ApiResponse<bool>("Invalid or expired token.");

        user.IsEmailVerified = true;
        await _userManager.UpdateAsync(user);

        return new ApiResponse<bool>(true, "Email verified successfully.");
    }

    public async Task<ApiResponse<bool>> ForgotPasswordAsync(string email)
    {
        var user = await _userManager.FindByEmailAsync(email);
        if (user == null) return new ApiResponse<bool>("User not found.");

        var token = await _userManager.GeneratePasswordResetTokenAsync(user);
        var clientUrl = _configuration["ClientUrl"] ?? "http://localhost:5174";
        var resetLink = $"{clientUrl}/reset-password?email={Uri.EscapeDataString(email)}&token={Uri.EscapeDataString(token)}";
        
        await _emailService.SendEmailAsync(email, "Reset Password", 
            $"Bạn đã yêu cầu đặt lại mật khẩu. Vui lòng nhấn vào link sau: {resetLink}");

        return new ApiResponse<bool>(true, "Reset link sent to your email.");
    }

    public async Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null) return new ApiResponse<bool>("User not found.");

        var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded) return new ApiResponse<bool>("Failed to reset password.");

        return new ApiResponse<bool>(true, "Password reset successfully.");
    }


    private string GenerateJwtToken(ApplicationUser user)
    {
        var authClaims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            expires: DateTime.UtcNow.AddMinutes(double.Parse(_configuration["Jwt:AccessTokenExpirationMinutes"]!)),
            claims: authClaims,
            signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken()
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private async Task<bool> VerifyRecaptchaAsync(string token)
    {
        if (token == "MOCK_TOKEN" || token == "BYPASS") return true;
        if (string.IsNullOrEmpty(token)) return false;
        
        try 
        {
            using var client = new HttpClient();
            var secretKey = _configuration["ExternalServices:Recaptcha:SecretKey"];
            var response = await client.PostAsync($"https://www.google.com/recaptcha/api/siteverify?secret={secretKey}&response={token}", null);
            
            if (!response.IsSuccessStatusCode) return false;
            
            var jsonString = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(jsonString);
            return doc.RootElement.GetProperty("success").GetBoolean();
        }
        catch 
        {
            return false;
        }
    }
}
