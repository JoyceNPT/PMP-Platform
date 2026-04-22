using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Text;
using System.Text.Json;

namespace PMP.Infrastructure.Services.System;

public interface IAiService
{
    Task<T?> GetStructuredResponseAsync<T>(string prompt, string? systemPrompt = null);
}

public class GeminiService : IAiService
{
    private readonly IConfiguration _configuration;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<GeminiService> _logger;

    public GeminiService(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<GeminiService> logger)
    {
        _configuration = configuration;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<T?> GetStructuredResponseAsync<T>(string prompt, string? systemPrompt = null)
    {
        try
        {
            var apiKey = _configuration["ExternalServices:Gemini:ApiKey"];
            if (string.IsNullOrEmpty(apiKey)) {
                _logger.LogError("Gemini API Key is missing.");
                return default;
            }

            _logger.LogInformation("Using API Key starting with: {KeyPrefix}", apiKey[..5]);

            // Using exactly the same URL structure as the reference project
            var apiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";

            var fullPrompt = string.IsNullOrEmpty(systemPrompt) 
                ? prompt 
                : $"{systemPrompt}\n\nUSER REQUEST: {prompt}";

            var requestBody = new
            {
                contents = new[]
                {
                    new { parts = new[] { new { text = fullPrompt } } }
                }
            };

            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(45);

            var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            
            _logger.LogInformation("Sending request to Gemini AI (v1/gemini-1.5-flash)...");
            
            HttpResponseMessage response = null;
            int retryCount = 0;
            while (retryCount < 3)
            {
                response = await client.PostAsync(apiUrl, content);
                if ((int)response.StatusCode == 429)
                {
                    _logger.LogWarning("Gemini API 429 (Too Many Requests). Retrying in 2s...");
                    await Task.Delay(2000 * (retryCount + 1));
                    retryCount++;
                    continue;
                }
                break;
            }

            var rawResponse = await response.Content.ReadAsStringAsync();
            _logger.LogInformation("Gemini Raw Response: {Raw}", rawResponse);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Gemini API Error: {StatusCode} - {Error}", response.StatusCode, rawResponse);
                return default;
            }

            using var doc = JsonDocument.Parse(rawResponse);
            
            var candidates = doc.RootElement.GetProperty("candidates");
            if (candidates.GetArrayLength() == 0) return default;

            var aiText = candidates[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            if (string.IsNullOrEmpty(aiText)) {
                _logger.LogWarning("Gemini returned empty text.");
                return default;
            }

            _logger.LogInformation("Gemini Response: {Response}", aiText);

            var cleanedJson = CleanJson(aiText);

            return JsonSerializer.Deserialize<T>(cleanedJson, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception in GeminiService");
            return default;
        }
    }

    private string CleanJson(string text)
    {
        var result = text.Trim();
        if (result.StartsWith("```json")) result = result.Substring(7);
        if (result.EndsWith("```")) result = result.Substring(0, result.Length - 3);
        return result.Trim();
    }
}
