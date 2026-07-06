using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PMP.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFinanceSharing : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DROP TABLE IF EXISTS "FinanceGroupInvites" CASCADE;
                DROP TABLE IF EXISTS "FinanceGroupMembers" CASCADE;
                DROP TABLE IF EXISTS "FinanceShareProfiles" CASCADE;
                DROP TABLE IF EXISTS "FinanceGroups" CASCADE;
                """);

            migrationBuilder.CreateTable(
                name: "FinanceGroups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    CreatedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceGroups", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "FinanceShareProfiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    InviteCode = table.Column<string>(type: "character varying(16)", maxLength: 16, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceShareProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FinanceShareProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "FinanceGroupInvites",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FinanceGroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    InviterUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    InviteeUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceGroupInvites", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FinanceGroupInvites_FinanceGroups_FinanceGroupId",
                        column: x => x.FinanceGroupId,
                        principalTable: "FinanceGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FinanceGroupInvites_Users_InviteeUserId",
                        column: x => x.InviteeUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_FinanceGroupInvites_Users_InviterUserId",
                        column: x => x.InviterUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "FinanceGroupMembers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FinanceGroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    LeftAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinanceGroupMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_FinanceGroupMembers_FinanceGroups_FinanceGroupId",
                        column: x => x.FinanceGroupId,
                        principalTable: "FinanceGroups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FinanceGroupMembers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FinanceGroupInvites_FinanceGroupId_InviteeUserId_Status",
                table: "FinanceGroupInvites",
                columns: new[] { "FinanceGroupId", "InviteeUserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_FinanceGroupInvites_InviteeUserId_Status",
                table: "FinanceGroupInvites",
                columns: new[] { "InviteeUserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_FinanceGroupInvites_InviterUserId_Status",
                table: "FinanceGroupInvites",
                columns: new[] { "InviterUserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_FinanceGroupMembers_FinanceGroupId_UserId",
                table: "FinanceGroupMembers",
                columns: new[] { "FinanceGroupId", "UserId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FinanceGroupMembers_UserId_Status",
                table: "FinanceGroupMembers",
                columns: new[] { "UserId", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_FinanceGroups_CreatedByUserId",
                table: "FinanceGroups",
                column: "CreatedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_FinanceShareProfiles_InviteCode",
                table: "FinanceShareProfiles",
                column: "InviteCode",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_FinanceShareProfiles_UserId",
                table: "FinanceShareProfiles",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FinanceGroupInvites");

            migrationBuilder.DropTable(
                name: "FinanceGroupMembers");

            migrationBuilder.DropTable(
                name: "FinanceShareProfiles");

            migrationBuilder.DropTable(
                name: "FinanceGroups");
        }
    }
}
