import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { gpaService, type Course } from '@/services/gpa/gpaService';
import { Pencil, Trash2, Plus, Check, X } from 'lucide-react';
import { ConfirmModal } from '@/components/shared/ConfirmModal';

interface Props {
  semesterId: string;
  courses: Course[];
  onRefresh: () => void;
}

interface Form {
  courseCode: string;
  courseName: string;
  credits: number;
  score: number | null;
}

const EMPTY_FORM: Form = { courseCode: '', courseName: '', credits: 3, score: 0 };

export function CourseTable({ semesterId, courses, onRefresh }: Props) {
  const [adding, setAdding]     = useState(false);
  const [editId, setEditId]     = useState<string | null>(null);
  const [form, setForm]         = useState<Form>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<Form>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [showDel, setShowDel]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!form.courseName) {
      toast.error('Vui lòng nhập tên môn học');
      return;
    }
    setSubmitting(true);
    try {
      await gpaService.createCourse({ semesterId, ...form });
      toast.success('Đã thêm môn học');
      setForm(EMPTY_FORM);
      setAdding(false);
      onRefresh();
    } catch (err) {
      toast.error('Lỗi khi thêm môn học');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (courseId: string) => {
    setSubmitting(true);
    try {
      await gpaService.updateCourse(courseId, editForm);
      toast.success('Đã cập nhật môn học');
      setEditId(null);
      onRefresh();
    } catch (err) {
      toast.error('Lỗi khi cập nhật');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    try {
      await gpaService.deleteCourse(courseId);
      toast.success('Đã xoá môn học');
      onRefresh();
    } catch (err) {
      toast.error('Lỗi khi xoá môn học');
    }
  };

  const startEdit = (c: Course) => {
    setEditId(c.id);
    setEditForm({ courseCode: c.courseCode, courseName: c.courseName, credits: c.credits, score: c.score });
  };

  return (
    <div className="mt-2">
      <div className="overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm table-fixed">
          <thead>
            <tr className="border-b bg-muted/40 text-muted-foreground text-[10px] uppercase tracking-wider">
              <th className="w-[15%] px-4 py-2 text-left font-bold">Mã môn</th>
              <th className="w-[35%] px-4 py-2 text-left font-bold">Tên môn học</th>
              <th className="w-[10%] px-4 py-2 text-center font-bold">TC</th>
              <th className="w-[15%] px-4 py-2 text-center font-bold">Điểm</th>
              <th className="w-[15%] px-4 py-2 text-center font-bold">Xếp loại</th>
              <th className="w-[10%] px-4 py-2 text-center font-bold"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {courses.map(c => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                {editId === c.id ? (
                  <>
                    <td className="px-3 py-1.5"><input value={editForm.courseCode} onChange={e => setEditForm(f => ({...f, courseCode: e.target.value}))} className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs" /></td>
                    <td className="px-3 py-1.5"><input value={editForm.courseName} onChange={e => setEditForm(f => ({...f, courseName: e.target.value}))} className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs" /></td>
                    <td className="px-3 py-1.5"><input type="number" min={1} max={10} value={editForm.credits} onChange={e => setEditForm(f => ({...f, credits: +e.target.value}))} className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-center" /></td>
                    <td className="px-3 py-1.5">
                      <div className="flex flex-col gap-1">
                        <input 
                          type="number" 
                          disabled={editForm.score === null}
                          min={0} max={10} step={0.25} 
                          value={editForm.score ?? ''} 
                          onChange={e => setEditForm(f => ({...f, score: e.target.value === '' ? null : +e.target.value}))} 
                          className="w-full h-8 rounded-md border border-input bg-background px-2 text-xs text-center" 
                        />
                        <button 
                          onClick={() => setEditForm(f => ({...f, score: f.score === null ? 0 : null}))}
                          className={`text-[9px] font-bold py-0.5 rounded ${editForm.score === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                        >
                          {editForm.score === null ? 'Đã bỏ tính GPA' : 'Bỏ tính GPA'}
                        </button>
                      </div>
                    </td>
                    <td />
                    <td className="px-3 py-1.5">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => handleUpdate(c.id)} disabled={submitting} className="h-7 w-7 rounded-md bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition"><Check className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setEditId(null)} className="h-7 w-7 rounded-md bg-muted flex items-center justify-center hover:bg-muted/70 transition"><X className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground truncate">{c.courseCode}</td>
                    <td className="px-4 py-2.5 font-medium truncate">{c.courseName}</td>
                    <td className="px-4 py-2.5 text-center">{c.credits}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`font-bold ${c.score === null ? 'text-muted-foreground italic text-xs' : ''}`}>
                        {c.score !== null ? c.score.toFixed(2) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <GradeChip grade={c.gradeLabel} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 justify-center">
                        <button onClick={() => startEdit(c)} className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 flex items-center justify-center transition"><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => { setDeleteTarget(c.id); setShowDel(true); }} className="h-7 w-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}

            {/* Add row */}
            {adding && (
              <tr className="bg-primary/5">
                <td className="px-3 py-1.5"><input autoFocus value={form.courseCode} onChange={e => setForm(f => ({...f, courseCode: e.target.value}))} placeholder="CS101" className="w-full h-8 rounded-md border border-primary/40 bg-background px-2 text-xs" /></td>
                <td className="px-3 py-1.5"><input value={form.courseName} onChange={e => setForm(f => ({...f, courseName: e.target.value}))} placeholder="Tên môn học..." className="w-full h-8 rounded-md border border-primary/40 bg-background px-2 text-xs" /></td>
                <td className="px-3 py-1.5"><input type="number" min={1} max={10} value={form.credits} onChange={e => setForm(f => ({...f, credits: +e.target.value}))} className="w-full h-8 rounded-md border border-primary/40 bg-background px-2 text-xs text-center" /></td>
                <td className="px-3 py-1.5">
                   <div className="flex flex-col gap-1">
                    <input 
                      type="number" 
                      disabled={form.score === null}
                      min={0} max={10} step={0.25} 
                      value={form.score ?? ''} 
                      onChange={e => setForm(f => ({...f, score: e.target.value === '' ? null : +e.target.value}))} 
                      className="w-full h-8 rounded-md border border-primary/40 bg-background px-2 text-xs text-center" 
                    />
                    <button 
                      onClick={() => setForm(f => ({...f, score: f.score === null ? 0 : null}))}
                      className={`text-[9px] font-bold py-0.5 rounded ${form.score === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                    >
                      {form.score === null ? 'Đã bỏ tính GPA' : 'Bỏ tính GPA'}
                    </button>
                  </div>
                </td>
                <td />
                <td className="px-3 py-1.5">
                  <div className="flex gap-1 justify-center">
                    <button onClick={handleAdd} disabled={submitting} className="h-7 w-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition"><Check className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setAdding(false)} className="h-7 w-7 rounded-md bg-muted flex items-center justify-center transition"><X className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {!adding && (
        <button onClick={() => setAdding(true)} className="mt-2 flex items-center gap-1.5 text-xs text-primary hover:underline px-1 font-semibold">
          <Plus className="h-3.5 w-3.5" /> Thêm môn học mới
        </button>
      )}

      <ConfirmModal
        isOpen={showDel}
        onClose={() => { setShowDel(false); setDeleteTarget(null); }}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        title="Xoá môn học?"
        description="Bạn có chắc chắn muốn xoá môn học này khỏi bảng điểm?"
      />
    </div>
  );
}

function GradeChip({ grade }: { grade: string }) {
  if (grade === '-') return null;
  const colors: Record<string, string> = {
    'A+': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'A':  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    'B+': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'B':  'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    'C+': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'C':  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    'D+': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'D':  'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    'F':  'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };
  return (
    <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-bold ${colors[grade] ?? 'bg-muted text-muted-foreground'}`}>
      {grade}
    </span>
  );
}
