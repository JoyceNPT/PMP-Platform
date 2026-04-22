import { useState, useEffect } from 'react';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Briefcase, Building, DollarSign, Camera } from 'lucide-react';

export function SettingsPage() {
  const { user, setAuth } = useAuthStore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    nickname: '',
    phoneNumber: '',
    job: '',
    company: '',
    salary: 0,
    avatarUrl: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await authService.getProfile();
      if (res.succeeded) {
        setProfile(res.data);
        setFormData({
          fullName: res.data.fullName || '',
          nickname: res.data.nickname || '',
          phoneNumber: res.data.phoneNumber || '',
          job: res.data.job || '',
          company: res.data.company || '',
          salary: res.data.salary || 0,
          avatarUrl: res.data.avatarUrl || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile', error);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await authService.updateProfile(formData);
      if (res.succeeded) {
        toast({ title: 'Thành công', description: 'Đã cập nhật thông tin cá nhân.' });
        // Update local store if needed
        if (user) {
          setAuth(
            { ...user, fullName: formData.fullName, avatarUrl: formData.avatarUrl }, 
            useAuthStore.getState().accessToken!
          );
        }
      } else {
        toast({ title: 'Lỗi', description: res.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Lỗi', description: 'Không thể cập nhật hồ sơ.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="container max-w-4xl py-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Cài đặt tài khoản</h1>
        <p className="text-muted-foreground">Quản lý thông tin cá nhân và tùy chỉnh trải nghiệm của bạn.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[250px_1fr]">
        <aside className="flex flex-col gap-2">
          <Button variant="ghost" className="justify-start font-semibold bg-accent">Hồ sơ cá nhân</Button>
          <Button variant="ghost" className="justify-start text-muted-foreground">Bảo mật</Button>
          <Button variant="ghost" className="justify-start text-muted-foreground">Thông báo</Button>
          <Button variant="ghost" className="justify-start text-muted-foreground">Giao diện</Button>
        </aside>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ảnh đại diện</CardTitle>
              <CardDescription>Cập nhật ảnh hiển thị của bạn trên hệ thống.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-6">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-primary/20 transition-all group-hover:border-primary/50">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="flex-1 space-y-2">
                <Label>Đường dẫn ảnh (URL)</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="https://example.com/avatar.jpg" 
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                  />
                  <Button variant="outline" size="sm">Sử dụng Gravatar</Button>
                </div>
                <p className="text-[10px] text-muted-foreground italic">* Tính năng tải ảnh từ máy tính đang được phát triển.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
              <CardDescription>Thông tin này sẽ được hiển thị công khai.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdate} className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><User className="w-3 h-3" /> Họ và tên</Label>
                  <Input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><User className="w-3 h-3" /> Biệt danh</Label>
                  <Input value={formData.nickname} onChange={e => setFormData({...formData, nickname: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Mail className="w-3 h-3" /> Email</Label>
                  <Input value={profile.email} disabled className="bg-muted/50" />
                  {profile.isEmailVerified ? (
                    <span className="text-[10px] text-green-500 font-medium">✓ Đã xác thực</span>
                  ) : (
                    <span className="text-[10px] text-amber-500 font-medium">! Chưa xác thực</span>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Briefcase className="w-3 h-3" /> Nghề nghiệp</Label>
                  <Input value={formData.job} onChange={e => setFormData({...formData, job: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><Building className="w-3 h-3" /> Công ty</Label>
                  <Input value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><DollarSign className="w-3 h-3" /> Lương dự kiến</Label>
                  <Input type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: parseFloat(e.target.value)})} />
                </div>
                
                <div className="sm:col-span-2 pt-4">
                  <Button type="submit" disabled={isLoading} className="w-full sm:w-auto min-w-[120px]">
                    {isLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                    Lưu thay đổi
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
