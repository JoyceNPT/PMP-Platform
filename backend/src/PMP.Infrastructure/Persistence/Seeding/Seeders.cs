using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PMP.Domain.Entities.Auth;
using PMP.Domain.Entities.Finance;
using PMP.Domain.Entities.GPA;
using PMP.Domain.Entities.Roadmap;
using PMP.Domain.Entities.System;
using PMP.Domain.Enums;
using PMP.Infrastructure.Persistence;

namespace PMP.Infrastructure.Persistence.Seeding;

// ─────────────────────────────────────────────────────────────────────────────
// INTERFACE — mỗi module implement 1 seeder
// ─────────────────────────────────────────────────────────────────────────────
public interface IDataSeeder
{
    /// <summary>Thứ tự chạy — số nhỏ chạy trước</summary>
    int Order { get; }
    Task SeedAsync(ApplicationDbContext context, CancellationToken ct = default);
}

// ─────────────────────────────────────────────────────────────────────────────
// SEEDER RUNNER — chỉ chạy ở Development
// ─────────────────────────────────────────────────────────────────────────────
public static class DatabaseSeeder
{
    public static async Task SeedAsync(
        ApplicationDbContext context,
        IEnumerable<IDataSeeder> seeders,
        string environment)
    {
        if (environment != "Development") return;

        await context.Database.MigrateAsync();

        foreach (var seeder in seeders.OrderBy(s => s.Order))
            await seeder.SeedAsync(context);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER 1: USER SEEDER
// ─────────────────────────────────────────────────────────────────────────────
public class UserSeeder : IDataSeeder
{
    // Guid cố định để dễ debug & tham chiếu giữa các seeder
    public static readonly Guid User1Id = Guid.Parse("11111111-1111-1111-1111-111111111111");
    public static readonly Guid User2Id = Guid.Parse("22222222-2222-2222-2222-222222222222");

    public int Order => 1;

    public async Task SeedAsync(ApplicationDbContext context, CancellationToken ct = default)
    {
        if (await context.Users.AnyAsync(u => u.Id == User1Id, ct)) return; // idempotent

        var hasher = new PasswordHasher<ApplicationUser>();

        var user1 = new ApplicationUser
        {
            Id = User1Id,
            Nickname = "devuser",
            FullName = "Nguyen Van A",
            Email = "devuser@example.com",
            NormalizedEmail = "DEVUSER@EXAMPLE.COM",
            UserName = "devuser@example.com",
            NormalizedUserName = "DEVUSER@EXAMPLE.COM",
            Gender = Gender.Male,
            PhoneNumber = "0901234567",
            IsEmailVerified = true,
            IsGoogleLinked = false,
            AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=devuser",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        user1.PasswordHash = hasher.HashPassword(user1, "Dev@123456");

        var user2 = new ApplicationUser
        {
            Id = User2Id,
            Nickname = "googleuser",
            FullName = "Tran Thi B",
            Email = "googleuser@gmail.com",
            NormalizedEmail = "GOOGLEUSER@GMAIL.COM",
            UserName = "googleuser@gmail.com",
            NormalizedUserName = "GOOGLEUSER@GMAIL.COM",
            Gender = Gender.Female,
            PhoneNumber = "0907654321",
            IsEmailVerified = true,
            IsGoogleLinked = true,
            AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=googleuser",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        user2.PasswordHash = hasher.HashPassword(user2, "Dev@123456");

        context.Users.AddRange(user1, user2);

        // UserSettings tạo cùng lúc
        context.UserSettings.AddRange(
            new UserSetting { UserId = User1Id, Theme = AppTheme.Light, Language = AppLanguage.VI },
            new UserSetting { UserId = User2Id, Theme = AppTheme.Dark, Language = AppLanguage.EN }
        );

        await context.SaveChangesAsync(ct);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER 2: GPA SEEDER
// ─────────────────────────────────────────────────────────────────────────────
public class GpaSeeder : IDataSeeder
{
    public int Order => 2;

    public async Task SeedAsync(ApplicationDbContext context, CancellationToken ct = default)
    {
        if (await context.GpaConfigs.AnyAsync(g => g.UserId == UserSeeder.User1Id, ct)) return;

        var gpaConfig = new GpaConfig
        {
            Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            UserId = UserSeeder.User1Id,
            TotalCourses = 40,
            TotalCredits = 120,
            TargetGpa = 8.5m
        };
        context.GpaConfigs.Add(gpaConfig);

        var year1 = new AcademicYear
        {
            Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            UserId = UserSeeder.User1Id,
            GpaConfigId = gpaConfig.Id,
            YearName = "2022-2023",
            YearOrder = 1
        };
        var year2 = new AcademicYear
        {
            Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            UserId = UserSeeder.User1Id,
            GpaConfigId = gpaConfig.Id,
            YearName = "2023-2024",
            YearOrder = 2
        };
        context.AcademicYears.AddRange(year1, year2);

        var sem1 = new Semester
        {
            Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            AcademicYearId = year1.Id,
            SemesterType = SemesterType.Fall
        };
        var sem2 = new Semester
        {
            Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            AcademicYearId = year2.Id,
            SemesterType = SemesterType.Spring
        };
        context.Semesters.AddRange(sem1, sem2);

        // 10 môn mẫu
        var courses = new List<Course>
        {
            new() { UserId = UserSeeder.User1Id, SemesterId = sem1.Id, CourseCode = "CS101", CourseName = "Introduction to Programming", Credits = 3, Score = 8.5m },
            new() { UserId = UserSeeder.User1Id, SemesterId = sem1.Id, CourseCode = "MATH101", CourseName = "Calculus I", Credits = 4, Score = 7.0m },
            new() { UserId = UserSeeder.User1Id, SemesterId = sem1.Id, CourseCode = "ENG101", CourseName = "English I", Credits = 3, Score = 9.0m },
            new() { UserId = UserSeeder.User1Id, SemesterId = sem1.Id, CourseCode = "PHY101", CourseName = "Physics I", Credits = 3, Score = 8.0m },
            new() { UserId = UserSeeder.User1Id, SemesterId = sem1.Id, CourseCode = "CS102", CourseName = "Data Structures", Credits = 3, Score = 8.75m },
            new() { UserId = UserSeeder.User1Id, SemesterId = sem2.Id, CourseCode = "CS201", CourseName = "Algorithms", Credits = 3, Score = 9.25m },
            new() { UserId = UserSeeder.User1Id, SemesterId = sem2.Id, CourseCode = "MATH201", CourseName = "Calculus II", Credits = 4, Score = 7.5m },
            new() { UserId = UserSeeder.User1Id, SemesterId = sem2.Id, CourseCode = "CS202", CourseName = "Database Systems", Credits = 3, Score = 8.0m },
            new() { UserId = UserSeeder.User1Id, SemesterId = sem2.Id, CourseCode = "CS203", CourseName = "Operating Systems", Credits = 3, Score = 7.75m },
            new() { UserId = UserSeeder.User1Id, SemesterId = sem2.Id, CourseCode = "SE101", CourseName = "Software Engineering", Credits = 3, Score = 9.0m },
        };
        context.Courses.AddRange(courses);

        await context.SaveChangesAsync(ct);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER 3: FINANCE SEEDER
// ─────────────────────────────────────────────────────────────────────────────
public class FinanceSeeder : IDataSeeder
{
    public int Order => 3;

    public async Task SeedAsync(ApplicationDbContext context, CancellationToken ct = default)
    {
        if (await context.FinanceCategories.AnyAsync(f => f.UserId == UserSeeder.User1Id, ct)) return;

        var expenseFood = new FinanceCategory { UserId = UserSeeder.User1Id, Name = "Ăn uống", Type = TransactionType.Expense, ColorHex = "#FF6B6B", Icon = "utensils" };
        var expenseTransport = new FinanceCategory { UserId = UserSeeder.User1Id, Name = "Di chuyển", Type = TransactionType.Expense, ColorHex = "#4ECDC4", Icon = "car" };
        var expenseEducation = new FinanceCategory { UserId = UserSeeder.User1Id, Name = "Học phí", Type = TransactionType.Expense, ColorHex = "#45B7D1", Icon = "book" };
        var incomePartTime = new FinanceCategory { UserId = UserSeeder.User1Id, Name = "Làm thêm", Type = TransactionType.Income, ColorHex = "#96CEB4", Icon = "briefcase" };
        var incomeFamily = new FinanceCategory { UserId = UserSeeder.User1Id, Name = "Gia đình", Type = TransactionType.Income, ColorHex = "#FFEAA7", Icon = "home" };

        context.FinanceCategories.AddRange(expenseFood, expenseTransport, expenseEducation, incomePartTime, incomeFamily);
        await context.SaveChangesAsync(ct);

        var today = DateOnly.FromDateTime(DateTime.Today);
        var transactions = new List<Transaction>();

        // 20 transactions trải đều 3 tháng gần nhất
        for (int i = 0; i < 20; i++)
        {
            var daysAgo = i * 4;
            transactions.Add(new Transaction
            {
                UserId = UserSeeder.User1Id,
                CategoryId = i % 5 < 3 ? expenseFood.Id : (i % 2 == 0 ? incomePartTime.Id : incomeFamily.Id),
                Type = i % 5 < 3 ? TransactionType.Expense : TransactionType.Income,
                Amount = (i % 5 < 3) ? (50000 + i * 10000) : (500000 + i * 50000),
                TransactionDate = today.AddDays(-daysAgo),
                Note = i % 3 == 0 ? "Ghi chú mẫu" : null
            });
        }
        context.Transactions.AddRange(transactions);

        context.SavingGoals.AddRange(
            new SavingGoal { UserId = UserSeeder.User1Id, Name = "Mua laptop", TargetAmount = 20_000_000, CurrentAmount = 8_500_000, TargetDate = today.AddMonths(4), Status = SavingGoalStatus.InProgress },
            new SavingGoal { UserId = UserSeeder.User1Id, Name = "Du lịch Đà Lạt", TargetAmount = 5_000_000, CurrentAmount = 5_000_000, TargetDate = today.AddMonths(-1), Status = SavingGoalStatus.Completed }
        );

        await context.SaveChangesAsync(ct);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDER 4: ROADMAP SEEDER
// ─────────────────────────────────────────────────────────────────────────────
public class RoadmapSeeder : IDataSeeder
{
    public int Order => 4;

    public async Task SeedAsync(ApplicationDbContext context, CancellationToken ct = default)
    {
        if (await context.UserCareerProfiles.AnyAsync(u => u.UserId == UserSeeder.User1Id, ct)) return;

        var profile = new UserCareerProfile
        {
            UserId = UserSeeder.User1Id,
            Major = "Software Engineering",
            CurrentJob = null,
            ExperienceYears = 0
        };
        context.UserCareerProfiles.Add(profile);
        await context.SaveChangesAsync(ct);

        context.UserSkills.AddRange(
            new UserSkill { UserId = UserSeeder.User1Id, CareerProfileId = profile.Id, SkillName = "C#", SkillType = SkillType.Current, ProficiencyLevel = ProficiencyLevel.Intermediate },
            new UserSkill { UserId = UserSeeder.User1Id, CareerProfileId = profile.Id, SkillName = "React", SkillType = SkillType.Current, ProficiencyLevel = ProficiencyLevel.Beginner },
            new UserSkill { UserId = UserSeeder.User1Id, CareerProfileId = profile.Id, SkillName = "Docker", SkillType = SkillType.Planned }
        );

        var roadmapId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");
        var roadmap = new CareerRoadmap
        {
            Id = roadmapId,
            UserId = UserSeeder.User1Id,
            CareerPath = "Software Engineer",
            Source = RoadmapSource.AiGenerated,
            IsActive = true,
            RawData = "{}"
        };
        context.CareerRoadmaps.Add(roadmap);
        await context.SaveChangesAsync(ct);

        // 5 nodes mẫu
        var nodeHtml = new RoadmapNode { RoadmapId = roadmapId, NodeKey = "html", Title = "HTML", Category = "Frontend", OrderIndex = 1, PositionX = 0, PositionY = 0 };
        var nodeCss = new RoadmapNode { RoadmapId = roadmapId, NodeKey = "css", Title = "CSS", Category = "Frontend", OrderIndex = 2, PositionX = 200, PositionY = 0 };
        var nodeJs = new RoadmapNode { RoadmapId = roadmapId, NodeKey = "javascript", Title = "JavaScript", Category = "Frontend", OrderIndex = 3, PositionX = 400, PositionY = 0 };
        var nodeReact = new RoadmapNode { RoadmapId = roadmapId, NodeKey = "react", Title = "React", Category = "Frontend", OrderIndex = 4, PositionX = 600, PositionY = 0 };
        var nodeApi = new RoadmapNode { RoadmapId = roadmapId, NodeKey = "rest-api", Title = "REST API", Category = "Backend", OrderIndex = 5, PositionX = 400, PositionY = 200 };

        context.RoadmapNodes.AddRange(nodeHtml, nodeCss, nodeJs, nodeReact, nodeApi);
        await context.SaveChangesAsync(ct);

        // Prerequisites: CSS requires HTML, JS requires HTML, React requires CSS+JS
        context.RoadmapNodePrerequisites.AddRange(
            new RoadmapNodePrerequisite { NodeId = nodeCss.Id, PrerequisiteNodeId = nodeHtml.Id },
            new RoadmapNodePrerequisite { NodeId = nodeJs.Id, PrerequisiteNodeId = nodeHtml.Id },
            new RoadmapNodePrerequisite { NodeId = nodeReact.Id, PrerequisiteNodeId = nodeCss.Id },
            new RoadmapNodePrerequisite { NodeId = nodeReact.Id, PrerequisiteNodeId = nodeJs.Id }
        );

        // Progress mẫu
        context.UserNodeProgress.AddRange(
            new UserNodeProgress { UserId = UserSeeder.User1Id, NodeId = nodeHtml.Id, Status = NodeStatus.Completed, CertificateUrl = "https://example.com/cert/html", CompletedAt = DateTime.UtcNow.AddDays(-30) },
            new UserNodeProgress { UserId = UserSeeder.User1Id, NodeId = nodeCss.Id, Status = NodeStatus.Completed, CertificateUrl = "https://example.com/cert/css", CompletedAt = DateTime.UtcNow.AddDays(-20) },
            new UserNodeProgress { UserId = UserSeeder.User1Id, NodeId = nodeJs.Id, Status = NodeStatus.InProgress },
            new UserNodeProgress { UserId = UserSeeder.User1Id, NodeId = nodeReact.Id, Status = NodeStatus.NotStarted },
            new UserNodeProgress { UserId = UserSeeder.User1Id, NodeId = nodeApi.Id, Status = NodeStatus.NotStarted }
        );

        await context.SaveChangesAsync(ct);
    }
}
