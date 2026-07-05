using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsCustomToRoadmapNode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsCustom",
                table: "RoadmapNodes",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsCustom",
                table: "RoadmapNodes");
        }
    }
}
