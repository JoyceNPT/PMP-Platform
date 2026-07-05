import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { authService, registerSchema, type RegisterFormData } from '@/services/authService';
import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2, Check, Sun, Moon, Sparkles } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';

export function RegisterPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });
  const [error, setError]           = useState('');
  const [success, setSuccess]       = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [showPass, setShowPass]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setIsLoading(true);
      setError('');
      const { confirmPassword: _cp, ...payload } = data;
      const res = await authService.register(payload);
      if (res.succeeded) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 4000);
      } else {
        setError(res.message || 'Đăng ký thất bại');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Có lỗi xảy ra, thử lại sau');
    } finally {
      setIsLoading(false);
    }
  };

  const inputCls = `flex h-10 w-full rounded-xl border px-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${isDark ? 'border-white/[0.08] bg-white/[0.02] text-white placeholder:text-zinc-600 focus:border-primary/50' : 'border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:border-primary/50'}`;
  const labelCls = `text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`;

  if (success) {
    return (
      <div className={`flex h-screen items-center justify-center transition-colors ${isDark ? 'bg-[#09090b] text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="text-center space-y-5 animate-fade-in-up px-6">
          <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center shadow-lg shadow-primary/20 ${isDark ? 'bg-primary/10 border border-primary/20' : 'bg-primary/5 border border-primary/10'}`}>
            <Check className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold tracking-tight">Đăng ký thành công! 🎉</h2>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Vui lòng kiểm tra email để xác thực tài khoản.</p>
            <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>Đang chuyển đến trang đăng nhập...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden relative transition-colors duration-500 ${isDark ? 'bg-[#09090b] text-white' : 'bg-slate-50 text-slate-900'}`}>

      {/* Background glows */}
      <div className={`absolute top-[-20%] right-[-10%] w-[55%] h-[55%] rounded-full blur-[140px] pointer-events-none ${isDark ? 'bg-primary/10 opacity-70' : 'bg-accent/5 opacity-50'}`} />
      <div className={`absolute bottom-[-20%] left-[-10%] w-[55%] h-[55%] rounded-full blur-[140px] pointer-events-none ${isDark ? 'bg-accent/10 opacity-60' : 'bg-primary/5 opacity-40'}`} />

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <Button variant="outline" size="icon" className="rounded-full shadow-md bg-background/80 border-border/40 backdrop-blur-md hover:scale-105 active:scale-95 transition-all"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}>
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-violet-600" />}
        </Button>
      </div>

      {/* Left panel — brand */}
      <div className={`hidden lg:flex lg:w-[45%] flex-col justify-between p-10 xl:p-12 relative border-r overflow-y-auto transition-colors duration-500 ${isDark ? 'border-white/[0.06] bg-[#0d0d12]/40 backdrop-blur-3xl' : 'border-slate-200/60 bg-white/70 backdrop-blur-3xl'}`}>
        <div className={`absolute inset-0 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none ${isDark ? 'opacity-[0.04]' : 'opacity-[0.03]'}`} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/20">
            <Logo size={22} />
          </div>
          <span className="font-black tracking-tight text-lg">PMP Platform</span>
        </div>

        <div className="relative z-10 space-y-6 my-auto max-w-md">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isDark ? 'bg-primary/10 border border-primary/20 text-primary' : 'bg-primary/5 border border-primary/10 text-primary'}`}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tham Gia Miễn Phí</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-black tracking-tight leading-[1.2]">
            Bắt đầu hành trình <br />
            <span className="bg-gradient-to-r from-primary via-purple-500 to-accent bg-clip-text text-transparent">của bạn ngay hôm nay.</span>
          </h1>

          <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
            Tạo tài khoản miễn phí và trải nghiệm nền tảng quản lý cá nhân thông minh — GPA, Tài chính, Lộ trình & AI đồng hành.
          </p>

          <ul className="space-y-3">
            {[
              { text: 'Hoàn toàn miễn phí, không giới hạn tính năng', icon: '✅' },
              { text: 'Bảo mật dữ liệu chuẩn Enterprise', icon: '🔐' },
              { text: 'Tích hợp Trợ lý AI thông minh 24/7', icon: '🤖' },
              { text: 'Đồng bộ đa thiết bị tức thì', icon: '⚡' },
            ].map(f => (
              <li key={f.text} className={`flex items-start gap-3 text-sm ${isDark ? 'text-zinc-400' : 'text-slate-600'}`}>
                <span className="shrink-0 mt-0.5">{f.icon}</span>
                <span>{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={`relative z-10 flex items-center justify-between text-2xs ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>
          <span>© 2026 PMP Platform Corp.</span>
          <span>Version 2.0</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 items-center justify-center px-5 py-6 sm:px-8 relative overflow-y-auto">
        <div className={`w-full max-w-[420px] p-6 sm:p-8 rounded-3xl border backdrop-blur-2xl transition-all duration-500 shadow-2xl ${isDark ? 'bg-[#0f0f16]/40 border-white/[0.04] shadow-black/40' : 'bg-white/90 border-slate-200/50 shadow-slate-100'}`}>

          <div className="space-y-1 mb-6">
            <h2 className="text-2xl font-extrabold tracking-tight">Tạo tài khoản 🚀</h2>
            <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>Điền thông tin để bắt đầu hành trình</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400 font-medium">
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className={labelCls} htmlFor="fullName">Họ và tên</label>
              <input id="fullName" placeholder="Nguyễn Văn A" {...register('fullName')} className={inputCls} />
              {errors.fullName && <p className="text-xs text-rose-500 font-semibold">{errors.fullName.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className={labelCls} htmlFor="reg-email">Email</label>
              <input id="reg-email" type="email" placeholder="name@example.com" {...register('email')} className={inputCls} />
              {errors.email && <p className="text-xs text-rose-500 font-semibold">{errors.email.message}</p>}
            </div>

            {/* Phone + Gender */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className={labelCls} htmlFor="phoneNumber">Số điện thoại</label>
                <input id="phoneNumber" placeholder="0987654321" {...register('phoneNumber')} className={inputCls} />
                {errors.phoneNumber && <p className="text-xs text-rose-500 font-semibold">{errors.phoneNumber.message}</p>}
              </div>
              <div className="space-y-1.5">
                <label className={labelCls} htmlFor="gender">Giới tính</label>
                <select id="gender" {...register('gender', { valueAsNumber: true })}
                  className={`${inputCls} cursor-pointer`}>
                  <option value={0}>Nam</option>
                  <option value={1}>Nữ</option>
                  <option value={2}>Khác</option>
                </select>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className={labelCls} htmlFor="reg-password">Mật khẩu</label>
              <div className="relative">
                <input id="reg-password" type={showPass ? 'text' : 'password'} placeholder="Tối thiểu 6 ký tự"
                  {...register('password')} className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}>
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-rose-500 font-semibold">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className={labelCls} htmlFor="confirmPassword">Xác nhận mật khẩu</label>
              <div className="relative">
                <input id="confirmPassword" type={showConfirm ? 'text' : 'password'} placeholder="Nhập lại mật khẩu"
                  {...register('confirmPassword')} className={`${inputCls} pr-11`} />
                <button type="button" onClick={() => setShowConfirm(v => !v)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${isDark ? 'text-zinc-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'}`}>
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-xs text-rose-500 font-semibold">{errors.confirmPassword.message}</p>}
            </div>

            <button type="submit" disabled={isLoading}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-60 mt-1">
              {isLoading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang tạo tài khoản...</>
                : <>Đăng Ký Ngay <ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Đã có tài khoản?{' '}
            <Link to="/login" className="font-bold text-primary hover:opacity-85 transition-opacity">Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
