import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { dashboardService, type DashboardOverview } from '@/services/dashboardService';
import { 
  GraduationCap, TrendingUp, TrendingDown, 
  Target, ArrowRight, Loader2,
  Calendar, Zap, Award, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="max-w-7xl mx-auto space-y-12 pb-12"
    >
      {/* ── Premium Hero Section ── */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-background to-accent/10 border p-8 md:p-12 lg:p-16">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border-primary/20 text-primary text-xs font-bold uppercase tracking-widest"
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              <span>Thế hệ tương lai</span>
            </motion.div>
            
            <h1 className="text-5xl md:text-6xl font-black tracking-tight leading-[1.05]">
              Chào buổi tối, <br />
              <span className="gradient-text">{user?.fullName.split(' ').pop()}!</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
              Bạn đã hoàn thành <span className="text-foreground font-bold">{data?.completedRoadmapNodes} mục tiêu</span> trong tuần này. Tiếp tục duy trì phong độ nhé!
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link to="/roadmap" className="h-14 px-8 rounded-2xl bg-primary text-white font-bold flex items-center gap-3 hover-float glow-primary transition-all">
                Khám phá lộ trình <ArrowRight className="h-5 w-5" />
              </Link>
              <Link to="/finance" className="h-14 px-8 rounded-2xl glass font-bold flex items-center hover:bg-white/5 transition-all">
                Quản lý tài chính
              </Link>
            </div>
          </div>

          {/* Large Stat Card */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="glass rounded-[3rem] p-10 border-primary/20 relative group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mb-2">
                <GraduationCap className="h-10 w-10 text-primary" />
              </div>
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">GPA Hiện tại</p>
              <h2 className="text-8xl font-black tracking-tighter">
                {data?.currentGpa.toFixed(2) || '0.00'}
              </h2>
              <div className="px-6 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-sm font-bold border border-emerald-500/20">
                Xếp loại: {data?.gpaRanking}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── Interactive Stats Grid ── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard 
          icon={TrendingUp} 
          label="Thu nhập tháng" 
          value={`${(data?.monthlyIncome || 0).toLocaleString()}đ`} 
          desc="Tăng 12% so với tháng trước"
          color="text-emerald-500"
        />
        <StatCard 
          icon={TrendingDown} 
          label="Chi tiêu tháng" 
          value={`${(data?.monthlyExpense || 0).toLocaleString()}đ`} 
          desc="Đã sử dụng 65% ngân sách"
          color="text-rose-500"
        />
        <StatCard 
          icon={Target} 
          label="Tiến độ mục tiêu" 
          value={`${data?.savingsProgress}%`} 
          desc="Còn 1.5M nữa là hoàn thành"
          color="text-primary"
          progress={data?.savingsProgress}
        />
      </div>

      {/* ── Bottom Section ── */}
      <div className="grid lg:grid-cols-2 gap-8">
        <motion.section variants={itemVariants} className="glass rounded-[2.5rem] p-10 space-y-8 border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Award className="h-6 w-6 text-primary" />
              Thành tựu gần đây
            </h2>
            <Link to="/gpa" className="text-sm font-bold text-primary hover:underline">Tất cả</Link>
          </div>
          
          <div className="space-y-4">
             {[
               { title: 'Hoàn thành học kỳ 2', date: '2 ngày trước', icon: Zap, color: 'bg-violet-500' },
               { title: 'Đạt mục tiêu tiết kiệm', date: '5 ngày trước', icon: Target, color: 'bg-emerald-500' }
             ].map((item, idx) => (
               <div key={idx} className="flex items-center gap-5 p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-primary/20 transition-all cursor-pointer group">
                 <div className={`h-12 w-12 rounded-2xl ${item.color} flex items-center justify-center text-white shadow-lg shadow-inherit/20 group-hover:scale-110 transition-transform`}>
                   <item.icon className="h-6 w-6" />
                 </div>
                 <div>
                   <p className="font-bold">{item.title}</p>
                   <p className="text-xs text-muted-foreground">{item.date}</p>
                 </div>
               </div>
             ))}
          </div>
        </motion.section>

        <motion.section variants={itemVariants} className="glass rounded-[2.5rem] p-10 space-y-8 border-white/5">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Calendar className="h-6 w-6 text-accent" />
              Nhắc nhở học tập
            </h2>
          </div>
          
          <div className="space-y-4">
             {[
               { title: 'Bài tập React Native', time: '14:00 - Mai', type: 'roadmap' },
               { title: 'Kiểm tra Tài chính', time: '09:00 - Thứ 6', type: 'finance' }
             ].map((item, idx) => (
               <div key={idx} className="flex items-center justify-between p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-accent/20 transition-all cursor-pointer">
                 <div className="flex items-center gap-5">
                   <div className="w-1.5 h-10 rounded-full bg-accent" />
                   <div>
                     <p className="font-bold">{item.title}</p>
                     <p className="text-xs text-muted-foreground">{item.time}</p>
                   </div>
                 </div>
                 <button className="h-10 w-10 rounded-full glass flex items-center justify-center hover:bg-primary hover:text-white transition-all">
                   <ArrowRight className="h-4 w-4" />
                 </button>
               </div>
             ))}
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, desc, color, progress }: any) {
  return (
    <motion.div 
      variants={{
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
      }}
      whileHover={{ y: -8 }}
      className="glass rounded-[2.5rem] p-8 border-white/5 group relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className={`h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center ${color}`}>
            <Icon className="h-6 w-6" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Stats</p>
        </div>
        
        <div>
          <p className="text-sm font-bold text-muted-foreground mb-1">{label}</p>
          <h3 className="text-3xl font-black tracking-tight">{value}</h3>
        </div>

        {progress !== undefined ? (
          <div className="space-y-2">
            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`h-full rounded-full bg-gradient-to-r from-primary to-accent shadow-[0_0_10px_rgba(139,92,246,0.3)]`}
              />
            </div>
            <p className="text-[10px] text-right font-bold text-primary">{progress}% hoàn thành</p>
          </div>
        ) : (
          <p className="text-xs font-medium text-muted-foreground/80 flex items-center gap-1">
            <span className={color}>↑</span> {desc}
          </p>
        )}
      </div>
    </motion.div>
  );
}
