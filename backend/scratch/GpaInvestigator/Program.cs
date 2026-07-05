using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using PMP.Infrastructure.Persistence;
using PMP.Domain.Entities.GPA;

namespace GpaInvestigator
{
    class Program
    {
        static void Main(string[] args)
        {
            var hostConn = "Host=localhost;Port=5432;Database=PmpDb;Username=postgres;Password=XDev%1902@NPT";
            var dockerConn = "Host=localhost;Port=5433;Database=PmpDb;Username=postgres;Password=XDev%1902@NPT";

            var hostUserId = Guid.Parse("e3f7e2f4-8d0f-4c6a-bdd5-fe370a429f66");
            var dockerUserId = Guid.Parse("7775ab85-a66b-4e6e-b2a2-96e028579927");

            Console.WriteLine("=== MIGRATING GPA DATA FROM HOST DB (5432) TO DOCKER DB (5433) ===");
            Console.WriteLine($"Host User: {hostUserId} ➔ Docker User: {dockerUserId}");

            // 1. Read from Host Database
            GpaConfig hostConfig;
            List<AcademicYear> hostYears;
            List<Semester> hostSemesters;
            List<Course> hostCourses;

            var hostOptions = new DbContextOptionsBuilder<ApplicationDbContext>().UseNpgsql(hostConn).Options;
            using (var hostDb = new ApplicationDbContext(hostOptions))
            {
                hostConfig = hostDb.GpaConfigs.IgnoreQueryFilters().FirstOrDefault(c => c.UserId == hostUserId);
                if (hostConfig == null)
                {
                    Console.WriteLine("Error: GPA config not found in Host DB.");
                    return;
                }

                hostYears = hostDb.AcademicYears.IgnoreQueryFilters()
                    .Where(y => y.UserId == hostUserId)
                    .ToList();

                var yearIds = hostYears.Select(y => y.Id).ToList();
                hostSemesters = hostDb.Semesters.IgnoreQueryFilters()
                    .Where(s => yearIds.Contains(s.AcademicYearId))
                    .ToList();

                var semesterIds = hostSemesters.Select(s => s.Id).ToList();
                hostCourses = hostDb.Courses.IgnoreQueryFilters()
                    .Where(c => c.UserId == hostUserId)
                    .ToList();
            }

            Console.WriteLine($"\nFetched from Host DB:");
            Console.WriteLine($"- GPA Config Target: {hostConfig.TargetGpa}");
            Console.WriteLine($"- Academic Years: {hostYears.Count}");
            Console.WriteLine($"- Semesters: {hostSemesters.Count}");
            Console.WriteLine($"- Courses: {hostCourses.Count}");

            // 2. Write to Docker Database
            var dockerOptions = new DbContextOptionsBuilder<ApplicationDbContext>().UseNpgsql(dockerConn).Options;
            using (var dockerDb = new ApplicationDbContext(dockerOptions))
            {
                // Delete existing GPA data for docker user to avoid duplicates
                var existingConfig = dockerDb.GpaConfigs.IgnoreQueryFilters().FirstOrDefault(c => c.UserId == dockerUserId);
                if (existingConfig != null)
                {
                    var existingYears = dockerDb.AcademicYears.IgnoreQueryFilters().Where(y => y.UserId == dockerUserId).ToList();
                    var existingYearIds = existingYears.Select(y => y.Id).ToList();
                    var existingSemesters = dockerDb.Semesters.IgnoreQueryFilters().Where(s => existingYearIds.Contains(s.AcademicYearId)).ToList();
                    var existingCourses = dockerDb.Courses.IgnoreQueryFilters().Where(c => c.UserId == dockerUserId).ToList();

                    dockerDb.Courses.RemoveRange(existingCourses);
                    dockerDb.Semesters.RemoveRange(existingSemesters);
                    dockerDb.AcademicYears.RemoveRange(existingYears);
                    dockerDb.GpaConfigs.Remove(existingConfig);
                    dockerDb.SaveChanges();
                    Console.WriteLine("\nCleared existing GPA data for Docker User.");
                }

                // Migrate GPA Config
                var newConfig = new GpaConfig
                {
                    UserId = dockerUserId,
                    TotalCourses = hostConfig.TotalCourses,
                    TotalCredits = hostConfig.TotalCredits,
                    TargetGpa = hostConfig.TargetGpa,
                    IsDeleted = false
                };
                dockerDb.GpaConfigs.Add(newConfig);
                dockerDb.SaveChanges();
                Console.WriteLine($"Migrated GpaConfig: {newConfig.Id}");

                // Migrate Academic Years, Semesters, and Courses
                foreach (var hostYear in hostYears)
                {
                    var newYear = new AcademicYear
                    {
                        UserId = dockerUserId,
                        GpaConfigId = newConfig.Id,
                        YearName = hostYear.YearName,
                        YearOrder = hostYear.YearOrder,
                        IsDeleted = false
                    };
                    dockerDb.AcademicYears.Add(newYear);
                    dockerDb.SaveChanges();
                    Console.WriteLine($"Migrated AcademicYear: {newYear.YearName} (NewId: {newYear.Id})");

                    var semsInYear = hostSemesters.Where(s => s.AcademicYearId == hostYear.Id).ToList();
                    foreach (var hostSem in semsInYear)
                    {
                        var newSem = new Semester
                        {
                            AcademicYearId = newYear.Id,
                            SemesterType = hostSem.SemesterType,
                            IsDeleted = false
                        };
                        dockerDb.Semesters.Add(newSem);
                        dockerDb.SaveChanges();

                        var coursesInSem = hostCourses.Where(c => c.SemesterId == hostSem.Id).ToList();
                        foreach (var hostCourse in coursesInSem)
                        {
                            var newCourse = new Course
                            {
                                UserId = dockerUserId,
                                SemesterId = newSem.Id,
                                CourseCode = hostCourse.CourseCode,
                                CourseName = hostCourse.CourseName,
                                Credits = hostCourse.Credits,
                                Score = hostCourse.Score,
                                IsDeleted = false
                            };
                            dockerDb.Courses.Add(newCourse);
                        }
                        dockerDb.SaveChanges();
                        Console.WriteLine($"  Migrated Semester {newSem.SemesterType} with {coursesInSem.Count} courses.");
                    }
                }

                Console.WriteLine("\n=== DATA MIGRATION TO DOCKER DB COMPLETED SUCCESSFULLY ===");
            }
        }
    }
}
