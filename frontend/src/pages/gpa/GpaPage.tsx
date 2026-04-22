import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useGpaSummary } from '@/features/gpa/components/useGpaSummary';
import { AcademicYearCard } from '@/features/gpa/components/AcademicYearCard';
import { gpaService } from '@/services/gpa/gpaService';
import {
  GraduationCap, Target, BookOpen, TrendingUp, Plus, Settings2, Loader2
} from 'lucide-react';

export function GpaPage() {
  const { summary, loading, error, refresh } = useGpaSummary();

  const [addingYear, setAddingYear]   = useState(false);
  const [yearName, setYearName]       = useState('');
  const [yearOrder, setYearOrder]     = useState(1);
  const [showConfig, setShowConfig]   = useState(false);
  const [cfgForm, setCfgForm]         = useState({ totalCourses: 0, totalCredits: 0, targetGpa: 8.0 });
  const [savingCfg, setSavingCfg]     = useState(false);

  const handleAddYear = async () => {
    if (!yearName) {
      toast.error('Vui lòng nhập tên năm học');
      return;
    }
    try {
      await gpaService.createYear(yearName, yearOrder);
      toast.success('Đã thêm năm học mới');
      setYearName('');
      setAddingYear(false);
      refresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể thêm năm học');
    }
  };

  const handleSaveConfig = async () => {
    setSavingCfg(true);
    try {
      await gpaService.upsertConfig(cfgForm);
      toast.success('Đã cập nhật cấu hình GPA');
      setShowConfig(false);
      refresh();
    } catch (err: any) {
      toast.error('Lỗi khi cập nhật cấu hình');
    } finally {
      setSavingCfg(false);
    }
  };

  const openConfig = () => {
    if (summary) {
      setCfgForm({
        totalCourses: summary.totalCourses,
        totalCredits: summary.totalCredits,
        targetGpa:    summary.targetGpa,
      });
    }
    setShowConfig(true);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center text-destructive text-sm">{error}</div>
    );
  }

  const gpaColor = (gpa: number) =>
    gpa >= 8 ? 'text-emerald-500' : gpa >= 5 ? 'text-blue-500' : 'text-red-500';

  const progressPct = summary && summary.totalCredits > 0
    ? Math.min(100, Math.round((summary.completedCredits / summary.totalCredits) * 100))
    : 0;

  return (
    <div className="space-y-6 relative">
      <div className="animate-fade-in-up space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Quản lý học tập</h1>
          <p className="page-subtitle">Theo dõi điểm số, tín chỉ và GPA tích lũy của bạn</p>
        </div>
        <button onClick={openConfig}
          className="flex items-center gap-2 h-9 px-4 rounded-xl border text-sm font-medium hover:bg-muted transition">
          <Settings2 className="h-4 w-4" /> Cấu hình
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<GraduationCap className="h-5 w-5" />}
          label="GPA tích lũy"
          value={summary?.currentGpa.toFixed(2) ?? '—'}
          sub={summary?.overallRanking ?? ''}
          color="from-violet-500 to-purple-600"
          valueClass={summary ? gpaColor(summary.currentGpa) : ''}
        />
        <StatCard
          icon={<Target className="h-5 w-5" />}
          label="Mục tiêu GPA"
          value={summary?.targetGpa.toFixed(2) ?? '—'}
          sub={summary && summary.neededScore > 0 ? `Cần đạt ${summary.neededScore.toFixed(2)}/kỳ` : 'Đã đạt mục tiêu 🎉'}
          color="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={<BookOpen className="h-5 w-5" />}
          label="Tín chỉ tích lũy"
          value={`${summary?.completedCredits ?? 0}/${summary?.totalCredits ?? 0}`}
          sub={`${progressPct}% hoàn thành`}
          color="from-orange-400 to-pink-500"
        />
        <StatCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Môn học"
          value={`${summary?.completedCourses ?? 0}/${summary?.totalCourses ?? 0}`}
          sub="môn đã hoàn thành"
          color="from-emerald-400 to-teal-500"
        />
      </div>

      {/* Progress bar */}
      <div className="bg-card rounded-xl border p-5 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Tiến độ chương trình học</span>
          <span className="text-primary font-bold">{progressPct}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {summary?.completedCredits} / {summary?.totalCredits} tín chỉ · {summary?.completedCourses} / {summary?.totalCourses} môn học
        </p>
      </div>


      {/* Academic Year list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">Chi tiết lộ trình học tập</h2>
          {!addingYear && (
            <button onClick={() => setAddingYear(true)}
              className="flex items-center gap-2 h-8 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition shadow shadow-primary/20">
              <Plus className="h-3.5 w-3.5" /> Thêm năm học
            </button>
          )}
        </div>

        {addingYear && (
          <div className="flex gap-2 items-end p-4 rounded-2xl border border-primary/30 bg-primary/5">
            <div className="flex-1 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Năm học</label>
              <input value={yearName} onChange={e => setYearName(e.target.value)}
                placeholder="VD: 2023-2024" autoFocus
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div className="w-24 space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Năm thứ</label>
              <input type="number" min={1} max={10} value={yearOrder} onChange={e => setYearOrder(parseInt(e.target.value) || 1)}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <button onClick={handleAddYear} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition">Tạo</button>
            <button onClick={() => setAddingYear(false)} className="h-9 px-3 rounded-lg bg-muted text-sm hover:bg-muted/70 transition">Huỷ</button>
          </div>
        )}

        {summary?.academicYears.length === 0 && !addingYear && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground space-y-3">
            <GraduationCap className="h-12 w-12 opacity-30" />
            <p className="font-medium">Chưa có dữ liệu học tập</p>
            <p className="text-sm">Thêm năm học đầu tiên để bắt đầu theo dõi GPA</p>
          </div>
        )}

        {summary?.academicYears.map(year => (
          <AcademicYearCard key={year.id} year={year} onRefresh={refresh} />
        ))}
      </div>
      </div>

      {/* Config modal (Outside the animated div to avoid fixed centering issues) */}
      {showConfig && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border bg-card shadow-xl p-6 space-y-5 animate-fade-in-up">
            <h3 className="font-bold text-lg">Cấu hình chương trình học</h3>
            {/* ... form content ... */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tổng số môn học (cả khoá)</label>
                <input type="number" min={0} value={cfgForm.totalCourses}
                  onChange={e => setCfgForm(f => ({...f, totalCourses: +e.target.value}))}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Tổng tín chỉ (cả khoá)</label>
                <input type="number" min={0} value={cfgForm.totalCredits}
                  onChange={e => setCfgForm(f => ({...f, totalCredits: +e.target.value}))}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">GPA mục tiêu</label>
                <input type="number" min={0} max={10} step={0.1} value={cfgForm.targetGpa}
                  onChange={e => setCfgForm(f => ({...f, targetGpa: +e.target.value}))}
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowConfig(false)} className="h-10 px-4 rounded-xl border text-sm hover:bg-muted transition">Huỷ</button>
              <button onClick={handleSaveConfig} disabled={savingCfg}
                className="h-10 px-5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition flex items-center gap-2 disabled:opacity-60">
                {savingCfg && <Loader2 className="h-4 w-4 animate-spin" />} Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color, valueClass = '' }: {
  icon: React.ReactNode; label: string; value: string;
  sub: string; color: string; valueClass?: string;
}) {
  return (
    <div className="stat-card space-y-2">
      <div className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-md`}>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${valueClass}`}>{value}</p>
      <p className="text-xs font-medium text-foreground/80">{label}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}
