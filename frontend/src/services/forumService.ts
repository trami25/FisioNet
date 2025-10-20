import axios from 'axios';
import {
  ForumPost,
  ForumComment,
  CreatePostRequest,
  UpdatePostRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
} from '../types';

const API_URL = 'http://localhost:8004';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Dev auth shim: attach x-user-id from stored user if available
  try {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      const user = JSON.parse(userJson);
      if (user?.id) {
        (config.headers as any)['x-user-id'] = user.id;
      }
    }
    // If user not stored but token exists, try to decode sub from JWT token as fallback
    if (!(config.headers as any)['x-user-id']) {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = token.split('.')[1];
          const json = JSON.parse(decodeURIComponent(escape(window.atob(payload.replace(/-/g, '+').replace(/_/g, '/')))));
          if (json && json.sub) {
            (config.headers as any)['x-user-id'] = json.sub;
          }
        } catch (e) {
          // ignore decode errors
        }
      }
    }
  } catch (_) {
    // ignore JSON parse errors
  }
  // Debug: show outgoing headers for troubleshooting auth issues
  try { console.debug('[forumService] outgoing headers', (config.headers as any)); } catch (e) {}
  return config;
});

export const forumService = {
  // Get all posts
  getPosts: async (page: number = 1, limit: number = 20): Promise<ForumPost[]> => {
    const response = await api.get(`/posts?page=${page}&limit=${limit}`);
    return response.data;
  },

  // Get single post
  getPost: async (postId: string): Promise<ForumPost> => {
    const response = await api.get(`/posts/${postId}`);
    return response.data;
  },

  // Create post
  createPost: async (data: CreatePostRequest): Promise<ForumPost> => {
    const response = await api.post('/posts', data);
    return response.data;
  },

  // Update post
  updatePost: async (postId: string, data: UpdatePostRequest): Promise<ForumPost> => {
    const response = await api.put(`/posts/${postId}`, data);
    return response.data;
  },

  // Delete post
  deletePost: async (postId: string): Promise<void> => {
    await api.delete(`/posts/${postId}`);
  },

  // Get comments for a post
  getPostComments: async (postId: string): Promise<ForumComment[]> => {
    const response = await api.get(`/posts/${postId}/comments`);
    return response.data;
  },

  // Create comment
  createComment: async (postId: string, data: CreateCommentRequest): Promise<ForumComment> => {
    const response = await api.post(`/posts/${postId}/comments`, data);
    return response.data;
  },

  // Update comment
  updateComment: async (
    postId: string,
    commentId: string,
    data: UpdateCommentRequest
  ): Promise<ForumComment> => {
    const response = await api.put(`/posts/${postId}/comments/${commentId}`, data);
    return response.data;
  },

  // Delete comment
  deleteComment: async (postId: string, commentId: string): Promise<void> => {
    await api.delete(`/posts/${postId}/comments/${commentId}`);
  },
};
