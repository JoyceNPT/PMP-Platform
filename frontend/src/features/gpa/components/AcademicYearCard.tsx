import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';
import { type AcademicYear, type Semester, gpaService } from '@/services/gpa/gpaService';
import { CourseTable } from './CourseTable';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

const SEMESTER_OPTIONS = [
  { value: 0, label: 'Học kỳ 1 (Spring)' },
  { value: 2, label: 'Học kỳ 2 (Summer)' },
  { value: 4, label: 'Học kỳ 3 (Fall)' },
  { value: 1, label: 'HK 1 — 3 tuần' },
  { value: 3, label: 'HK 2 — 3 tuần' },
  { value: 5, label: 'HK 3 — 3 tuần' },
];

function SemesterCard({ sem, onRefresh }: { sem: Semester; onRefresh: () => void }) {
  const [open, setOpen] = useState(true);
  const [showDel, setShowDel] = useState(false);
  const gpaColor = sem.semesterGpa >= 8 ? 'text-emerald-500' : sem.semesterGpa >= 5 ? 'text-blue-500' : 'text-red-500';

  return (
    <div className="rounded-xl border bg-card">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold text-sm">{sem.semesterLabel}</span>
          <span className="text-xs text-muted-foreground">{sem.courses.length} môn · {sem.totalCredits} TC</span>
          <span className={`text-xs font-semibold ${gpaColor}`}>GPA {sem.semesterGpa.toFixed(2)}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{sem.ranking}</span>
        </div>
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button 
            onClick={() => setShowDel(true)}
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      <ConfirmModal
        isOpen={showDel}
        onClose={() => setShowDel(false)}
        onConfirm={async () => {
          await gpaService.deleteSemester(sem.id);
          toast.success('Đã xoá học kỳ');
          onRefresh();
        }}
        title="Xoá học kỳ?"
        description={`Bạn có chắc chắn muốn xoá ${sem.semesterLabel}? Tất cả điểm số bên trong sẽ bị xoá.`}
      />

      {open && (
        <div className="border-t px-5 pb-4 pt-3">
          <CourseTable semesterId={sem.id} courses={sem.courses} onRefresh={onRefresh} />
        </div>
      )}
    </div>
  );
}

interface Props {
  year: AcademicYear;
  onRefresh: () => void;
}

export function AcademicYearCard({ year, onRefresh }: Props) {
  const [open, setOpen]           = useState(true);
  const [addingSem, setAddingSem] = useState(false);
  const [semType, setSemType]     = useState(0);
  const [showDelYear, setShowDelYear] = useState(false);
  
  // Edit Year State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName]   = useState(year.yearName);
  const [editOrder, setEditOrder] = useState(year.yearOrder);
  const [updating, setUpdating]   = useState(false);

  const handleUpdateYear = async () => {
    if (!editName) return;
    setUpdating(true);
    try {
      await gpaService.updateYear(year.id, editName, editOrder);
      toast.success('Đã cập nhật năm học');
      setIsEditing(false);
      onRefresh();
    } catch (err) {
      toast.error('Không thể cập nhật năm học');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddSem = async () => {
    try {
      await gpaService.createSemester(year.id, semType);
      toast.success('Đã thêm học kỳ');
      setAddingSem(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi thêm học kỳ');
    }
  };

  const handleDeleteYear = async () => {
    const loadingToast = toast.loading('Đang xoá năm học...');
    try {
      await gpaService.deleteYear(year.id);
      toast.success('Đã xoá năm học và dữ liệu liên quan', { id: loadingToast });
      onRefresh();
    } catch (err) {
      toast.error('Lỗi khi xoá năm học', { id: loadingToast });
    }
  };

  // Color theme based on year order
  const getYearColor = (order: number) => {
    const colors = [
      'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500'
    ];
    return colors[(Math.max(1, order) - 1) % colors.length];
  };

  return (
    <div className="rounded-2xl border bg-card/50 shadow-sm overflow-hidden">
      {/* Accent color bar */}
      <div className={`h-1.5 w-full ${getYearColor(isEditing ? editOrder : year.yearOrder)} opacity-80`} />
      
      {/* Year header */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        {isEditing ? (
          <div className="flex items-end gap-3 flex-1 animate-fade-in">
            <div className="w-20 space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Năm thứ</label>
              <div className="h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                 <input 
                    type="number" 
                    value={editOrder} 
                    onChange={e => setEditOrder(parseInt(e.target.value) || 1)}
                    className="w-full bg-transparent text-center font-bold text-primary focus:outline-none"
                 />
              </div>
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">Tên năm học</label>
              <input 
                value={editName} 
                onChange={e => setEditName(e.target.value)}
                className="w-full h-10 bg-muted rounded-lg px-3 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="VD: 2024-2025"
                autoFocus
              />
            </div>
            <div className="flex gap-1.5 pb-0.5">
              <button onClick={handleUpdateYear} disabled={updating} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition shadow-sm shadow-primary/20">Lưu</button>
              <button onClick={() => setIsEditing(false)} className="h-9 px-3 rounded-lg bg-muted text-xs font-medium hover:bg-muted/80 transition">Huỷ</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 flex-1">
            <button onClick={() => setOpen(o => !o)} className="flex items-center gap-3 flex-1 text-left group">
              <div className={`w-10 h-10 rounded-xl ${getYearColor(year.yearOrder)} flex items-center justify-center text-white font-bold text-base shadow-sm group-hover:scale-105 transition-transform`}>
                {year.yearOrder}
              </div>
              <div>
                <p className="font-bold text-sm">Năm {year.yearOrder} — {year.yearName}</p>
                <p className="text-xs text-muted-foreground">{year.semesters.length} học kỳ hiện có</p>
              </div>
              <div className="ml-2">{open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}</div>
            </button>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsEditing(true)} 
                className="h-8 px-3 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition"
              >
                Chỉnh sửa
              </button>
              <button onClick={() => setShowDelYear(true)} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={showDelYear}
          onClose={() => setShowDelYear(false)}
          onConfirm={handleDeleteYear}
          title="Xoá năm học?"
          description={`Bạn có chắc muốn xoá "${year.yearName}"? Toàn bộ dữ liệu học kỳ và môn học sẽ bị xoá vĩnh viễn.`}
        />
      </div>

      {open && (
        <div className="p-4 space-y-3">
          {year.semesters.map(sem => (
            <SemesterCard key={sem.id} sem={sem} onRefresh={onRefresh} />
          ))}

          {addingSem ? (
            <div className="flex gap-2 items-center p-3 rounded-xl border border-primary/30 bg-primary/5">
              <select value={semType} onChange={e => setSemType(+e.target.value)}
                className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50">
                {SEMESTER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button onClick={handleAddSem} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition">Tạo</button>
              <button onClick={() => setAddingSem(false)} className="h-9 px-3 rounded-lg bg-muted text-sm hover:bg-muted/70 transition">Huỷ</button>
            </div>
          ) : (
            <button onClick={() => setAddingSem(true)}
              className="flex items-center gap-2 text-sm text-primary hover:underline px-1">
              <Plus className="h-4 w-4" /> Thêm học kỳ
            </button>
          )}
        </div>
      )}
    </div>
  );
}
