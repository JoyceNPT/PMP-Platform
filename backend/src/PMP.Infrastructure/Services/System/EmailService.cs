using Microsoft.Extensions.Configuration;
using PMP.Application.Features.System.Interfaces;
using PMP.Shared.Wrappers;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace PMP.Infrastructure.Services.System;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;

    public EmailService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task<ApiResponse<bool>> SendEmailAsync(string toEmail, string subject, string body)
    {
        try
        {
            var apiKey = _configuration["ExternalServices:SendGrid:ApiKey"];
            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(
                _configuration["ExternalServices:SendGrid:FromEmail"], 
                _configuration["ExternalServices:SendGrid:FromName"]
            );
            var to = new EmailAddress(toEmail);
            var msg = MailHelper.CreateSingleEmail(from, to, subject, body, body);
            var response = await client.SendEmailAsync(msg);

            if (response.IsSuccessStatusCode)
            {
                return new ApiResponse<bool>(true, "Email sent successfully.");
            }

            return new ApiResponse<bool>(false, $"Failed to send email. Status: {response.StatusCode}");
        }
        catch (Exception ex)
        {
            return new ApiResponse<bool>(false, $"Email service error: {ex.Message}");
        }
    }
}
