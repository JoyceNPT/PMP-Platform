import { useEffect, useState } from 'react';
import { DEFAULT_NOTE_CONTENT, noteService, type NoteDto } from '@/services/note/noteService';
import { NoteEditor } from '@/features/note/components/NoteEditor';
import { FileText, Plus, Pin, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export function NotesPage() {
  const [notes, setNotes] = useState<NoteDto[]>([]);
  const [activeNote, setActiveNote] = useState<NoteDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const res = await noteService.getNotes();
      if (res.succeeded) {
        setNotes(res.data);
        if (res.data.length > 0 && !activeNote) {
          setActiveNote(res.data[0]);
        }
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách ghi chú');
    } finally {
      setIsLoading(false);
    }
  };

  const createNote = async () => {
    try {
      const res = await noteService.createNote({
        title: 'Không có tiêu đề',
        content: DEFAULT_NOTE_CONTENT,
        isPinned: false
      });
      if (res.succeeded) {
        setNotes([res.data, ...notes]);
        setActiveNote(res.data);
        toast.success('Đã tạo ghi chú mới');
      }
    } catch (error) {
      toast.error('Không thể tạo ghi chú');
    }
  };

  const deleteNote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn xóa ghi chú này?')) return;
    try {
      const res = await noteService.deleteNote(id);
      if (res.succeeded) {
        setNotes(notes.filter(n => n.id !== id));
        if (activeNote?.id === id) {
          setActiveNote(null);
        }
        toast.success('Đã xóa ghi chú');
      }
    } catch (error) {
      toast.error('Lỗi khi xóa ghi chú');
    }
  };

  const togglePin = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await noteService.togglePin(id);
      if (res.succeeded) {
        setNotes(notes.map(n => n.id === id ? { ...n, isPinned: res.data } : n).sort((a, b) => {
          if (a.isPinned === b.isPinned) return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          return a.isPinned ? -1 : 1;
        }));
      }
    } catch (error) {
      toast.error('Lỗi khi ghim ghi chú');
    }
  };

  const handleUpdateNote = (updatedNote: NoteDto) => {
    setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
    setActiveNote(updatedNote);
  };

  const pinnedNotes = notes.filter(n => n.isPinned);
  const otherNotes = notes.filter(n => !n.isPinned);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-card/50 flex flex-col hidden md:flex shrink-0">
        <div className="p-4 flex items-center justify-between border-b">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Ghi chú
          </h2>
          <button 
            onClick={createNote}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
            title="Ghi chú mới"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-6">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground text-sm">
              Chưa có ghi chú nào. <br /> Nhấn + để tạo mới.
            </div>
          ) : (
            <>
              {pinnedNotes.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                    Đã ghim
                  </h3>
                  <div className="space-y-0.5">
                    {pinnedNotes.map(note => (
                      <NoteItem key={note.id} note={note} isActive={activeNote?.id === note.id} 
                        onClick={() => setActiveNote(note)} onDelete={(e) => deleteNote(e, note.id)} onPin={(e) => togglePin(e, note.id)} />
                    ))}
                  </div>
                </div>
              )}

              {otherNotes.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 mt-4">
                    Tất cả ghi chú
                  </h3>
                  <div className="space-y-0.5">
                    {otherNotes.map(note => (
                      <NoteItem key={note.id} note={note} isActive={activeNote?.id === note.id} 
                        onClick={() => setActiveNote(note)} onDelete={(e) => deleteNote(e, note.id)} onPin={(e) => togglePin(e, note.id)} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 overflow-y-auto bg-background">
        {activeNote ? (
          <ErrorBoundary
            key={activeNote.id}
            fallback={(error) => (
              <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                <FileText className="w-16 h-16 mb-4 text-destructive/40" />
                <h2 className="text-lg font-semibold text-foreground">Không thể mở ghi chú này</h2>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Nội dung ghi chú hoặc trình soạn thảo đang gặp lỗi khi render.
                </p>
                <pre className="mt-4 max-w-xl overflow-auto rounded-md border bg-muted p-3 text-left text-xs text-muted-foreground">
                  {error.message}
                </pre>
              </div>
            )}
          >
            <NoteEditor note={activeNote} onUpdate={handleUpdateNote} />
          </ErrorBoundary>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
            <FileText className="w-16 h-16 mb-4 opacity-20" />
            <p>Chọn một ghi chú hoặc tạo mới để bắt đầu.</p>
            <button 
              onClick={createNote}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Tạo ghi chú mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function NoteItem({ note, isActive, onClick, onDelete, onPin }: { note: NoteDto, isActive: boolean, onClick: () => void, onDelete: (e: React.MouseEvent) => void, onPin: (e: React.MouseEvent) => void }) {
  return (
    <div 
      onClick={onClick}
      className={`group flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm ${isActive ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-foreground'}`}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-base leading-none">{note.icon || '📄'}</span>
        <span className="truncate">{note.title}</span>
      </div>
      <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`}>
        <button onClick={onPin} className="p-1 hover:bg-background/80 rounded" title={note.isPinned ? "Bỏ ghim" : "Ghim"}>
          <Pin className={`w-3.5 h-3.5 ${note.isPinned ? 'fill-current' : ''}`} />
        </button>
        <button onClick={onDelete} className="p-1 hover:bg-destructive/10 hover:text-destructive rounded" title="Xóa">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
