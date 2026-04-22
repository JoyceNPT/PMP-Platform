using PMP.Shared.Wrappers;

namespace PMP.Application.Features.System.Interfaces;

public interface IEmailService
{
    Task<ApiResponse<bool>> SendEmailAsync(string toEmail, string subject, string body);
}
