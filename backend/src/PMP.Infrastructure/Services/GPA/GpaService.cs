using Microsoft.EntityFrameworkCore;
using PMP.Application.Features.GPA.DTOs;
using PMP.Application.Features.GPA.Interfaces;
using PMP.Domain.Entities.GPA;
using PMP.Domain.Enums;
using PMP.Infrastructure.Persistence;
using PMP.Shared.Wrappers;

namespace PMP.Infrastructure.Services.GPA;

public class GpaService : IGpaService
{
    private readonly ApplicationDbContext _db;

    public GpaService(ApplicationDbContext db) => _db = db;

    // ─── Helpers ─────────────────────────────────────────────────────────────

    private static string ToGradeLabel(decimal score) => score switch
    {
        >= 9.0m => "A+",
        >= 8.5m => "A",
        >= 8.0m => "B+",
        >= 7.0m => "B",
        >= 6.5m => "C+",
        >= 5.5m => "C",
        >= 5.0m => "D+",
        >= 4.0m => "D",
        _       => "F"
    };

    private static string ToRanking(decimal gpa) => gpa switch
    {
        >= 9.0m => "Xuất sắc",
        >= 8.0m => "Giỏi",
        >= 5.0m => "Khá",
        _       => "Trung bình"
    };

    private static string ToSemesterLabel(SemesterType t) => t switch
    {
        SemesterType.Spring     => "Học kỳ 1",
        SemesterType.Spring3Week => "HK 1 (3 tuần)",
        SemesterType.Summer     => "Học kỳ 2",
        SemesterType.Summer3Week => "HK 2 (3 tuần)",
        SemesterType.Fall       => "Học kỳ 3",
        SemesterType.Fall3Week  => "HK 3 (3 tuần)",
        _                       => t.ToString()
    };

    private static CourseDto MapCourse(Course c) => new()
    {
        Id          = c.Id,
        CourseCode  = c.CourseCode,
        CourseName  = c.CourseName,
        Credits     = c.Credits,
        Score       = c.Score,
        GradeLabel  = ToGradeLabel(c.Score)
    };

    private static SemesterDto MapSemester(Semester s)
    {
        var courses  = s.Courses?.ToList() ?? [];
        var totalCr  = courses.Sum(c => c.Credits);
        var gpa      = totalCr > 0 ? courses.Sum(c => c.Score * c.Credits) / totalCr : 0;
        return new SemesterDto
        {
            Id            = s.Id,
            SemesterType  = (int)s.SemesterType,
            SemesterLabel = ToSemesterLabel(s.SemesterType),
            Courses       = courses.Select(MapCourse).ToList(),
            SemesterGpa   = Math.Round(gpa, 2),
            TotalCredits  = totalCr,
            Ranking       = ToRanking(gpa)
        };
    }

    private static AcademicYearDto MapYear(AcademicYear y) => new()
    {
        Id        = y.Id,
        YearName  = y.YearName,
        YearOrder = y.YearOrder,
        Semesters = y.Semesters?.Select(MapSemester).ToList() ?? []
    };

    // ─── Config ──────────────────────────────────────────────────────────────

    public async Task<ApiResponse<GpaConfigDto>> GetOrCreateConfigAsync(Guid userId)
    {
        var cfg = await _db.GpaConfigs.FirstOrDefaultAsync(x => x.UserId == userId);
        if (cfg is null)
        {
            cfg = new GpaConfig { UserId = userId, TotalCourses = 0, TotalCredits = 0, TargetGpa = 8.0m };
            _db.GpaConfigs.Add(cfg);
            await _db.SaveChangesAsync();
        }
        return new ApiResponse<GpaConfigDto>(new GpaConfigDto
        {
            Id           = cfg.Id,
            TotalCourses = cfg.TotalCourses,
            TotalCredits = cfg.TotalCredits,
            TargetGpa    = cfg.TargetGpa
        });
    }

