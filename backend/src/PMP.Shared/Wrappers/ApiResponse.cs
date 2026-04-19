namespace PMP.Shared.Wrappers;

public class ApiResponse<T>
{
    public bool Succeeded { get; set; }
    public string Message { get; set; } = string.Empty;
    public List<string>? Errors { get; set; }
    public T? Data { get; set; }

    public ApiResponse() { }

    public ApiResponse(T data, string message = "")
    {
        Succeeded = true;
        Message = message;
        Data = data;
    }

    public ApiResponse(string message)
    {
        Succeeded = false;
        Message = message;
    }
}
