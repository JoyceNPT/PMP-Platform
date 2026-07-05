import apiClient from '../apiClient';

export const DEFAULT_NOTE_CONTENT = JSON.stringify([
  {
    type: 'paragraph',
    content: [],
  },
]);

export interface NoteDto {
  id: string;
  title: string;
  content: string;
  coverImage?: string;
  icon?: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
  coverImage?: string;
  icon?: string;
  isPinned: boolean;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
  coverImage?: string;
  icon?: string;
  isPinned?: boolean;
}

export const noteService = {
  getNotes: async () => {
    const response = await apiClient.get('/note');
    return response.data;
  },

  getNoteById: async (id: string) => {
    const response = await apiClient.get(`/note/${id}`);
    return response.data;
  },

  createNote: async (data: CreateNoteRequest) => {
    const response = await apiClient.post('/note', data);
    return response.data;
  },

  updateNote: async (id: string, data: UpdateNoteRequest) => {
    const response = await apiClient.put(`/note/${id}`, data);
    return response.data;
  },

  deleteNote: async (id: string) => {
    const response = await apiClient.delete(`/note/${id}`);
    return response.data;
  },

  togglePin: async (id: string) => {
    const response = await apiClient.patch(`/note/${id}/pin`);
    return response.data;
  },

  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post('/upload?feature=notes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data; // URL string
  }
};
