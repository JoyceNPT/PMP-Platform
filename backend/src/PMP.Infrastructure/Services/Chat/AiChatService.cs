using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PMP.Shared.Wrappers;
using PMP.Infrastructure.Persistence;
using PMP.Infrastructure.Services.System;
using System.Text;
using System.Text.Json;
using System.Net.Http;

namespace PMP.Infrastructure.Services.Chat;

public interface IAiChatService
{
    Task<ApiResponse<string>> GetAiResponseAsync(Guid userId, string message);
}

public class AiChatService : IAiChatService
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ApplicationDbContext _db;
    private readonly ILogger<AiChatService> _logger;

    public AiChatService(IConfiguration configuration, IHttpClientFactory httpClientFactory, ApplicationDbContext db, ILogger<AiChatService> logger)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _db = db;
        _logger = logger;
    }

    public async Task<ApiResponse<string>> GetAiResponseAsync(Guid userId, string message)
    {
        try
        {
            _logger.LogInformation("Generating AI response for user {UserId} using gemini-2.5-flash", userId);

            // 1. Fetch User Context
            var profile = await _db.UserCareerProfiles
                .Include(p => p.Skills)
                .FirstOrDefaultAsync(p => p.UserId == userId);

            var financeSummary = await _db.Transactions
                .Where(t => t.UserId == userId && t.CreatedAt >= DateTime.UtcNow.AddDays(-30))
                .GroupBy(t => t.Type)
                .Select(g => new { Type = g.Key, Total = g.Sum(t => t.Amount) })
                .ToListAsync();

            var contextBuilder = new StringBuilder();
            contextBuilder.AppendLine("USER CONTEXT:");
            if (profile != null) {
                contextBuilder.AppendLine($"- Chuyên ngành: {profile.Major}");
                contextBuilder.AppendLine($"- Kỹ năng: {string.Join(", ", profile.Skills.Select(s => s.SkillName))}");
            }
            contextBuilder.AppendLine("- Tài chính (30 ngày qua):");
            foreach (var f in financeSummary) {
                contextBuilder.AppendLine($"  * {f.Type}: {f.Total:N0} VND");
            }

            var systemPrompt = $@"
                Bạn là Trợ lý PMP (Personal Management Platform).
                Hãy giúp người dùng quản lý GPA, Lộ trình nghề nghiệp và Tài chính.
                Trả lời thân thiện, chuyên nghiệp, ngắn gọn (tối đa 4 câu).
                Sử dụng tiếng Việt.
                
                {contextBuilder}
            ";

            var apiKey = _configuration["ExternalServices:Gemini:ApiKey"];
            if (string.IsNullOrEmpty(apiKey)) return new ApiResponse<string>("Lỗi cấu hình AI.");
            
            var model = _configuration["ExternalServices:Gemini:Model"] ?? "models/gemini-1.5-flash";
            if (!model.StartsWith("models/")) model = "models/" + model;

            // Using exactly the same URL structure as the reference project
            var apiUrl = $"https://generativelanguage.googleapis.com/v1beta/{model}:generateContent?key={apiKey}";

            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(120);

            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = $"{systemPrompt}\n\nUSER MESSAGE: {message}" } } }
                }
            };

            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            
            HttpResponseMessage response = null;
            int retryCount = 0;
            while (retryCount < 2)
            {
                response = await client.PostAsync(apiUrl, content);
                if ((int)response.StatusCode == 429)
                {
                    _logger.LogWarning("Gemini API 429 in Chat. Retrying...");
                    await Task.Delay(1500 * (retryCount + 1));
                    retryCount++;
                    continue;
                }
                break;
            }

            var rawResponse = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode) {
                _logger.LogError("Gemini Chat Error: {StatusCode} - {Error}", response.StatusCode, rawResponse);
                return new ApiResponse<string>("AI đang bận (Hết hạn mức/429), vui lòng thử lại sau vài giây.");
            }

            using var doc = JsonDocument.Parse(rawResponse);
            var candidates = doc.RootElement.GetProperty("candidates");
            if (candidates.GetArrayLength() == 0) return new ApiResponse<string>("AI không thể phản hồi lúc này.");

            var aiText = candidates[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();

            return new ApiResponse<string>(aiText ?? "Không có phản hồi", "AI Success");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception in AiChatService for user {UserId}", userId);
            return new ApiResponse<string>($"Lỗi hệ thống: {ex.Message}");
        }
    }
}
