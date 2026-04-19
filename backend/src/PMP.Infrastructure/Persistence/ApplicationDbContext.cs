using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using PMP.Domain.Entities.Auth;
using PMP.Domain.Entities.Chat;
using PMP.Domain.Entities.Finance;
using PMP.Domain.Entities.GPA;
using PMP.Domain.Entities.Roadmap;
using PMP.Domain.Entities.System;

namespace PMP.Infrastructure.Persistence;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser, IdentityRole<Guid>, Guid>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    // ── Auth ─────────────────────────────────────────────────────────────────
    public DbSet<OAuthProviderLink> OAuthProviderLinks => Set<OAuthProviderLink>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<EmailVerificationToken> EmailVerificationTokens => Set<EmailVerificationToken>();
    public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();

    // ── GPA ──────────────────────────────────────────────────────────────────
    public DbSet<GpaConfig> GpaConfigs => Set<GpaConfig>();
    public DbSet<AcademicYear> AcademicYears => Set<AcademicYear>();
    public DbSet<Semester> Semesters => Set<Semester>();
    public DbSet<Course> Courses => Set<Course>();

    // ── Finance ───────────────────────────────────────────────────────────────
    public DbSet<FinanceCategory> FinanceCategories => Set<FinanceCategory>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<SavingGoal> SavingGoals => Set<SavingGoal>();
    public DbSet<AiSpendingPrediction> AiSpendingPredictions => Set<AiSpendingPrediction>();

    // ── Roadmap ───────────────────────────────────────────────────────────────
    public DbSet<UserCareerProfile> UserCareerProfiles => Set<UserCareerProfile>();
    public DbSet<UserSkill> UserSkills => Set<UserSkill>();
    public DbSet<CareerRoadmap> CareerRoadmaps => Set<CareerRoadmap>();
    public DbSet<RoadmapNode> RoadmapNodes => Set<RoadmapNode>();
    public DbSet<RoadmapNodePrerequisite> RoadmapNodePrerequisites => Set<RoadmapNodePrerequisite>();
    public DbSet<UserNodeProgress> UserNodeProgress => Set<UserNodeProgress>();

    // ── Chat ──────────────────────────────────────────────────────────────────
    public DbSet<Conversation> Conversations => Set<Conversation>();
    public DbSet<Message> Messages => Set<Message>();
    public DbSet<AdminChatAgent> AdminChatAgents => Set<AdminChatAgent>();

    // ── System ────────────────────────────────────────────────────────────────
    public DbSet<UserSetting> UserSettings => Set<UserSetting>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<FileAttachment> FileAttachments => Set<FileAttachment>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Auto-apply tất cả IEntityTypeConfiguration<T> trong assembly
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);

        // ── Rename Identity tables ────────────────────────────────────────────
        builder.Entity<IdentityRole<Guid>>().ToTable("Roles");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");

        // ── Global Query Filters (Soft Delete) ───────────────────────────────
        // Áp dụng cho tất cả entity có IsDeleted
        builder.Entity<ApplicationUser>().HasQueryFilter(u => !u.IsDeleted);
        builder.Entity<OAuthProviderLink>().HasQueryFilter(o => !o.IsDeleted);
        builder.Entity<Course>().HasQueryFilter(c => !c.IsDeleted);
        builder.Entity<AcademicYear>().HasQueryFilter(a => !a.IsDeleted);
        builder.Entity<Semester>().HasQueryFilter(s => !s.IsDeleted);
        builder.Entity<GpaConfig>().HasQueryFilter(g => !g.IsDeleted);
        builder.Entity<FinanceCategory>().HasQueryFilter(f => !f.IsDeleted);
        builder.Entity<Transaction>().HasQueryFilter(t => !t.IsDeleted);
        builder.Entity<SavingGoal>().HasQueryFilter(s => !s.IsDeleted);
        builder.Entity<UserCareerProfile>().HasQueryFilter(u => !u.IsDeleted);
        builder.Entity<UserSkill>().HasQueryFilter(u => !u.IsDeleted);
        builder.Entity<CareerRoadmap>().HasQueryFilter(c => !c.IsDeleted);
        builder.Entity<RoadmapNode>().HasQueryFilter(r => !r.IsDeleted);
        builder.Entity<UserNodeProgress>().HasQueryFilter(u => !u.IsDeleted);
        builder.Entity<Conversation>().HasQueryFilter(c => !c.IsDeleted);
        builder.Entity<Message>().HasQueryFilter(m => !m.IsDeleted);
        builder.Entity<AdminChatAgent>().HasQueryFilter(a => !a.IsDeleted);
        builder.Entity<Notification>().HasQueryFilter(n => !n.IsDeleted);
        builder.Entity<FileAttachment>().HasQueryFilter(f => !f.IsDeleted);

        // AuditLog & token tables: KHÔNG có soft delete filter
    }

    // ── Auto-set UpdatedAt ────────────────────────────────────────────────────
    public override int SaveChanges()
    {
        SetTimestamps();
        return base.SaveChanges();
    }

    public override Task<int> SaveChangesAsync(CancellationToken ct = default)
    {
        SetTimestamps();
        return base.SaveChangesAsync(ct);
    }

    private void SetTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => e.State is EntityState.Added or EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.Entity is Domain.Common.BaseEntity entity)
            {
                entity.UpdatedAt = DateTime.UtcNow;
                if (entry.State == EntityState.Added)
                    entity.CreatedAt = DateTime.UtcNow;
            }
        }
    }
}
