using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program {
    static async Task Main() {
        var apiKey = "AIzaSyBlmqK-QroiURdL4unTAGlAUvlrmOs8h_k";
        var client = new HttpClient();
        var url = $"https://generativelanguage.googleapis.com/v1/models?key={apiKey}";
        
        try {
            var response = await client.GetAsync(url);
            var content = await response.Content.ReadAsStringAsync();
            Console.WriteLine(content);
        } catch (Exception ex) {
            Console.WriteLine(ex.Message);
        }
    }
}
