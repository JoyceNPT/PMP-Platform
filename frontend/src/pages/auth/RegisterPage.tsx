import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { authService, registerSchema, type RegisterFormData } from '@/services/authService';
import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react';

export function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  watch('password', ''); // keep validation reactive

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError('');
      const { confirmPassword: _cp, ...payload } = data;
      const res = await authService.register(payload);
      if (res.succeeded) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setError(res.message || 'Đăng ký thất bại');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Có lỗi xảy ra, thử lại sau');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 animate-fade-in-up">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Đăng ký thành công!</h2>
          <p className="text-muted-foreground text-sm">Đang chuyển đến trang đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="auth-bg hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-primary-foreground font-bold text-base">P</span>
          </div>
          <span className="font-bold text-white text-lg">PMP Platform</span>
        </div>
        <div className="relative z-10 space-y-4 animate-fade-in-up">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Bắt đầu hành trình<br />
            <span className="gradient-text">của bạn ngay hôm nay.</span>
          </h1>
          <p className="text-white/60 text-base max-w-sm">
            Tạo tài khoản miễn phí và trải nghiệm nền tảng quản lý cá nhân thông minh nhất dành cho sinh viên.
          </p>
          <ul className="space-y-2 mt-4">
            {['Miễn phí hoàn toàn', 'Bảo mật dữ liệu', 'Tích hợp AI', 'Không giới hạn tính năng'].map(f => (
              <li key={f} className="flex items-center gap-2 text-white/70 text-sm">
                <Check className="h-4 w-4 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative z-10 text-white/30 text-xs">© 2025 Personal Management Platform</p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-start justify-center px-6 py-10 overflow-y-auto bg-background">
        <div className="w-full max-w-md space-y-6 animate-fade-in-up">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold">Tạo tài khoản 🚀</h2>
            <p className="text-muted-foreground text-sm">Điền thông tin bên dưới để đăng ký</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in">
                {error}
              </div>
            )}

            {/* Full name */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="fullName">Họ và tên</label>
              <input id="fullName" placeholder="Nguyễn Văn A" {...register('fullName')}
                className="flex h-11 w-full rounded-xl border border-input bg-card px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition placeholder:text-muted-foreground" />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="name@example.com" {...register('email')}
                className="flex h-11 w-full rounded-xl border border-input bg-card px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition placeholder:text-muted-foreground" />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {/* Phone + Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="phoneNumber">Số điện thoại</label>
                <input id="phoneNumber" placeholder="0987654321" {...register('phoneNumber')}
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition placeholder:text-muted-foreground" />
                {errors.phoneNumber && <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="gender">Giới tính</label>
                <select id="gender" {...register('gender', { valueAsNumber: true })}
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition text-foreground">
                  <option value={0}>Nam</option>
                  <option value={1}>Nữ</option>
                  <option value={2}>Khác</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="password">Mật khẩu</label>
              <div className="relative">
                <input id="password" type={showPass ? 'text' : 'password'} placeholder="Tối thiểu 6 ký tự" {...register('password')}
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-4 pr-11 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition placeholder:text-muted-foreground" />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <div className="relative">
                <input id="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="Nhập lại mật khẩu" {...register('confirmPassword')}
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-4 pr-11 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition placeholder:text-muted-foreground" />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-60 mt-2">
              {isLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang tạo tài khoản...</>
                : <>Đăng ký ngay <ArrowRight className="h-4 w-4" /></>
              }
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
