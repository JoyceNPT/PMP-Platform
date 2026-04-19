using PMP.Domain.Common;
using PMP.Domain.Enums;

namespace PMP.Domain.Entities.GPA;

// ─────────────────────────────────────────────────────────────────────────────
// GPA CONFIG  (one-time setup per user)
// ─────────────────────────────────────────────────────────────────────────────
public class GpaConfig : BaseEntity
{
    public Guid UserId { get; set; }                            // unique — 1:1 with User
    public int TotalCourses { get; set; }                       // tổng số môn toàn khoá
    public int TotalCredits { get; set; }                       // tổng tín chỉ toàn khoá

    /// <summary>precision(10,9) — KHÔNG làm tròn</summary>
    public decimal TargetGpa { get; set; }

    // ── Navigation ───────────────────────────────────────────────────────────
    public ICollection<AcademicYear> AcademicYears { get; set; } = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// ACADEMIC YEAR  (năm học: "2023-2024", năm thứ 1/2/3/4)
// ─────────────────────────────────────────────────────────────────────────────
public class AcademicYear : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid GpaConfigId { get; set; }
    public string YearName { get; set; } = string.Empty;        // "2023-2024", max 20
    public int YearOrder { get; set; }                          // 1 / 2 / 3 / 4

    // ── Navigation ───────────────────────────────────────────────────────────
    public GpaConfig GpaConfig { get; set; } = null!;
    public ICollection<Semester> Semesters { get; set; } = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// SEMESTER  (unique: AcademicYearId + SemesterType)
// ─────────────────────────────────────────────────────────────────────────────
public class Semester : BaseEntity
{
    public Guid AcademicYearId { get; set; }

    /// <summary>Spring / Spring3Week / Summer / Summer3Week / Fall / Fall3Week</summary>
    public SemesterType SemesterType { get; set; }

    // ── Navigation ───────────────────────────────────────────────────────────
    public AcademicYear AcademicYear { get; set; } = null!;
    public ICollection<Course> Courses { get; set; } = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE
// ─────────────────────────────────────────────────────────────────────────────
public class Course : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid SemesterId { get; set; }
    public string CourseCode { get; set; } = string.Empty;      // max 20
    public string CourseName { get; set; } = string.Empty;      // max 200
    public int Credits { get; set; }

    /// <summary>
    /// Thang 10, precision(5,2), KHÔNG làm tròn.
    /// VD: 8.75 lưu chính xác là 8.75
    /// </summary>
    public decimal Score { get; set; }

    // ── Navigation ───────────────────────────────────────────────────────────
    public Semester Semester { get; set; } = null!;
}

/*
 * NOTE — Computed values (Application layer, KHÔNG lưu DB):
 *
 *  CurrentGpa   = Σ(Score × Credits) / Σ(Credits)
 *  SemesterGpa  = Σ(Score × Credits trong kỳ) / Σ(Credits trong kỳ)
 *  NeededScore  = (TargetGpa × TotalCredits - CurrentGpa × CompletedCredits)
 *                 / RemainingCredits
 *
 *  Xếp loại kỳ:
 *    GPA < 5.0  → Average (Trung bình)
 *    GPA < 8.0  → Good    (Khá)
 *    GPA < 9.0  → VeryGood (Giỏi)
 *    GPA >= 9.0 → Excellent (Xuất sắc)
 */
