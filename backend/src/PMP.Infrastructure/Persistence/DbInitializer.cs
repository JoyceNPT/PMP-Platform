using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using PMP.Domain.Entities.Auth;
using PMP.Domain.Entities.Finance;
using PMP.Domain.Entities.GPA;
using PMP.Domain.Entities.Roadmap;
using PMP.Domain.Enums;
using PMP.Infrastructure.Persistence;

namespace PMP.Infrastructure.Persistence;

public static class DbInitializer
{
    public static async Task SeedDataAsync(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
    {
        // 1. Ensure DB is created
        await context.Database.MigrateAsync();

        // 2. Seed User
        var testUser = await userManager.FindByEmailAsync("test@pmp.com");
        if (testUser == null)
        {
            testUser = new ApplicationUser
            {
                UserName = "test@pmp.com",
                Email = "test@pmp.com",
                FullName = "Test User",
                EmailConfirmed = true
            };
            await userManager.CreateAsync(testUser, "Pmp@123456");
        }

        var userId = testUser.Id;

        // 3. Seed GPA
        if (!await context.AcademicYears.AnyAsync(y => y.UserId == userId))
        {
            var config = new GpaConfig 
            { 
                UserId = userId, 
                TotalCourses = 50, 
                TotalCredits = 150, 
                TargetGpa = 3.6m 
            };
            context.GpaConfigs.Add(config);
            await context.SaveChangesAsync();

            var year = new AcademicYear 
            { 
                UserId = userId, 
                GpaConfigId = config.Id,
                YearName = "2023-2024", 
                YearOrder = 1 
            };
            context.AcademicYears.Add(year);
            await context.SaveChangesAsync();

            var semester = new Semester 
            { 
                AcademicYearId = year.Id, 
                SemesterType = SemesterType.Fall 
            };
            context.Semesters.Add(semester);
            await context.SaveChangesAsync();

            context.Courses.AddRange(new List<Course>
            {
                new() { UserId = userId, SemesterId = semester.Id, CourseName = "Toán rời rạc", Credits = 3, Score = 8.5m, CourseCode = "CS101" },
                new() { UserId = userId, SemesterId = semester.Id, CourseName = "Lập trình C#", Credits = 4, Score = 9.0m, CourseCode = "CS102" },
                new() { UserId = userId, SemesterId = semester.Id, CourseName = "Kỹ năng mềm", Credits = 2, Score = 7.0m, CourseCode = "GE101" }
            });
        }

        // 4. Seed Finance
        if (!await context.FinanceCategories.AnyAsync(c => c.UserId == userId))
        {
            var cats = new List<FinanceCategory>
            {
                new() { UserId = userId, Name = "Ăn uống", Type = TransactionType.Expense, ColorHex = "#ef4444", Icon = "🍔" },
                new() { UserId = userId, Name = "Lương", Type = TransactionType.Income, ColorHex = "#10b981", Icon = "💰" },
                new() { UserId = userId, Name = "Di chuyển", Type = TransactionType.Expense, ColorHex = "#3b82f6", Icon = "🚗" },
                new() { UserId = userId, Name = "Giải trí", Type = TransactionType.Expense, ColorHex = "#f59e0b", Icon = "🎮" }
            };
            context.FinanceCategories.AddRange(cats);
            await context.SaveChangesAsync();

            var today = DateOnly.FromDateTime(DateTime.UtcNow);
            context.Transactions.AddRange(new List<Transaction>
            {
                new() { UserId = userId, CategoryId = cats[1].Id, Amount = 15000000, Type = TransactionType.Income, TransactionDate = today.AddDays(-5), Note = "Lương tháng 4" },
                new() { UserId = userId, CategoryId = cats[0].Id, Amount = 50000, Type = TransactionType.Expense, TransactionDate = today.AddDays(-2), Note = "Phở sáng" },
                new() { UserId = userId, CategoryId = cats[2].Id, Amount = 200000, Type = TransactionType.Expense, TransactionDate = today.AddDays(-1), Note = "Đổ xăng" }
            });

            context.SavingGoals.Add(new SavingGoal
            {
                UserId = userId,
                Name = "Mua MacBook Pro",
                TargetAmount = 45000000,
                CurrentAmount = 5000000,
                Status = SavingGoalStatus.InProgress,
                TargetDate = today.AddMonths(6)
            });
        }

        // 5. Seed Roadmap
        if (!await context.CareerRoadmaps.AnyAsync(r => r.UserId == userId))
        {
            var roadmap = new CareerRoadmap
            {
                UserId = userId,
                CareerPath = "Senior .NET Developer",
                IsActive = true,
                Source = RoadmapSource.AiGenerated,
                RawData = "[]"
            };
            context.CareerRoadmaps.Add(roadmap);
            await context.SaveChangesAsync();

            var nodes = new List<RoadmapNode>
            {
                new() { RoadmapId = roadmap.Id, NodeKey = "csharp", Title = "C# Mastery", Category = "Language", OrderIndex = 1, PositionX = 100, PositionY = 100 },
                new() { RoadmapId = roadmap.Id, NodeKey = "aspnet", Title = "ASP.NET Core", Category = "Backend", OrderIndex = 2, PositionX = 350, PositionY = 100 },
                new() { RoadmapId = roadmap.Id, NodeKey = "efcore", Title = "EF Core", Category = "Database", OrderIndex = 3, PositionX = 600, PositionY = 100 }
            };
            context.RoadmapNodes.AddRange(nodes);
            await context.SaveChangesAsync();

            context.UserNodeProgress.Add(new UserNodeProgress
            {
                UserId = userId,
                NodeId = nodes[0].Id,
                Status = NodeStatus.Completed,
                CompletedAt = DateTime.UtcNow.AddDays(-10)
            });
        }

        await context.SaveChangesAsync();
    }
}
