import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService, loginSchema, type LoginFormData } from '@/services/authService';
import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { GoogleLogin } from '@react-oauth/google';

export function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });
  const [error, setError]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPass, setShowPass]   = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const onSubmit = async (data: LoginFormData) => {
    try {
      if (executeRecaptcha) {
        recaptchaValue = await executeRecaptcha('login');
      }
      
      // Bypass for local testing if needed
      if (!recaptchaValue && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        recaptchaValue = 'MOCK_TOKEN';
      }
      
      setIsLoading(true);
      setError('');
      const res = await authService.login({ ...data, recaptchaToken: recaptchaValue });
      if (res.succeeded) {
        setAuth({ 
          id: res.data.userId, 
          email: res.data.email, 
          fullName: res.data.fullName,
          avatarUrl: res.data.avatarUrl 
        }, res.data.accessToken);
        navigate('/');
      } else {
        setError(res.message || 'Đăng nhập thất bại');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Có lỗi xảy ra, thử lại sau');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      setError('');
      const res = await authService.googleLogin(credentialResponse.credential);
      if (res.succeeded) {
        setAuth({ 
          id: res.data.userId, 
          email: res.data.email, 
          fullName: res.data.fullName,
          avatarUrl: res.data.avatarUrl 
        }, res.data.accessToken);
        navigate('/');
      } else {
        setError(res.message || 'Đăng nhập Google thất bại');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Lỗi xác thực Google');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel — animated brand */}
      <div className="auth-bg hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative">
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <span className="text-primary-foreground font-bold text-base">P</span>
          </div>
          <span className="font-bold text-white text-lg">PMP Platform</span>
        </div>

        <div className="relative z-10 space-y-6 animate-fade-in-up">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Quản lý cuộc sống<br />
              <span className="gradient-text">thông minh hơn.</span>
            </h1>
            <p className="text-white/60 text-base max-w-sm">
              Nền tảng quản lý cá nhân toàn diện — học tập, tài chính, định hướng nghề nghiệp và trợ lý AI.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Quản lý GPA', desc: 'Theo dõi điểm số và tín chỉ' },
              { label: 'Tài chính', desc: 'Chi tiêu thông minh mỗi ngày' },
              { label: 'Roadmap', desc: 'Lộ trình sự nghiệp rõ ràng' },
              { label: 'AI Chat', desc: 'Trợ lý AI hỗ trợ 24/7' },
            ].map(f => (
              <div key={f.label} className="glass rounded-xl p-4 space-y-1">
                <p className="text-white font-semibold text-sm">{f.label}</p>
                <p className="text-white/50 text-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-white/30 text-xs">
          © 2025 Personal Management Platform
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in-up">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Chào mừng trở lại 👋</h2>
            <p className="text-muted-foreground text-sm">Đăng nhập để tiếp tục hành trình của bạn</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive animate-fade-in">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                {...register('email')}
                className="flex h-11 w-full rounded-xl border border-input bg-card px-4 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition disabled:opacity-50"
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" htmlFor="password">Mật khẩu</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Quên mật khẩu?</Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className="flex h-11 w-full rounded-xl border border-input bg-card px-4 pr-11 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all active:scale-[0.98] disabled:opacity-60"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Đang đăng nhập...</>
              ) : (
                <>Đăng nhập <ArrowRight className="h-4 w-4" /></>
              )}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Hoặc tiếp tục với</span>
              </div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Đăng nhập Google không thành công')}
                useOneTap
                theme="outline"
                shape="pill"
              />
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