    public async Task<ApiResponse<GpaConfigDto>> UpsertConfigAsync(Guid userId, UpsertGpaConfigRequest req)
    {
        var cfg = await _db.GpaConfigs.FirstOrDefaultAsync(x => x.UserId == userId);
        if (cfg is null)
        {
            cfg = new GpaConfig { UserId = userId };
            _db.GpaConfigs.Add(cfg);
        }
        cfg.TotalCourses = req.TotalCourses;
        cfg.TotalCredits = req.TotalCredits;
        cfg.TargetGpa    = req.TargetGpa;
        await _db.SaveChangesAsync();
        return new ApiResponse<GpaConfigDto>(new GpaConfigDto
        {
            Id           = cfg.Id,
            TotalCourses = cfg.TotalCourses,
            TotalCredits = cfg.TotalCredits,
            TargetGpa    = cfg.TargetGpa
        }, "Cập nhật cấu hình thành công.");
    }

    // ─── Academic Years ───────────────────────────────────────────────────────

    public async Task<ApiResponse<List<AcademicYearDto>>> GetAcademicYearsAsync(Guid userId)
    {
        var years = await _db.AcademicYears
            .Where(y => y.UserId == userId)
            .Include(y => y.Semesters).ThenInclude(s => s.Courses)
            .OrderBy(y => y.YearOrder)
            .ToListAsync();
        return new ApiResponse<List<AcademicYearDto>>(years.Select(MapYear).ToList());
    }

    public async Task<ApiResponse<AcademicYearDto>> CreateAcademicYearAsync(Guid userId, CreateAcademicYearRequest req)
    {
        var cfg = await _db.GpaConfigs.FirstOrDefaultAsync(x => x.UserId == userId);
        if (cfg is null)
            return new ApiResponse<AcademicYearDto>("Hãy cấu hình GPA trước.");

        var year = new AcademicYear
        {
            UserId       = userId,
            GpaConfigId  = cfg.Id,
            YearName     = req.YearName,
            YearOrder    = req.YearOrder
        };
        _db.AcademicYears.Add(year);
        await _db.SaveChangesAsync();
        return new ApiResponse<AcademicYearDto>(MapYear(year), "Tạo năm học thành công.");
    }

    public async Task<ApiResponse<bool>> DeleteAcademicYearAsync(Guid userId, Guid yearId)
    {
        var year = await _db.AcademicYears.FirstOrDefaultAsync(y => y.Id == yearId && y.UserId == userId);
        if (year is null) return new ApiResponse<bool>("Không tìm thấy năm học.");
        _db.AcademicYears.Remove(year);
        await _db.SaveChangesAsync();
        return new ApiResponse<bool>(true, "Đã xoá năm học.");
    }

    // ─── Semesters ───────────────────────────────────────────────────────────

    public async Task<ApiResponse<SemesterDto>> CreateSemesterAsync(Guid userId, CreateSemesterRequest req)
    {
        var year = await _db.AcademicYears
            .Include(y => y.Semesters)
            .FirstOrDefaultAsync(y => y.Id == req.AcademicYearId && y.UserId == userId);
        if (year is null) return new ApiResponse<SemesterDto>("Không tìm thấy năm học.");

        if (year.Semesters.Any(s => s.SemesterType == (SemesterType)req.SemesterType))
            return new ApiResponse<SemesterDto>("Học kỳ này đã tồn tại.");

        var sem = new Semester { AcademicYearId = req.AcademicYearId, SemesterType = (SemesterType)req.SemesterType };
        _db.Semesters.Add(sem);
        await _db.SaveChangesAsync();
        return new ApiResponse<SemesterDto>(MapSemester(sem), "Tạo học kỳ thành công.");
    }

    public async Task<ApiResponse<bool>> DeleteSemesterAsync(Guid userId, Guid semId)
    {
        var sem = await _db.Semesters
            .Include(s => s.AcademicYear)
            .FirstOrDefaultAsync(s => s.Id == semId && s.AcademicYear.UserId == userId);
        if (sem is null) return new ApiResponse<bool>("Không tìm thấy học kỳ.");
        _db.Semesters.Remove(sem);
        await _db.SaveChangesAsync();
        return new ApiResponse<bool>(true, "Đã xoá học kỳ.");
    }

