using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using PMP.Domain.Entities.Note;

namespace PMP.Infrastructure.Persistence.Configurations.NoteConfiguration;

public class NoteEntityConfiguration : IEntityTypeConfiguration<Note>
{
    public void Configure(EntityTypeBuilder<Note> builder)
    {
        builder.ToTable("Notes");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.Title)
            .IsRequired()
            .HasMaxLength(255);

        builder.Property(n => n.Content)
            .IsRequired()
            .HasColumnType("text"); // JSON or long string

        builder.Property(n => n.CoverImage)
            .HasMaxLength(1000);

        builder.Property(n => n.Icon)
            .HasMaxLength(50);

        builder.Property(n => n.IsPinned)
            .HasDefaultValue(false);

        builder.Property(n => n.CreatedAt)
            .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

        builder.Property(n => n.UpdatedAt)
            .HasDefaultValueSql("NOW() AT TIME ZONE 'UTC'");

        builder.HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
