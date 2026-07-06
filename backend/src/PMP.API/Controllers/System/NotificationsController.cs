using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PMP.Infrastructure.Persistence;
using PMP.Shared.Wrappers;

namespace PMP.API.Controllers;

[Authorize]
[ApiController]
[Route("api/notifications")]
[Produces("application/json")]
public class NotificationsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public NotificationsController(ApplicationDbContext db) => _db = db;

    private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] int take = 20)
    {
        var userId = GetUserId();
        var notifications = await _db.Notifications
            .Where(n => n.UserId == userId)
            .OrderBy(n => n.IsRead)
            .ThenByDescending(n => n.CreatedAt)
            .Take(Math.Clamp(take, 1, 50))
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Title = n.Title,
                Body = n.Body,
                Type = (int)n.Type,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt,
                ReadAt = n.ReadAt
            })
            .ToListAsync();

        return Ok(new ApiResponse<List<NotificationDto>>(notifications));
    }

    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetUserId();
        var count = await _db.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);
        return Ok(new ApiResponse<int>(count));
    }

    [HttpPost("{id:guid}/read")]
    public async Task<IActionResult> MarkAsRead(Guid id)
    {
        var userId = GetUserId();
        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
        if (notification is null)
            return NotFound(new ApiResponse<bool>("Không tìm thấy thông báo."));

        notification.IsRead = true;
        notification.ReadAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return Ok(new ApiResponse<bool>(true, "Đã đánh dấu đã đọc."));
    }

    [HttpPost("read-all")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var userId = GetUserId();
        var notifications = await _db.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
            notification.ReadAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync();
        return Ok(new ApiResponse<bool>(true, "Đã đánh dấu tất cả đã đọc."));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteNotification(Guid id)
    {
        var userId = GetUserId();
        var notification = await _db.Notifications.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
        if (notification is null)
            return NotFound(new ApiResponse<bool>("Không tìm thấy thông báo."));

        notification.IsDeleted = true;
        await _db.SaveChangesAsync();
        return Ok(new ApiResponse<bool>(true, "Đã xoá thông báo."));
    }
}

public class NotificationDto
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public int Type { get; set; }
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ReadAt { get; set; }
}
