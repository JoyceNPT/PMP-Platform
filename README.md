# PMP Platform (Personal Management Platform)

PMP Platform là một hệ thống quản lý cá nhân toàn diện, kết hợp quản lý ghi chú, lộ trình sự nghiệp và quản lý tài chính, với sự hỗ trợ của Trí tuệ nhân tạo (AI).

## 🌟 Các tính năng chính

### 1. Quản lý Tài khoản (Authentication)
- Đăng nhập, Đăng ký an toàn với JWT (JSON Web Token).
- Quản lý phiên đăng nhập mượt mà.

### 2. Ghi chú & Workspace (Note-taking)
- Trình soạn thảo văn bản hỗ trợ Markdown (Rich text editor).
- Quản lý thư mục, cấu trúc phân cấp linh hoạt.
- Tự động lưu và đồng bộ hoá dữ liệu.

### 3. Lộ trình Nghề nghiệp (Career Roadmap)
- Giao diện trực quan (Canvas-based) được xây dựng bằng React Flow.
- **AI Tích hợp:** Tự động tạo lộ trình học tập, kỹ năng phù hợp dựa trên Chuyên ngành, Kinh nghiệm và Mục tiêu nghề nghiệp.
- **Theo dõi tiến độ:** 
  - Cập nhật trạng thái từng kỹ năng (Chưa học, Đang học, Đã hoàn thành).
  - Đính kèm chứng chỉ (URL) xác thực ngay trên roadmap.
  - Thêm ghi chú học tập trực tiếp.

### 4. Quản lý Tài chính (Personal Finance)
- **Thu / Chi:** Theo dõi chi tiết từng khoản giao dịch, phân loại rõ ràng.
- **Quản lý Danh mục (Custom Categories):** Tự do tạo mới, chỉnh sửa màu sắc, icon của các danh mục thu/chi.
- **Mục tiêu Tiết kiệm (Saving Goals):** Thiết lập và trực quan hoá tiến độ tiết kiệm thông qua các thanh trạng thái.
- **Báo cáo Trực quan:** Biểu đồ xu hướng 6 tháng và biểu đồ cơ cấu chi tiêu (Recharts).
- **AI Dự báo:** Dự báo chi tiêu dựa trên lịch sử dữ liệu tài chính của người dùng.

---

## 🛠️ Công nghệ sử dụng

### Frontend
- **Framework:** React 18 (Vite)
- **Ngôn ngữ:** TypeScript
- **Styling:** TailwindCSS
- **State Management / Hooks:** Custom Hooks, React Context
- **Thư viện nổi bật:**
  - `recharts`: Vẽ biểu đồ tài chính.
  - `@xyflow/react`: Xây dựng sơ đồ tư duy / roadmap.
  - `lucide-react`: Hệ thống icon SVG nhẹ và đẹp.

### Backend
- **Framework:** .NET 8 (C#)
- **Kiến trúc:** Clean Architecture / N-Tier
- **Cơ sở dữ liệu:** PostgreSQL (PmpDb)
- **ORM:** Entity Framework Core (EF Core)
- **Bảo mật:** Bearer JWT, ASP.NET Core Identity (tuỳ chọn)

---

## 🚀 Hướng dẫn cài đặt & Chạy dự án

### Yêu cầu hệ thống
- Node.js (phiên bản >= 18)
- .NET 8 SDK
- PostgreSQL Server

### 1. Cài đặt Cơ sở dữ liệu (Backend)
Bật PostgreSQL và tạo một database (hoặc cấu hình tự tạo trong EF). 
Cập nhật chuỗi kết nối (Connection String) trong file `backend/src/PMP.API/appsettings.json`.

Tiến hành apply Database Migration:
```bash
cd backend/src/PMP.API
dotnet ef database update --project ../PMP.Infrastructure --startup-project .
```

### 2. Chạy Backend (.NET)
```bash
cd backend/src/PMP.API
dotnet run
```
API sẽ khởi chạy ở `http://localhost:5259`.

### 3. Chạy Frontend (React/Vite)
Mở một terminal mới:
```bash
cd frontend
npm install
npm run dev
```
Giao diện sẽ khởi chạy ở `http://localhost:5174`.
