using PMP.Application.Features.GPA.DTOs;
using PMP.Shared.Wrappers;

namespace PMP.Application.Features.GPA.Interfaces;

public interface IGpaService
{
    // Config
    Task<ApiResponse<GpaConfigDto>> GetOrCreateConfigAsync(Guid userId);
    Task<ApiResponse<GpaConfigDto>> UpsertConfigAsync(Guid userId, UpsertGpaConfigRequest request);

    // Academic Years
    Task<ApiResponse<List<AcademicYearDto>>> GetAcademicYearsAsync(Guid userId);
    Task<ApiResponse<AcademicYearDto>> CreateAcademicYearAsync(Guid userId, CreateAcademicYearRequest request);
    Task<ApiResponse<AcademicYearDto>> UpdateAcademicYearAsync(Guid userId, Guid yearId, UpdateAcademicYearRequest request);
    Task<ApiResponse<bool>> DeleteAcademicYearAsync(Guid userId, Guid yearId);

    // Semesters
    Task<ApiResponse<SemesterDto>> CreateSemesterAsync(Guid userId, CreateSemesterRequest request);
    Task<ApiResponse<bool>> DeleteSemesterAsync(Guid userId, Guid semesterId);

    // Courses
    Task<ApiResponse<CourseDto>> CreateCourseAsync(Guid userId, CreateCourseRequest request);
    Task<ApiResponse<CourseDto>> UpdateCourseAsync(Guid userId, Guid courseId, UpdateCourseRequest request);
    Task<ApiResponse<bool>> DeleteCourseAsync(Guid userId, Guid courseId);

    // Summary
    Task<ApiResponse<GpaSummaryDto>> GetSummaryAsync(Guid userId);
}
