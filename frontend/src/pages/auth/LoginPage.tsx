import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService, loginSchema, type LoginFormData } from '@/services/authService';
import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, Sparkles, Moon, Sun } from 'lucide-react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import { GoogleLogin } from '@react-oauth/google';
import { Logo } from '@/components/shared/Logo';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';

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
  const { theme, setTheme } = useTheme();
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  const onSubmit = async (data: LoginFormData) => {
    try {
      let recaptchaValue = '';
      if (isLocalhost) {
        recaptchaValue = 'MOCK_TOKEN';
      } else if (executeRecaptcha) {
        recaptchaValue = await executeRecaptcha('login');
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

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <div className={`flex h-screen overflow-hidden relative transition-colors duration-500 ${isDark ? 'bg-[#09090b] text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Background Decorative Glows */}
      <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] pointer-events-none transition-opacity duration-500 ${isDark ? 'bg-primary/10 opacity-70' : 'bg-primary/5 opacity-50'}`} />
      <div className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] pointer-events-none transition-opacity duration-500 ${isDark ? 'bg-accent/10 opacity-70' : 'bg-accent/5 opacity-50'}`} />

      {/* Floating Theme Toggle in Top Right */}
      <div className="absolute top-6 right-6 z-50">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full shadow-md bg-background/80 border-border/40 backdrop-blur-md hover:scale-105 active:scale-95 transition-all"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
        >
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-violet-600" />}
        </Button>
      </div>

      {/* Left panel — animated brand */}
      <div className={`hidden lg:flex lg:w-[50%] flex-col justify-between p-10 xl:p-14 relative border-r overflow-y-auto transition-colors duration-500 ${isDark ? 'border-white/[0.06] bg-[#0d0d12]/40 backdrop-blur-3xl' : 'border-slate-200/60 bg-white/70 backdrop-blur-3xl'}`}>
        
        {/* Grid Overlay */}
        <div className={`absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none ${isDark ? 'opacity-[0.04]' : 'opacity-[0.03]'}`} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Logo size={22} />
          </div>
          <span className="font-black tracking-tight text-lg">PMP Platform</span>
        </div>

        <div className="relative z-10 space-y-6 my-auto max-w-lg">
          <div className="space-y-4">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-primary/5 border-primary/10 text-primary'}`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nền Tảng Quản Trị Cá Nhân</span>
            </div>
            <h1 className="text-3xl xl:text-4xl font-black tracking-tight leading-[1.2]">
              Quản lý thông thái <br />
              <span className="bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">Định hình tương lai.</span>
            </h1>
            <p className={`text-base leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
              Ứng dụng đồng hành đắc lực giúp bạn hoạch định lộ trình học tập GPA, cân đối thu chi tài chính cá nhân và kiến tạo sự nghiệp cùng Trợ lý ảo AI.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'GPA Học Tập', desc: 'Theo dõi điểm & tín chỉ', icon: '🎓' },
              { label: 'Quản Lý Thu Chi', desc: 'Cân đối tài chính tối ưu', icon: '💰' },
              { label: 'Sơ Đồ Sự Nghiệp', desc: 'Xây dựng kỹ năng thực chiến', icon: '🎯' },
              { label: 'Cố Vấn AI 24/7', desc: 'Học tập & tương tác đàm thoại', icon: '🤖' },
            ].map(f => (
              <div key={f.label} className={`group border p-4 space-y-2 rounded-2xl transition-all duration-300 shadow-sm hover:-translate-y-0.5 cursor-pointer ${isDark ? 'bg-white/[0.01] border-white/[0.04] hover:border-primary/20 hover:bg-white/[0.03]' : 'bg-slate-100/40 border-slate-200/50 hover:border-primary/20 hover:bg-white'}`}>
                <span className="text-xl block group-hover:scale-110 transition-transform duration-300 w-fit">{f.icon}</span>
                <div className="space-y-0.5">
                  <p className="font-bold text-xs tracking-tight">{f.label}</p>
                  <p className={`text-3xs leading-normal ${isDark ? 'text-zinc-500' : 'text-slate-500'}`}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`relative z-10 flex items-center justify-between text-2xs ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
          <span>© 2026 PMP Platform Corp.</span>
          <span>Version 2.0 (Premium)</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-5 py-6 sm:px-8 relative overflow-y-auto">
        <div className={`w-full max-w-[420px] p-6 sm:p-8 rounded-3xl border backdrop-blur-2xl transition-all duration-500 shadow-2xl ${isDark ? 'bg-[#0f0f16]/40 border-white/[0.04] shadow-black/40' : 'bg-white/90 border-slate-200/50 shadow-slate-100'}`}>
          
          <div className="space-y-1 text-center sm:text-left mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight">Đăng Nhập 👋</h2>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Nhập thông tin tài khoản để tiếp tục</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400 font-medium animate-fade-in">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`} htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                {...register('email')}
                className={`flex h-11 w-full rounded-xl border px-4 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 ${isDark ? 'border-white/[0.08] bg-white/[0.02] text-white placeholder:text-zinc-600 focus:border-primary/50' : 'border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:border-primary/50'}`}
              />
              {errors.email && <p className="text-xs text-rose-500 font-semibold mt-1">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`} htmlFor="password">Mật khẩu</label>
                <Link to="/forgot-password" className="text-xs text-primary hover:opacity-85 font-bold transition-opacity">Quên mật khẩu?</Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  {...register('password')}
                  className={`flex h-11 w-full rounded-xl border px-4 pr-12 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/20 ${isDark ? 'border-white/[0.08] bg-white/[0.02] text-white placeholder:text-zinc-600 focus:border-primary/50' : 'border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:border-primary/50'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}
                >
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-500 font-semibold mt-1">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Đang kiểm tra...</>
              ) : (
                <>Đăng Nhập <ArrowRight className="h-4 w-4" /></>
              )}
            </button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className={`w-full border-t ${isDark ? 'border-white/[0.06]' : 'border-slate-200'}`} />
              </div>
              <div className="relative flex justify-center text-3xs uppercase tracking-wider font-bold">
                <span className={`px-3 ${isDark ? 'bg-[#09090b] text-zinc-500' : 'bg-slate-50 text-slate-400'}`}>Hoặc tiếp tục với</span>
              </div>
            </div>

            <div className="flex justify-center w-full">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setError('Đăng nhập Google không thành công')}
                useOneTap
                theme={isDark ? 'filled_dark' : 'outline'}
                shape="circle"
                width="100%"
              />
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-bold text-primary hover:opacity-85 transition-opacity">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
