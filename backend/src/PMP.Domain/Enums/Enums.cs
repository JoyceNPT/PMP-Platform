namespace PMP.Domain.Enums;

// ─── Auth ────────────────────────────────────────────────────────────────────

public enum Gender
{
    Male = 0,
    Female = 1,
    Other = 2
}

public enum OAuthProvider
{
    Google = 0
}

public enum AppTheme
{
    Light = 0,
    Dark = 1
}

public enum AppLanguage
{
    VI = 0,
    EN = 1
}

// ─── GPA ─────────────────────────────────────────────────────────────────────

public enum SemesterType
{
    Spring = 0,
    Spring3Week = 1,
    Summer = 2,
    Summer3Week = 3,
    Fall = 4,
    Fall3Week = 5
}

public enum AcademicRanking
{
    Average = 0,   // GPA < 5.0
    Good = 1,      // GPA >= 5.0 && < 8.0
    VeryGood = 2,  // GPA >= 8.0 && < 9.0
    Excellent = 3  // GPA >= 9.0
}

// ─── Finance ─────────────────────────────────────────────────────────────────

public enum TransactionType
{
    Income = 0,
    Expense = 1
}

public enum SavingGoalStatus
{
    InProgress = 0,
    Completed = 1,
    Cancelled = 2
}

public enum StorageType
{
    Url = 0,
    S3 = 1,
    AzureBlob = 2
}

// ─── Roadmap ─────────────────────────────────────────────────────────────────

public enum RoadmapSource
{
    RoadmapSh = 0,
    AiGenerated = 1
}

public enum NodeStatus
{
    NotStarted = 0,
    InProgress = 1,
    Completed = 2
}

public enum SkillType
{
    Current = 0,
    Planned = 1
}

public enum ProficiencyLevel
{
    Beginner = 0,
    Intermediate = 1,
    Advanced = 2,
    Expert = 3
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

public enum ConversationType
{
    AI = 0,
    Admin = 1
}

public enum MessageRole
{
    User = 0,
    Assistant = 1,
    System = 2
}

public enum MessageContentType
{
    Text = 0,
    Image = 1,
    File = 2
}

// ─── System ──────────────────────────────────────────────────────────────────

public enum NotificationType
{
    System = 0,
    GPA = 1,
    Finance = 2,
    Roadmap = 3,
    Chat = 4
}
