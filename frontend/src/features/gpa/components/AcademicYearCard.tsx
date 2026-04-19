import { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';
import { type AcademicYear, type Semester, gpaService } from '@/services/gpa/gpaService';
import { CourseTable } from './CourseTable';

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
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

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

  const handleAddSem = async () => {
    await gpaService.createSemester(year.id, semType);
    setAddingSem(false);
    onRefresh();
  };

  const handleDeleteYear = async () => {
    if (!confirm(`Xoá năm học "${year.yearName}"? Toàn bộ dữ liệu học kỳ và môn học sẽ bị xoá.`)) return;
    await gpaService.deleteYear(year.id);
    onRefresh();
  };

  return (
    <div className="rounded-2xl border bg-card/50 shadow-sm">
      {/* Year header */}
      <div className="flex items-center justify-between px-5 py-4 border-b">
        <button onClick={() => setOpen(o => !o)} className="flex items-center gap-3 flex-1 text-left">
          <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary font-bold text-sm">
            {year.yearOrder}
          </div>
          <div>
            <p className="font-semibold text-sm">Năm {year.yearOrder} — {year.yearName}</p>
            <p className="text-xs text-muted-foreground">{year.semesters.length} học kỳ</p>
          </div>
          <div className="ml-2">{open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}</div>
        </button>
        <button onClick={handleDeleteYear} className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition">
          <Trash2 className="h-4 w-4" />
        </button>
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
