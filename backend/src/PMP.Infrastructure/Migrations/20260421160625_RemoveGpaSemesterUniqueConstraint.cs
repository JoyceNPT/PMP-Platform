using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveGpaSemesterUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Semesters_AcademicYearId_SemesterType",
                table: "Semesters");

            migrationBuilder.CreateIndex(
                name: "IX_Semesters_AcademicYearId_SemesterType",
                table: "Semesters",
                columns: new[] { "AcademicYearId", "SemesterType" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Semesters_AcademicYearId_SemesterType",
                table: "Semesters");

            migrationBuilder.CreateIndex(
                name: "IX_Semesters_AcademicYearId_SemesterType",
                table: "Semesters",
                columns: new[] { "AcademicYearId", "SemesterType" },
                unique: true);
        }
    }
}
