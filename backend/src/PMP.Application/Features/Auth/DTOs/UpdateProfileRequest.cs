namespace PMP.Application.Features.Auth.DTOs;

public class UpdateProfileRequest
{
    public string? FullName { get; set; }
    public string? Nickname { get; set; }
    public string? PhoneNumber { get; set; }
    public int? Gender { get; set; }
    public string? DateOfBirth { get; set; } // YYYY-MM-DD
    public string? AvatarUrl { get; set; }
    public string? Job { get; set; }
    public string? Company { get; set; }
    public decimal? Salary { get; set; }
    public int? Theme { get; set; }
    public int? Language { get; set; }
}
