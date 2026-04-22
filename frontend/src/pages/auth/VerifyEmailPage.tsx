import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { authService } from '@/services/authService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Đang xác thực email của bạn...');

  useEffect(() => {
    const email = searchParams.get('email');
    const token = searchParams.get('token');

    if (email && token) {
      authService.verifyEmail(email, token)
        .then(res => {
          if (res.succeeded) {
            setStatus('success');
            setMessage('Email của bạn đã được xác thực thành công!');
            setTimeout(() => navigate('/login'), 3000);
          } else {
            setStatus('error');
            setMessage(res.message || 'Xác thực thất bại. Token có thể đã hết hạn.');
          }
        })
        .catch(() => {
          setStatus('error');
          setMessage('Đã xảy ra lỗi trong quá trình xác thực.');
        });
    } else {
      setStatus('error');
      setMessage('Thông tin xác thực không hợp lệ.');
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-6">
      <Card className="w-full max-w-md shadow-xl text-center">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Xác thực Email</CardTitle>
        </CardHeader>
        <CardContent className="py-6 space-y-4">
          {status === 'loading' && <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />}
          {status === 'success' && <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />}
          {status === 'error' && <XCircle className="w-12 h-12 mx-auto text-destructive" />}
          
          <p className="text-muted-foreground">{message}</p>
          
          {status !== 'loading' && (
            <Link to="/login" className="inline-block text-primary hover:underline font-medium pt-4">
              Quay lại đăng nhập
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