    // ─── Courses ─────────────────────────────────────────────────────────────

    public async Task<ApiResponse<CourseDto>> CreateCourseAsync(Guid userId, CreateCourseRequest req)
    {
        var sem = await _db.Semesters
            .Include(s => s.AcademicYear)
            .FirstOrDefaultAsync(s => s.Id == req.SemesterId && s.AcademicYear.UserId == userId);
        if (sem is null) return new ApiResponse<CourseDto>("Không tìm thấy học kỳ.");

        var course = new Course
        {
            UserId     = userId,
            SemesterId = req.SemesterId,
            CourseCode = req.CourseCode,
            CourseName = req.CourseName,
            Credits    = req.Credits,
            Score      = req.Score
        };
        _db.Courses.Add(course);
        await _db.SaveChangesAsync();
        return new ApiResponse<CourseDto>(MapCourse(course), "Thêm môn học thành công.");
    }

    public async Task<ApiResponse<CourseDto>> UpdateCourseAsync(Guid userId, Guid courseId, UpdateCourseRequest req)
    {
        var course = await _db.Courses.FirstOrDefaultAsync(c => c.Id == courseId && c.UserId == userId);
        if (course is null) return new ApiResponse<CourseDto>("Không tìm thấy môn học.");
        course.CourseCode = req.CourseCode;
        course.CourseName = req.CourseName;
        course.Credits    = req.Credits;
        course.Score      = req.Score;
        await _db.SaveChangesAsync();
        return new ApiResponse<CourseDto>(MapCourse(course), "Cập nhật thành công.");
    }

    public async Task<ApiResponse<bool>> DeleteCourseAsync(Guid userId, Guid courseId)
    {
        var course = await _db.Courses.FirstOrDefaultAsync(c => c.Id == courseId && c.UserId == userId);
        if (course is null) return new ApiResponse<bool>("Không tìm thấy môn học.");
        _db.Courses.Remove(course);
        await _db.SaveChangesAsync();
        return new ApiResponse<bool>(true, "Đã xoá môn học.");
    }

    // ─── Summary ─────────────────────────────────────────────────────────────

    public async Task<ApiResponse<GpaSummaryDto>> GetSummaryAsync(Guid userId)
    {
        var cfg = await _db.GpaConfigs.FirstOrDefaultAsync(x => x.UserId == userId);
        var years = await _db.AcademicYears
            .Where(y => y.UserId == userId)
            .Include(y => y.Semesters).ThenInclude(s => s.Courses)
            .OrderBy(y => y.YearOrder)
            .ToListAsync();

        var allCourses = years.SelectMany(y => y.Semesters).SelectMany(s => s.Courses).ToList();
        var completedCredits = allCourses.Sum(c => c.Credits);
        var currentGpa = completedCredits > 0
            ? allCourses.Sum(c => c.Score * c.Credits) / completedCredits
            : 0m;

        var totalCredits = cfg?.TotalCredits ?? 0;
        var remainingCredits = totalCredits - completedCredits;
        var neededScore = remainingCredits > 0 && cfg is not null
            ? (cfg.TargetGpa * totalCredits - currentGpa * completedCredits) / remainingCredits
            : 0m;

        return new ApiResponse<GpaSummaryDto>(new GpaSummaryDto
        {
            CurrentGpa       = Math.Round(currentGpa, 2),
            TargetGpa        = cfg?.TargetGpa ?? 8.0m,
            CompletedCredits = completedCredits,
            TotalCredits     = totalCredits,
            CompletedCourses = allCourses.Count,
            TotalCourses     = cfg?.TotalCourses ?? 0,
            NeededScore      = neededScore > 0 ? Math.Round(neededScore, 2) : 0,
            OverallRanking   = ToRanking(currentGpa),
            AcademicYears    = years.Select(MapYear).ToList()
        });
    }
}
