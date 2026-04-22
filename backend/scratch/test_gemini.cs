using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        var apiKey = "AIzaSyBlmqK-QroiURdL4unTAGlAUvlrmOs8h_k";
        var apiUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={apiKey}";

        var requestBody = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = "Say Hello" } } }
            }
        };

        using var client = new HttpClient();
        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
        var response = await client.PostAsync(apiUrl, content);

        Console.WriteLine($"Status: {response.StatusCode}");
        var result = await response.Content.ReadAsStringAsync();
        Console.WriteLine($"Response: {result}");
    }
}
