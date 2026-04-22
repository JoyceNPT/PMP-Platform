import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

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
        setError(res.message || 'Không thể gửi yêu cầu reset mật khẩu.');
      }
    } catch (err: any) {
      setError('Đã xảy ra lỗi, vui lòng thử lại sau.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 text-primary font-bold mb-2">
             <ArrowLeft className="w-4 h-4 cursor-pointer" onClick={() => window.history.back()} />
             <span>Quên mật khẩu</span>
          </div>
          <CardTitle className="text-2xl">Lấy lại mật khẩu</CardTitle>
          <CardDescription>
            Chúng tôi sẽ gửi một liên kết đặt lại mật khẩu đến email của bạn.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isSent ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4 animate-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-lg">Đã gửi email thành công!</h3>
                <p className="text-sm text-muted-foreground">
                  Vui lòng kiểm tra hộp thư <b>{email}</b> và làm theo hướng dẫn.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email đăng ký</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="name@example.com" 
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Gửi liên kết đặt lại mật khẩu
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter>
          <Link to="/login" className="text-sm text-primary hover:underline flex items-center gap-1 mx-auto">
            Trở lại đăng nhập
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
