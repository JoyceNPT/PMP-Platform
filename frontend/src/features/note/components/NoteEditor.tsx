import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/mantine';
import '@blocknote/mantine/style.css';
import { useEffect, useState, useCallback } from 'react';
import { noteService, type NoteDto } from '@/services/note/noteService';
import { toast } from 'react-hot-toast';
import { Smile, Image as ImageIcon } from 'lucide-react';

interface NoteEditorProps {
  note: NoteDto;
  onUpdate: (updatedNote: NoteDto) => void;
}

export function NoteEditor({ note, onUpdate }: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [icon, setIcon] = useState(note.icon || '');
  const [coverImage, setCoverImage] = useState(note.coverImage || '');
  const [isSaving, setIsSaving] = useState(false);

  // Parse Initial Content
  const initialContent = note.content && note.content !== '[]' 
    ? JSON.parse(note.content) 
    : undefined;

  const editor = useCreateBlockNote({
    initialContent,
    uploadFile: async (file: File) => {
      try {
        const url = await noteService.uploadImage(file);
        return url;
      } catch (err) {
        toast.error("Không thể upload ảnh.");
        throw err;
      }
    }
  });

  // Debounced auto-save content
  const saveContent = useCallback(async () => {
    if (!editor) return;
    try {
      setIsSaving(true);
      const content = JSON.stringify(editor.document);
      const res = await noteService.updateNote(note.id, { content, title, icon, coverImage });
      if (res.succeeded) {
        onUpdate(res.data);
      }
    } catch (error) {
      console.error('Failed to save note', error);
    } finally {
      setIsSaving(false);
    }
  }, [editor, note.id, title, icon, coverImage, onUpdate]);

  // Handle Title Blur to save
  const handleTitleBlur = () => {
    if (title !== note.title) {
      saveContent();
    }
  };

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Save indicator */}
      <div className="absolute top-4 right-8 text-xs text-muted-foreground z-10">
        {isSaving ? 'Đang lưu...' : 'Đã lưu'}
      </div>

      <div className="max-w-4xl w-full mx-auto pb-32">
        {/* Cover Image */}
        {coverImage && (
          <div className="w-full h-48 sm:h-64 relative group rounded-b-lg overflow-hidden mb-8">
            <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            <button 
              onClick={() => { setCoverImage(''); saveContent(); }}
              className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity text-sm"
            >
              Xóa ảnh bìa
            </button>
          </div>
        )}

        <div className="px-12 sm:px-24">
          {/* Controls: Add Icon / Add Cover */}
          <div className="flex items-center gap-4 text-muted-foreground mb-4 opacity-0 hover:opacity-100 transition-opacity focus-within:opacity-100">
            {!icon && (
              <button 
                onClick={() => setIcon('📝')} // Default icon, can be expanded to emoji picker
                className="flex items-center gap-1.5 hover:text-foreground text-sm font-medium transition-colors"
              >
                <Smile className="w-4 h-4" />
                <span>Thêm biểu tượng</span>
              </button>
            )}
            {!coverImage && (
              <>
                <input
                  type="file"
                  id="cover-upload"
                  className="hidden"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        setIsSaving(true);
                        const url = await noteService.uploadImage(file);
                        setCoverImage(url);
                        const res = await noteService.updateNote(note.id, { content: JSON.stringify(editor.document), title, icon, coverImage: url });
                        if (res.succeeded) {
                          onUpdate(res.data);
                        }
                        toast.success("Đã tải ảnh bìa lên thành công!");
                      } catch (err) {
                        toast.error("Lỗi khi tải ảnh bìa");
                      } finally {
                        setIsSaving(false);
                      }
                    }
                  }}
                />
                <button 
                  onClick={() => document.getElementById('cover-upload')?.click()}
                  className="flex items-center gap-1.5 hover:text-foreground text-sm font-medium transition-colors"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Thêm ảnh bìa từ thiết bị</span>
                </button>
              </>
            )}
          </div>

          {/* Icon Display */}
          {icon && (
            <div className="relative group w-fit mb-4 -mt-16 z-10">
              <span className="text-6xl">{icon}</span>
              <button 
                onClick={() => { setIcon(''); saveContent(); }}
                className="absolute -top-2 -right-2 bg-background shadow border rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
              >
                ×
              </button>
            </div>
          )}

          {/* Title Input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Không có tiêu đề"
            className="w-full text-4xl sm:text-5xl font-bold bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground/30 mb-8"
          />

          {/* BlockNote Editor */}
          <div className="-ml-[54px]">
            <BlockNoteView
              editor={editor}
              theme="light" // Ideally sync this with global theme context
              onChange={saveContent}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
