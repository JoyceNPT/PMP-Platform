namespace PMP.Application.Features.GPA.DTOs;

// ─── GpaConfig ───────────────────────────────────────────────────────────────

public class GpaConfigDto
{
    public Guid Id { get; set; }
    public int TotalCourses { get; set; }
    public int TotalCredits { get; set; }
    public decimal TargetGpa { get; set; }
}

public class UpsertGpaConfigRequest
{
    public int TotalCourses { get; set; }
    public int TotalCredits { get; set; }
    public decimal TargetGpa { get; set; }   // precision(10,9)
}

// ─── AcademicYear ────────────────────────────────────────────────────────────

public class AcademicYearDto
{
    public Guid Id { get; set; }
    public string YearName { get; set; } = string.Empty;
    public int YearOrder { get; set; }
    public List<SemesterDto> Semesters { get; set; } = [];
}

public class CreateAcademicYearRequest
{
    public string YearName { get; set; } = string.Empty;   // e.g. "2023-2024"
    public int YearOrder { get; set; }                      // 1 / 2 / 3 / 4
}

public class UpdateAcademicYearRequest
{
    public string YearName { get; set; } = string.Empty;
    public int YearOrder { get; set; }
}

// ─── Semester ────────────────────────────────────────────────────────────────

public class SemesterDto
{
    public Guid Id { get; set; }
    public int SemesterType { get; set; }
    public string SemesterLabel { get; set; } = string.Empty;
    public List<CourseDto> Courses { get; set; } = [];

    // Computed
    public decimal SemesterGpa { get; set; }
    public int TotalCredits { get; set; }
    public string Ranking { get; set; } = string.Empty;
}

public class CreateSemesterRequest
{
    public Guid AcademicYearId { get; set; }
    public int SemesterType { get; set; }
}

// ─── Course ──────────────────────────────────────────────────────────────────

public class CourseDto
{
    public Guid Id { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int Credits { get; set; }
    public decimal? Score { get; set; }
    public string GradeLabel { get; set; } = string.Empty;  // A+, A, B+, …
}

public class CreateCourseRequest
{
    public Guid SemesterId { get; set; }
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int Credits { get; set; }
    public decimal? Score { get; set; }
}

public class UpdateCourseRequest
{
    public string CourseCode { get; set; } = string.Empty;
    public string CourseName { get; set; } = string.Empty;
    public int Credits { get; set; }
    public decimal? Score { get; set; }
}

// ─── GPA Summary (Tổng hợp dashboard) ───────────────────────────────────────

public class GpaSummaryDto
{
    public decimal CurrentGpa { get; set; }          // GPA tích lũy thực tế
    public decimal TargetGpa { get; set; }
    public int CompletedCredits { get; set; }
    public int TotalCredits { get; set; }
    public int CompletedCourses { get; set; }
    public int TotalCourses { get; set; }
    public decimal NeededScore { get; set; }         // Điểm cần đạt để đạt mục tiêu
    public string OverallRanking { get; set; } = string.Empty;
    public List<AcademicYearDto> AcademicYears { get; set; } = [];
}
