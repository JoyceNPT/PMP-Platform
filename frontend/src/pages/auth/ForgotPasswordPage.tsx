import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Loader2, Mail, ArrowLeft, CheckCircle2, Sun, Moon, KeyRound } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';

export function ForgotPasswordPage() {
  const [email, setEmail]         = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent]       = useState(false);
  const [error, setError]         = useState('');
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await authService.forgotPassword(email);
      if (res.succeeded) {
        setIsSent(true);
      } else {
        setError(res.message || 'Không thể gửi yêu cầu đặt lại mật khẩu.');
      }
    } catch {
      setError('Đã xảy ra lỗi, vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden relative transition-colors duration-500 ${isDark ? 'bg-[#09090b] text-white' : 'bg-slate-50 text-slate-900'}`}>

      {/* Background glows */}
      <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] pointer-events-none ${isDark ? 'bg-primary/10 opacity-70' : 'bg-primary/5 opacity-50'}`} />
      <div className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[140px] pointer-events-none ${isDark ? 'bg-accent/10 opacity-70' : 'bg-accent/5 opacity-50'}`} />

      {/* Theme Toggle */}
      <div className="absolute top-6 right-6 z-50">
        <Button variant="outline" size="icon"
          className="rounded-full shadow-md bg-background/80 border-border/40 backdrop-blur-md hover:scale-105 active:scale-95 transition-all"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}>
          {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-violet-600" />}
        </Button>
      </div>

      {/* Centered content */}
      <div className="flex flex-1 items-center justify-center px-5 py-8 overflow-y-auto">
        <div className="w-full max-w-[420px] space-y-6">

          {/* Logo & Brand */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Logo size={30} />
            </div>
            <span className="font-black tracking-tight text-xl">PMP Platform</span>
          </div>

          {/* Card */}
          <div className={`p-7 sm:p-8 rounded-3xl border backdrop-blur-2xl shadow-2xl transition-all duration-500 ${isDark ? 'bg-[#0f0f16]/40 border-white/[0.04] shadow-black/40' : 'bg-white/90 border-slate-200/50 shadow-slate-100'}`}>

            {isSent ? (
              /* ─── Success State ─── */
              <div className="flex flex-col items-center text-center space-y-5 py-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold tracking-tight">Đã gửi email! 📬</h3>
                  <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Vui lòng kiểm tra hộp thư <span className="font-bold text-primary">{email}</span> và làm theo hướng dẫn đặt lại mật khẩu.
                  </p>
                  <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-slate-400'}`}>Không thấy email? Kiểm tra thư mục Spam.</p>
                </div>
                <Link to="/login"
                  className="flex items-center gap-2 text-sm font-bold text-primary hover:opacity-80 transition-opacity">
                  <ArrowLeft className="h-4 w-4" /> Trở lại đăng nhập
                </Link>
              </div>
            ) : (
              /* ─── Form State ─── */
              <>
                <div className="space-y-1 mb-6">
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${isDark ? 'bg-primary/10 border border-primary/20' : 'bg-primary/5 border border-primary/10'}`}>
                    <KeyRound className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight">Quên mật khẩu?</h2>
                  <p className={`text-sm ${isDark ? 'text-zinc-400' : 'text-slate-500'}`}>
                    Nhập email đăng ký — chúng tôi sẽ gửi liên kết đặt lại ngay.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-400 font-medium">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-slate-500'}`} htmlFor="fp-email">
                      Email đăng ký
                    </label>
                    <div className="relative">
                      <Mail className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? 'text-zinc-600' : 'text-slate-400'}`} />
                      <input
                        id="fp-email"
                        type="email"
                        placeholder="name@example.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className={`flex h-11 w-full rounded-xl border pl-10 pr-4 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20 ${isDark ? 'border-white/[0.08] bg-white/[0.02] text-white placeholder:text-zinc-600 focus:border-primary/50' : 'border-slate-200 bg-slate-50/50 text-slate-900 placeholder:text-slate-400 focus:border-primary/50'}`}
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all duration-300 active:scale-[0.98] disabled:opacity-60">
                    {isLoading
                      ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang gửi...</>
                      : 'Gửi liên kết đặt lại mật khẩu'}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <Link to="/login"
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}>
                    <ArrowLeft className="h-4 w-4" /> Trở lại đăng nhập
                  </Link>
                </div>
              </>
            )}
          </div>

          <p className={`text-center text-xs ${isDark ? 'text-zinc-700' : 'text-slate-400'}`}>
            © 2026 PMP Platform Corp. · Bảo mật dữ liệu của bạn là ưu tiên hàng đầu.
          </p>
        </div>
      </div>
    </div>
  );
}
