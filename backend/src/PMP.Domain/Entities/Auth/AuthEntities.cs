using Microsoft.AspNetCore.Identity;
using PMP.Domain.Common;
using PMP.Domain.Enums;
using PMP.Domain.Entities.System;

namespace PMP.Domain.Entities.Auth;

// ─────────────────────────────────────────────────────────────────────────────
// USER  (extends IdentityUser<Guid>)
// ─────────────────────────────────────────────────────────────────────────────
public class ApplicationUser : IdentityUser<Guid>
{
    // ── Profile ──────────────────────────────────────────────────────────────
    public string Nickname { get; set; } = string.Empty;       // unique, max 50
    public string FullName { get; set; } = string.Empty;       // required, max 100
    public Gender Gender { get; set; }
    public DateOnly? DateOfBirth { get; set; }
    public string? AvatarUrl { get; set; }                     // max 500

    // ── Professional ─────────────────────────────────────────────────────────
    public string? Job { get; set; }                           // max 100
    public string? Company { get; set; }                       // max 100
    public decimal? Salary { get; set; }

    // ── Preferences ──────────────────────────────────────────────────────────
    public AppTheme Theme { get; set; } = AppTheme.Light;
    public AppLanguage Language { get; set; } = AppLanguage.VI;

    // ── Auth flags ───────────────────────────────────────────────────────────
    public bool IsEmailVerified { get; set; } = false;
    public bool IsGoogleLinked { get; set; } = false;

    // ── Audit ────────────────────────────────────────────────────────────────
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; } = false;

    // ── Navigation ───────────────────────────────────────────────────────────
    public ICollection<OAuthProviderLink> OAuthProviders { get; set; } = [];
    public ICollection<RefreshToken> RefreshTokens { get; set; } = [];
    public ICollection<EmailVerificationToken> EmailVerificationTokens { get; set; } = [];
    public ICollection<PasswordResetToken> PasswordResetTokens { get; set; } = [];
    public UserSetting? Setting { get; set; }
}

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH PROVIDER LINK
// ─────────────────────────────────────────────────────────────────────────────
public class OAuthProviderLink : BaseEntity
{
    public Guid UserId { get; set; }
    public OAuthProvider Provider { get; set; }
    public string ProviderUserId { get; set; } = string.Empty;  // Google sub
    public string? AccessToken { get; set; }                    // encrypted at rest
    public DateTime LinkedAt { get; set; } = DateTime.UtcNow;

    public ApplicationUser User { get; set; } = null!;
}

// ─────────────────────────────────────────────────────────────────────────────
// REFRESH TOKEN
// ─────────────────────────────────────────────────────────────────────────────
public class RefreshToken : BaseTokenEntity
{
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;       // SHA-256
    public DateTime ExpiresAt { get; set; }                     // UTC + 7 days
    public bool IsRevoked { get; set; } = false;
    public DateTime? RevokedAt { get; set; }
    public Guid? ReplacedByTokenId { get; set; }                // rotation chain

    public ApplicationUser User { get; set; } = null!;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL VERIFICATION TOKEN
// ─────────────────────────────────────────────────────────────────────────────
public class EmailVerificationToken : BaseTokenEntity
{
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;       // SHA-256
    public DateTime ExpiresAt { get; set; }                     // UTC + 24h
    public bool IsUsed { get; set; } = false;

    public ApplicationUser User { get; set; } = null!;
}

// ─────────────────────────────────────────────────────────────────────────────
// PASSWORD RESET TOKEN
// ─────────────────────────────────────────────────────────────────────────────
public class PasswordResetToken : BaseTokenEntity
{
    public Guid UserId { get; set; }
    public string TokenHash { get; set; } = string.Empty;       // SHA-256
    public DateTime ExpiresAt { get; set; }                     // UTC + 15 min
    public bool IsUsed { get; set; } = false;

    public ApplicationUser User { get; set; } = null!;
}
