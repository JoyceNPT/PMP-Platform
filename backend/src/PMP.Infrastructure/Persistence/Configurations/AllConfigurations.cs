using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PMP.Domain.Entities.Chat;
using PMP.Domain.Entities.Finance;
using PMP.Domain.Entities.GPA;
using PMP.Domain.Entities.Roadmap;
using PMP.Domain.Entities.System;

namespace PMP.Infrastructure.Persistence.Configurations;

// ══════════════════════════════════════════════════════════════════════════════
// GPA CONFIGURATIONS
// ══════════════════════════════════════════════════════════════════════════════

public class GpaConfigConfiguration : IEntityTypeConfiguration<GpaConfig>
{
    public void Configure(EntityTypeBuilder<GpaConfig> builder)
    {
        builder.ToTable("GpaConfigs");
        builder.HasKey(g => g.Id);

        // 1 user chỉ có 1 config
        builder.HasIndex(g => g.UserId).IsUnique();

        builder.Property(g => g.TargetGpa)
            .HasColumnType("numeric(10,9)")             // KHÔNG làm tròn
            .IsRequired();

        builder.Property(g => g.TotalCourses).IsRequired();
        builder.Property(g => g.TotalCredits).IsRequired();

        builder.HasMany(g => g.AcademicYears)
            .WithOne(a => a.GpaConfig)
            .HasForeignKey(a => a.GpaConfigId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class AcademicYearConfiguration : IEntityTypeConfiguration<AcademicYear>
{
    public void Configure(EntityTypeBuilder<AcademicYear> builder)
    {
        builder.ToTable("AcademicYears");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.YearName).IsRequired().HasMaxLength(20);
        builder.Property(a => a.YearOrder).IsRequired();

        builder.HasIndex(a => a.UserId);
        builder.HasIndex(a => new { a.GpaConfigId, a.YearOrder }).IsUnique();

        builder.HasMany(a => a.Semesters)
            .WithOne(s => s.AcademicYear)
            .HasForeignKey(s => s.AcademicYearId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class SemesterConfiguration : IEntityTypeConfiguration<Semester>
{
    public void Configure(EntityTypeBuilder<Semester> builder)
    {
        builder.ToTable("Semesters");
        builder.HasKey(s => s.Id);

        // Không thể trùng kỳ trong cùng 1 năm học
        builder.HasIndex(s => new { s.AcademicYearId, s.SemesterType }).IsUnique();

        builder.HasMany(s => s.Courses)
            .WithOne(c => c.Semester)
            .HasForeignKey(c => c.SemesterId)
            .OnDelete(DeleteBehavior.Restrict);     // giữ courses khi xoá semester
    }
}

public class CourseConfiguration : IEntityTypeConfiguration<Course>
{
    public void Configure(EntityTypeBuilder<Course> builder)
    {
        builder.ToTable("Courses");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.CourseCode).IsRequired().HasMaxLength(20);
        builder.Property(c => c.CourseName).IsRequired().HasMaxLength(200);
        builder.Property(c => c.Credits).IsRequired();

        // precision(5,2): đủ cho 10.00, KHÔNG làm tròn
        builder.Property(c => c.Score)
            .HasColumnType("numeric(5,2)")
            .IsRequired();

        builder.HasIndex(c => c.UserId);
        builder.HasIndex(c => c.SemesterId);
        builder.HasIndex(c => c.IsDeleted);

        // Composite index cho query tính GPA
        builder.HasIndex(c => new { c.UserId, c.IsDeleted });
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// FINANCE CONFIGURATIONS
// ══════════════════════════════════════════════════════════════════════════════

public class FinanceCategoryConfiguration : IEntityTypeConfiguration<FinanceCategory>
{
    public void Configure(EntityTypeBuilder<FinanceCategory> builder)
    {
        builder.ToTable("FinanceCategories");
        builder.HasKey(f => f.Id);

        builder.Property(f => f.Name).IsRequired().HasMaxLength(100);
        builder.Property(f => f.ColorHex).HasMaxLength(7);
        builder.Property(f => f.Icon).HasMaxLength(50);
        builder.Property(f => f.IsDeleted).HasDefaultValue(false);

        builder.HasIndex(f => f.UserId);
        builder.HasIndex(f => new { f.UserId, f.Type, f.IsDeleted });

        builder.HasMany(f => f.Transactions)
            .WithOne(t => t.Category)
            .HasForeignKey(t => t.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);     // giữ transactions khi xoá category
    }
}

public class TransactionConfiguration : IEntityTypeConfiguration<Transaction>
{
    public void Configure(EntityTypeBuilder<Transaction> builder)
    {
        builder.ToTable("Transactions");
        builder.HasKey(t => t.Id);

        builder.Property(t => t.Amount)
            .HasColumnType("numeric(18,2)")
            .IsRequired();

        builder.Property(t => t.Note).HasMaxLength(500);
        builder.Property(t => t.IsDeleted).HasDefaultValue(false);

        // Indexes cho chart 6 tháng và filter tháng hiện tại
        builder.HasIndex(t => new { t.UserId, t.TransactionDate, t.IsDeleted });
        builder.HasIndex(t => new { t.UserId, t.Type, t.IsDeleted });
        builder.HasIndex(t => new { t.CategoryId, t.IsDeleted });
    }
}

public class SavingGoalConfiguration : IEntityTypeConfiguration<SavingGoal>
{
    public void Configure(EntityTypeBuilder<SavingGoal> builder)
    {
        builder.ToTable("SavingGoals");
        builder.HasKey(s => s.Id);

        builder.Property(s => s.Name).IsRequired().HasMaxLength(200);
        builder.Property(s => s.TargetAmount).HasColumnType("numeric(18,2)").IsRequired();
        builder.Property(s => s.CurrentAmount).HasColumnType("numeric(18,2)").HasDefaultValue(0);
        builder.Property(s => s.IsDeleted).HasDefaultValue(false);

        builder.HasIndex(s => new { s.UserId, s.Status, s.IsDeleted });
    }
}

public class AiSpendingPredictionConfiguration : IEntityTypeConfiguration<AiSpendingPrediction>
{
    public void Configure(EntityTypeBuilder<AiSpendingPrediction> builder)
    {
        builder.ToTable("AiSpendingPredictions");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.PredictedAmount).HasColumnType("numeric(18,2)").IsRequired();
        builder.Property(a => a.ActualAmount).HasColumnType("numeric(18,2)");
        builder.Property(a => a.Confidence).HasColumnType("numeric(5,4)");

        // 1 user chỉ có 1 prediction cho mỗi tháng
        builder.HasIndex(a => new { a.UserId, a.PredictionMonth }).IsUnique();
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// ROADMAP CONFIGURATIONS
// ══════════════════════════════════════════════════════════════════════════════

public class UserCareerProfileConfiguration : IEntityTypeConfiguration<UserCareerProfile>
{
    public void Configure(EntityTypeBuilder<UserCareerProfile> builder)
    {
        builder.ToTable("UserCareerProfiles");
        builder.HasKey(u => u.Id);

        builder.HasIndex(u => u.UserId).IsUnique();
        builder.Property(u => u.Major).IsRequired().HasMaxLength(200);
        builder.Property(u => u.CurrentJob).HasMaxLength(200);

        builder.HasMany(u => u.Skills)
            .WithOne(s => s.CareerProfile)
            .HasForeignKey(s => s.CareerProfileId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class UserSkillConfiguration : IEntityTypeConfiguration<UserSkill>
{
    public void Configure(EntityTypeBuilder<UserSkill> builder)
    {
        builder.ToTable("UserSkills");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.SkillName).IsRequired().HasMaxLength(100);
        builder.HasIndex(u => new { u.UserId, u.SkillType });
    }
}

public class CareerRoadmapConfiguration : IEntityTypeConfiguration<CareerRoadmap>
{
    public void Configure(EntityTypeBuilder<CareerRoadmap> builder)
    {
        builder.ToTable("CareerRoadmaps");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.CareerPath).IsRequired().HasMaxLength(200);

        // PostgreSQL jsonb — cho phép query bên trong nếu cần
        builder.Property(c => c.RawData)
            .HasColumnType("jsonb")
            .HasDefaultValue("{}");

        builder.HasIndex(c => c.UserId);
        builder.HasIndex(c => new { c.UserId, c.IsActive });

        builder.HasMany(c => c.Nodes)
            .WithOne(n => n.Roadmap)
            .HasForeignKey(n => n.RoadmapId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class RoadmapNodeConfiguration : IEntityTypeConfiguration<RoadmapNode>
{
    public void Configure(EntityTypeBuilder<RoadmapNode> builder)
    {
        builder.ToTable("RoadmapNodes");
        builder.HasKey(r => r.Id);

        builder.Property(r => r.NodeKey).IsRequired().HasMaxLength(100);
        builder.Property(r => r.Title).IsRequired().HasMaxLength(200);
        builder.Property(r => r.Category).HasMaxLength(100);

        // NodeKey unique trong 1 roadmap
        builder.HasIndex(r => new { r.RoadmapId, r.NodeKey }).IsUnique();

        builder.HasMany(r => r.Prerequisites)
            .WithOne(p => p.Node)
            .HasForeignKey(p => p.NodeId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasMany(r => r.RequiredBy)
            .WithOne(p => p.PrerequisiteNode)
            .HasForeignKey(p => p.PrerequisiteNodeId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class RoadmapNodePrerequisiteConfiguration : IEntityTypeConfiguration<RoadmapNodePrerequisite>
{
    public void Configure(EntityTypeBuilder<RoadmapNodePrerequisite> builder)
    {
        builder.ToTable("RoadmapNodePrerequisites");

        // Composite PK — junction table không cần surrogate key
        builder.HasKey(r => new { r.NodeId, r.PrerequisiteNodeId });
    }
}

public class UserNodeProgressConfiguration : IEntityTypeConfiguration<UserNodeProgress>
{
    public void Configure(EntityTypeBuilder<UserNodeProgress> builder)
    {
        builder.ToTable("UserNodeProgress");
        builder.HasKey(u => u.Id);

        builder.Property(u => u.CertificateUrl).HasMaxLength(500);

        // 1 user chỉ có 1 progress entry cho mỗi node
        builder.HasIndex(u => new { u.UserId, u.NodeId }).IsUnique();
        builder.HasIndex(u => new { u.UserId, u.Status });
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// CHAT CONFIGURATIONS
// ══════════════════════════════════════════════════════════════════════════════

public class ConversationConfiguration : IEntityTypeConfiguration<Conversation>
{
    public void Configure(EntityTypeBuilder<Conversation> builder)
    {
        builder.ToTable("Conversations");
        builder.HasKey(c => c.Id);

        builder.Property(c => c.Title).HasMaxLength(200);
        builder.Property(c => c.IsDeleted).HasDefaultValue(false);

        builder.HasIndex(c => new { c.UserId, c.Type, c.IsDeleted });
        builder.HasIndex(c => new { c.UserId, c.LastMessageAt });   // sort by recent

        builder.HasMany(c => c.Messages)
            .WithOne(m => m.Conversation)
            .HasForeignKey(m => m.ConversationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class MessageConfiguration : IEntityTypeConfiguration<Message>
{
    public void Configure(EntityTypeBuilder<Message> builder)
    {
        builder.ToTable("Messages");
        builder.HasKey(m => m.Id);

        builder.Property(m => m.Content).IsRequired();              // text — không giới hạn
        builder.Property(m => m.AttachmentUrl).HasMaxLength(500);
        builder.Property(m => m.IsDeleted).HasDefaultValue(false);

        // Lấy N messages gần nhất cho AI context
        builder.HasIndex(m => new { m.ConversationId, m.CreatedAt });
        builder.HasIndex(m => new { m.ConversationId, m.IsDeleted });
    }
}

public class AdminChatAgentConfiguration : IEntityTypeConfiguration<AdminChatAgent>
{
    public void Configure(EntityTypeBuilder<AdminChatAgent> builder)
    {
        builder.ToTable("AdminChatAgents");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Name).IsRequired().HasMaxLength(100);
        builder.Property(a => a.Email).IsRequired().HasMaxLength(256);
        builder.HasIndex(a => a.Email).IsUnique();
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// SYSTEM CONFIGURATIONS
// ══════════════════════════════════════════════════════════════════════════════

public class UserSettingConfiguration : IEntityTypeConfiguration<UserSetting>
{
    public void Configure(EntityTypeBuilder<UserSetting> builder)
    {
        builder.ToTable("UserSettings");
        builder.HasKey(u => u.Id);

        builder.HasIndex(u => u.UserId).IsUnique();

        builder.Property(u => u.UpdatedAt)
            .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");
    }
}

public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
{
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
        builder.ToTable("Notifications");
        builder.HasKey(n => n.Id);

        builder.Property(n => n.Title).IsRequired().HasMaxLength(200);
        builder.Property(n => n.IsDeleted).HasDefaultValue(false);

        builder.HasIndex(n => new { n.UserId, n.IsRead, n.IsDeleted });
        builder.HasIndex(n => new { n.UserId, n.CreatedAt });
    }
}

public class FileAttachmentConfiguration : IEntityTypeConfiguration<FileAttachment>
{
    public void Configure(EntityTypeBuilder<FileAttachment> builder)
    {
        builder.ToTable("FileAttachments");
        builder.HasKey(f => f.Id);

        builder.Property(f => f.OriginalFileName).IsRequired().HasMaxLength(255);
        builder.Property(f => f.FileUrl).IsRequired().HasMaxLength(1000);
        builder.Property(f => f.MimeType).IsRequired().HasMaxLength(100);
        builder.Property(f => f.EntityType).IsRequired().HasMaxLength(50);
        builder.Property(f => f.IsDeleted).HasDefaultValue(false);

        // Polymorphic lookup index
        builder.HasIndex(f => new { f.EntityType, f.EntityId });
        builder.HasIndex(f => f.UserId);
    }
}

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");
        builder.HasKey(a => a.Id);

        builder.Property(a => a.Action).IsRequired().HasMaxLength(100);
        builder.Property(a => a.EntityType).HasMaxLength(100);
        builder.Property(a => a.IpAddress).HasMaxLength(45);
        builder.Property(a => a.UserAgent).HasMaxLength(500);

        // OldValues / NewValues dùng jsonb
        builder.Property(a => a.OldValues).HasColumnType("jsonb");
        builder.Property(a => a.NewValues).HasColumnType("jsonb");

        builder.Property(a => a.CreatedAt)
            .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

        builder.HasIndex(a => a.UserId);
        builder.HasIndex(a => a.CreatedAt);             // cleanup job + retention filter
        builder.HasIndex(a => new { a.EntityType, a.EntityId });
    }
}
