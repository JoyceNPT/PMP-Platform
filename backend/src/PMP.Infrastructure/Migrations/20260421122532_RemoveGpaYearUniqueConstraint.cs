using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveGpaYearUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AcademicYears_GpaConfigId_YearOrder",
                table: "AcademicYears");

            migrationBuilder.CreateIndex(
                name: "IX_AcademicYears_GpaConfigId_YearOrder",
                table: "AcademicYears",
                columns: new[] { "GpaConfigId", "YearOrder" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AcademicYears_GpaConfigId_YearOrder",
                table: "AcademicYears");

            migrationBuilder.CreateIndex(
                name: "IX_AcademicYears_GpaConfigId_YearOrder",
                table: "AcademicYears",
                columns: new[] { "GpaConfigId", "YearOrder" },
                unique: true);
        }
    }
}
