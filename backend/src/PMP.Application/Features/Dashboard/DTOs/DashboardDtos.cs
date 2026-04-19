namespace PMP.Application.Features.Dashboard.DTOs;

public class DashboardOverviewDto
{
    public decimal CurrentGpa { get; set; }
    public string GpaRanking { get; set; } = string.Empty;
    public decimal MonthlyIncome { get; set; }
    public decimal MonthlyExpense { get; set; }
    public decimal SavingsProgress { get; set; } // Percentage 0-100
    public int CompletedRoadmapNodes { get; set; }
    public int TotalRoadmapNodes { get; set; }
    public List<RecentActivityDto> RecentActivities { get; set; } = [];
}

public class RecentActivityDto
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
    public string Type { get; set; } = string.Empty; // GPA, Finance, Roadmap
}
