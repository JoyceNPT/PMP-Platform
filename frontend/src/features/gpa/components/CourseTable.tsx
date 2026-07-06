import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { gpaService, type Course } from '@/services/gpa/gpaService';
import { ChevronDown, ChevronUp, Pencil, Trash2, Plus, Check, X } from 'lucide-react';
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
  const [openCourseIds, setOpenCourseIds] = useState<Set<string>>(new Set());

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

  const toggleCourse = (id: string) => {
    setOpenCourseIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="mt-2">
      <div className="space-y-2 md:hidden">
        {courses.map(c => {
          const isOpen = openCourseIds.has(c.id);
          const isEditing = editId === c.id;

          return (
            <div key={c.id} className="rounded-xl border bg-card">
              {isEditing ? (
                <div className="space-y-3 p-3">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input value={editForm.courseCode} onChange={e => setEditForm(f => ({...f, courseCode: e.target.value}))} placeholder="Mã môn" className="h-10 rounded-lg border border-input bg-background px-3 text-sm" />
                    <input value={editForm.courseName} onChange={e => setEditForm(f => ({...f, courseName: e.target.value}))} placeholder="Tên môn học" className="h-10 rounded-lg border border-input bg-background px-3 text-sm" />
                    <input type="number" min={1} max={10} value={editForm.credits} onChange={e => setEditForm(f => ({...f, credits: +e.target.value}))} className="h-10 rounded-lg border border-input bg-background px-3 text-sm" />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        disabled={editForm.score === null}
                        min={0}
                        max={10}
                        step={0.25}
                        value={editForm.score ?? ''}
                        onChange={e => setEditForm(f => ({...f, score: e.target.value === '' ? null : +e.target.value}))}
                        className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm"
                        placeholder="Điểm"
                      />
                      <button
                        type="button"
                        onClick={() => setEditForm(f => ({...f, score: f.score === null ? 0 : null}))}
                        className={`h-10 shrink-0 rounded-lg px-3 text-[11px] font-bold ${editForm.score === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                      >
                        Không GPA
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleUpdate(c.id)} disabled={submitting} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-bold text-white hover:bg-emerald-600">
                      <Check className="h-3.5 w-3.5" /> Lưu
                    </button>
                    <button onClick={() => setEditId(null)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-muted px-3 text-xs font-bold">
                      <X className="h-3.5 w-3.5" /> Huỷ
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => toggleCourse(c.id)}
                    className="flex w-full items-center justify-between gap-3 p-3 text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] font-semibold uppercase text-muted-foreground">{c.courseCode || 'Chưa có mã'}</p>
                      <p className="mt-0.5 whitespace-normal break-words text-sm font-bold text-foreground">{c.courseName}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <GradeChip grade={c.gradeLabel} />
                      {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t px-3 py-3">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-lg bg-muted/60 p-2">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Tín chỉ</p>
                          <p className="mt-1 text-sm font-bold">{c.credits}</p>
                        </div>
                        <div className="rounded-lg bg-muted/60 p-2">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Điểm</p>
                          <p className={`mt-1 text-sm font-bold ${c.score === null ? 'text-muted-foreground italic' : ''}`}>{c.score !== null ? c.score.toFixed(2) : 'Không tính'}</p>
                        </div>
                        <div className="rounded-lg bg-muted/60 p-2">
                          <p className="text-[10px] font-bold uppercase text-muted-foreground">Xếp loại</p>
                          <div className="mt-1 flex justify-center"><GradeChip grade={c.gradeLabel} /></div>
                        </div>
                      </div>

                      <div className="mt-3 flex justify-end gap-2">
                        <button onClick={() => startEdit(c)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-xs font-bold text-primary">
                          <Pencil className="h-3.5 w-3.5" /> Sửa
                        </button>
                        <button onClick={() => { setDeleteTarget(c.id); setShowDel(true); }} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-destructive/10 px-3 text-xs font-bold text-destructive">
                          <Trash2 className="h-3.5 w-3.5" /> Xoá
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {adding && (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input autoFocus value={form.courseCode} onChange={e => setForm(f => ({...f, courseCode: e.target.value}))} placeholder="Mã môn, VD: CS101" className="h-10 rounded-lg border border-primary/40 bg-background px-3 text-sm" />
              <input value={form.courseName} onChange={e => setForm(f => ({...f, courseName: e.target.value}))} placeholder="Tên môn học..." className="h-10 rounded-lg border border-primary/40 bg-background px-3 text-sm" />
              <input type="number" min={1} max={10} value={form.credits} onChange={e => setForm(f => ({...f, credits: +e.target.value}))} className="h-10 rounded-lg border border-primary/40 bg-background px-3 text-sm" />
              <div className="flex gap-2">
                <input
                  type="number"
                  disabled={form.score === null}
                  min={0}
                  max={10}
                  step={0.25}
                  value={form.score ?? ''}
                  onChange={e => setForm(f => ({...f, score: e.target.value === '' ? null : +e.target.value}))}
                  className="min-w-0 flex-1 rounded-lg border border-primary/40 bg-background px-3 text-sm"
                  placeholder="Điểm"
                />
                <button
                  type="button"
                  onClick={() => setForm(f => ({...f, score: f.score === null ? 0 : null}))}
                  className={`h-10 shrink-0 rounded-lg px-3 text-[11px] font-bold ${form.score === null ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                >
                  Không GPA
                </button>
              </div>
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={handleAdd} disabled={submitting} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground">
                <Check className="h-3.5 w-3.5" /> Tạo
              </button>
              <button onClick={() => setAdding(false)} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-muted px-3 text-xs font-bold">
                <X className="h-3.5 w-3.5" /> Huỷ
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-lg border border-border/60 md:block">
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
