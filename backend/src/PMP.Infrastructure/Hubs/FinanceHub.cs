using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using System.Security.Claims;

namespace PMP.Infrastructure.Hubs;

[Authorize]
public class FinanceHub : Hub
{
    private readonly ILogger<FinanceHub> _logger;

    public FinanceHub(ILogger<FinanceHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!string.IsNullOrWhiteSpace(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, userId);
            _logger.LogInformation("User {UserId} connected to FinanceHub ({ConnectionId})", userId, Context.ConnectionId);
        }

        await base.OnConnectedAsync();
    }
}
