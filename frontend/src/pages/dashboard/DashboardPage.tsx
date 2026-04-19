import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { dashboardService, type DashboardOverview } from '@/services/dashboardService';
import { 
  GraduationCap, TrendingUp, TrendingDown, 
  Target, ArrowRight, Loader2,
  Calendar, Zap, Award
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getOverview()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const stats = [
    { 
      label: 'GPA hiện tại', 
      value: data?.currentGpa.toFixed(2) || '0.00', 
      desc: data?.gpaRanking || 'N/A', 
      icon: GraduationCap, 
      color: 'bg-violet-500',
      link: '/gpa'
    },
    { 
      label: 'Thu nhập tháng', 
      value: `${(data?.monthlyIncome || 0).toLocaleString()}đ`, 
      desc: 'Tháng này', 
      icon: TrendingUp, 
      color: 'bg-emerald-500',
      link: '/finance'
    },
    { 
      label: 'Chi tiêu tháng', 
      value: `${(data?.monthlyExpense || 0).toLocaleString()}đ`, 
      desc: 'Tháng này', 
      icon: TrendingDown, 
      color: 'bg-rose-500',
      link: '/finance'
    },
    { 
      label: 'Lộ trình nghề nghiệp', 
      value: `${data?.completedRoadmapNodes}/${data?.totalRoadmapNodes}`, 
      desc: 'Kỹ năng hoàn thành', 
      icon: Target, 
      color: 'bg-amber-500',
      link: '/roadmap'
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chào buổi tối, {user?.fullName.split(' ').pop()}! 👋</h1>
          <p className="text-muted-foreground mt-1">Hôm nay là {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-2xl text-sm font-bold">
          <Zap className="h-4 w-4 fill-primary" />
          <span>Học tập chăm chỉ nhé!</span>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.link} className="group relative bg-card p-6 rounded-3xl border border-border/50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <div className={`absolute -top-3 -right-3 h-12 w-12 ${stat.color} rounded-2xl flex items-center justify-center text-white shadow-lg shadow-inherit/20 group-hover:scale-110 transition-transform`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
            <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              {stat.desc}
            </p>
          </Link>
        ))}
      </div>

      {/* Main Sections */}
      <div className="grid gap-6 lg:grid-cols-7">
        
        {/* Progress Summary */}
        <div className="lg:col-span-4 bg-card rounded-3xl border p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Tiến độ mục tiêu
            </h2>
            <Link to="/finance" className="text-xs text-primary font-bold hover:underline">Chi tiết</Link>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-sm font-medium">Tiết kiệm mục tiêu</span>
              <span className="text-2xl font-black text-primary">{data?.savingsProgress}%</span>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-1000 ease-out rounded-full" 
                style={{ width: `${data?.savingsProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground italic">Bạn đang tiến gần hơn đến mục tiêu tiết kiệm rồi đó!</p>
          </div>

          <div className="pt-6 grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-2xl border border-dashed">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Kỹ năng đạt được</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold">{data?.completedRoadmapNodes}</span>
                <span className="text-xs text-muted-foreground">kỹ năng</span>
              </div>
            </div>
            <div className="p-4 bg-muted/30 rounded-2xl border border-dashed">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">GPA Xếp loại</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold">{data?.gpaRanking}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Schedule / Reminders Placeholder */}
        <div className="lg:col-span-3 bg-card rounded-3xl border p-8 space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Nhắc nhở
          </h2>
          <div className="space-y-4">
            {[{ title: 'Kiến thức nền tảng', time: 'Ngày mai', type: 'gpa' },
              { title: 'Đóng tiền điện', time: 'Trong 3 ngày', type: 'finance' },
              { title: 'Học React Query', time: 'Tối nay', type: 'roadmap' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                  item.type === 'gpa' ? 'bg-violet-100 text-violet-600' : 
                  item.type === 'finance' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
                }`}>
                  <Zap className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{item.title}</p>
                  <p className="text-[10px] text-muted-foreground">{item.time}</p>
                </div>
                <button className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted">
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
