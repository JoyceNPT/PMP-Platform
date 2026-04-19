using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PMP.Domain.Entities.Auth;
using PMP.Domain.Entities.System;

namespace PMP.Infrastructure.Persistence.Configurations.Auth;

public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        builder.ToTable("Users");

        builder.HasKey(u => u.Id);

        builder.Property(u => u.Nickname)
            .IsRequired().HasMaxLength(50);
        builder.HasIndex(u => u.Nickname)
            .IsUnique()
            .HasFilter("\"IsDeleted\" = false");    // partial unique index

        builder.Property(u => u.FullName)
            .IsRequired().HasMaxLength(100);

        builder.Property(u => u.Gender)
            .IsRequired();

        builder.Property(u => u.AvatarUrl)
            .HasMaxLength(500);

        builder.Property(u => u.Job).HasMaxLength(100);
        builder.Property(u => u.Company).HasMaxLength(100);

        builder.Property(u => u.Salary)
            .HasColumnType("numeric(18,2)");

        builder.Property(u => u.CreatedAt)
            .IsRequired()
            .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

        builder.Property(u => u.UpdatedAt)
            .IsRequired()
            .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

        // Soft delete — global query filter áp dụng ở DbContext
        builder.Property(u => u.IsDeleted)
            .IsRequired().HasDefaultValue(false);

        builder.HasIndex(u => u.IsDeleted);

        // 1:Many relationships
        builder.HasMany(u => u.OAuthProviders)
            .WithOne(o => o.User)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.RefreshTokens)
            .WithOne(r => r.User)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.EmailVerificationTokens)
            .WithOne(e => e.User)
            .HasForeignKey(e => e.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(u => u.PasswordResetTokens)
            .WithOne(p => p.User)
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(u => u.Setting)
            .WithOne()
            .HasForeignKey<UserSetting>(s => s.UserId)  // defined in System config
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class OAuthProviderLinkConfiguration : IEntityTypeConfiguration<OAuthProviderLink>
{
    public void Configure(EntityTypeBuilder<OAuthProviderLink> builder)
    {
        builder.ToTable("OAuthProviderLinks");

        builder.HasKey(o => o.Id);

        builder.Property(o => o.ProviderUserId)
            .IsRequired().HasMaxLength(200);

        // 1 user chỉ liên kết 1 lần cho mỗi provider
        builder.HasIndex(o => new { o.UserId, o.Provider }).IsUnique();
        builder.HasIndex(o => new { o.Provider, o.ProviderUserId }).IsUnique();

        builder.Property(o => o.LinkedAt)
            .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

        // AccessToken — encrypt ở application layer trước khi lưu
        builder.Property(o => o.AccessToken).HasMaxLength(2000);

        builder.Property(o => o.IsDeleted).HasDefaultValue(false);
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.TokenHash)
            .IsRequired().HasMaxLength(64);             // SHA-256 hex = 64 chars

        builder.HasIndex(r => r.TokenHash).IsUnique();
        builder.HasIndex(r => r.UserId);
        builder.HasIndex(r => r.ExpiresAt);             // cleanup job filter

        builder.Property(r => r.CreatedAt)
            .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
    }
}

public class EmailVerificationTokenConfiguration : IEntityTypeConfiguration<EmailVerificationToken>
{
    public void Configure(EntityTypeBuilder<EmailVerificationToken> builder)
    {
        builder.ToTable("EmailVerificationTokens");

        builder.HasKey(e => e.Id);

        builder.Property(e => e.TokenHash)
            .IsRequired().HasMaxLength(64);

        builder.HasIndex(e => e.TokenHash).IsUnique();
        builder.HasIndex(e => e.UserId);
        builder.HasIndex(e => e.ExpiresAt);
    }
}

public class PasswordResetTokenConfiguration : IEntityTypeConfiguration<PasswordResetToken>
{
    public void Configure(EntityTypeBuilder<PasswordResetToken> builder)
    {
        builder.ToTable("PasswordResetTokens");

        builder.HasKey(p => p.Id);

        builder.Property(p => p.TokenHash)
            .IsRequired().HasMaxLength(64);

        builder.HasIndex(p => p.TokenHash).IsUnique();
        builder.HasIndex(p => p.UserId);
        builder.HasIndex(p => p.ExpiresAt);
    }
}
