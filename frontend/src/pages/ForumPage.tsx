import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  Divider,
  Paper,
  Avatar,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Comment as CommentIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { forumService } from '../services/forumService';
import { usersService } from '../services/usersService';
import { ForumPost, ForumComment, CreatePostRequest } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const ForumPage: React.FC = () => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(false);
  
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [newComment, setNewComment] = useState('');

  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const data = await forumService.getPosts();

      // Enrich posts with author's profile image (frontend-side fast fix)
      const authorIds = Array.from(new Set(data.map((p: any) => p.author_id)));
      const users = await Promise.all(
        authorIds.map((id) => usersService.getUserById(id).catch(() => null))
      );
      const userMap: Record<string, any> = {};
      authorIds.forEach((id, idx) => {
        if (users[idx]) userMap[id] = users[idx];
      });

      // Attach full author object to each post
      const enriched = data.map((p: any) => ({
        ...p,
        author: userMap[p.author_id] || {
          firstName: p.author_name.split(' ')[0] || '',
          lastName: p.author_name.split(' ').slice(1).join(' ') || '',
          profileImage: undefined,
        },
      }));

      setPosts(enriched);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Greška pri učitavanju postova', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async (postId: string) => {
    try {
      setCommentsLoading(true);
      const data = await forumService.getPostComments(postId);

      // Enrich comments with author profile images
      const authorIds = Array.from(new Set(data.map((c: any) => c.author_id)));
      const users = await Promise.all(
        authorIds.map((id) => usersService.getUserById(id).catch(() => null))
      );
      const userMap: Record<string, any> = {};
      authorIds.forEach((id, idx) => {
        if (users[idx]) userMap[id] = users[idx];
      });

      const enriched = data.map((c: any) => ({
        ...c,
        author: userMap[c.author_id] || {
          firstName: c.author_name.split(' ')[0] || '',
          lastName: c.author_name.split(' ').slice(1).join(' ') || '',
          profileImage: undefined,
        },
      }));

      setComments(enriched);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Greška pri učitavanju komentara', 'error');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      showToast('Naslov i sadržaj su obavezni', 'warning');
      return;
    }

    try {
      const postData: CreatePostRequest = {
        title: newPostTitle,
        content: newPostContent,
      };
      await forumService.createPost(postData);
      showToast('Post je uspešno kreiran', 'success');
      setOpenCreateDialog(false);
      setNewPostTitle('');
      setNewPostContent('');
      loadPosts();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Greška pri kreiranju posta', 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovaj post?')) {
      return;
    }

    try {
      await forumService.deletePost(postId);
      showToast('Post je uspešno obrisan', 'success');
      loadPosts();
      setOpenPostDialog(false);
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Greška pri brisanju posta', 'error');
    }
  };

  const handleOpenPost = async (post: ForumPost) => {
    setSelectedPost(post);
    setOpenPostDialog(true);
    await loadComments(post.id.toString());
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      showToast('Sadržaj komentara je obavezan', 'warning');
      return;
    }

    if (!selectedPost) return;

    try {
      await forumService.createComment(selectedPost.id.toString(), {
        content: newComment,
      });
      showToast('Komentar je uspešno dodat', 'success');
      setNewComment('');
      await loadComments(selectedPost.id.toString());
      // Reload posts to update comment count
      loadPosts();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Greška pri dodavanju komentara', 'error');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedPost) return;
    
    if (!window.confirm('Da li ste sigurni da želite da obrišete ovaj komentar?')) {
      return;
    }

    try {
      await forumService.deleteComment(selectedPost.id.toString(), commentId);
      showToast('Komentar je uspešno obrisan', 'success');
      await loadComments(selectedPost.id.toString());
      loadPosts();
    } catch (error: any) {
      showToast(error.response?.data?.error || 'Greška pri brisanju komentara', 'error');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('sr-RS', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Forum Zajednice</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateDialog(true)}
        >
          Novi Post
        </Button>
      </Box>

      {posts.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            Nema postova. Budite prvi koji će kreirati post!
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {posts.map((post) => (
            <Card key={post.id} sx={{ cursor: 'pointer' }} onClick={() => handleOpenPost(post)}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar src={(post as any).author?.profileImage} sx={{ mr: 2 }}>
                    {!((post as any).author?.profileImage) && ((post as any).author?.firstName?.[0] || post.author_name?.[0])}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle2">{(post as any).author?.firstName || post.author_name.split(' ')[0]} {(post as any).author?.lastName || post.author_name.split(' ').slice(1).join(' ')}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(post.created_at)}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="h6" gutterBottom>
                  {post.title}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {post.content}
                </Typography>
              </CardContent>
              <CardActions>
                <Chip
                  icon={<CommentIcon />}
                  label={`${post.comments_count} komentara`}
                  size="small"
                  variant="outlined"
                />
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      {/* Create Post Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Kreiraj Novi Post</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Naslov"
            fullWidth
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Sadržaj"
            fullWidth
            multiline
            rows={6}
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Otkaži</Button>
          <Button onClick={handleCreatePost} variant="contained">
            Kreiraj
          </Button>
        </DialogActions>
      </Dialog>

      {/* Post Details Dialog */}
      <Dialog
        open={openPostDialog}
        onClose={() => setOpenPostDialog(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        {selectedPost && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{selectedPost.title}</Typography>
                <IconButton onClick={() => handleDeletePost(selectedPost.id.toString())} color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar src={(selectedPost as any).author?.profileImage} sx={{ mr: 2 }}>
                    {!((selectedPost as any).author?.profileImage) && ((selectedPost as any).author?.firstName?.[0] || selectedPost.author_name?.[0])}
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1">{(selectedPost as any).author?.firstName || selectedPost.author_name.split(' ')[0]} {(selectedPost as any).author?.lastName || selectedPost.author_name.split(' ').slice(1).join(' ')}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(selectedPost.created_at)}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedPost.content}
                </Typography>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Komentari ({comments.length})
              </Typography>

              {commentsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
                  {comments.map((comment) => (
                    <Paper key={comment.id} sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar src={(comment as any).author?.profileImage} sx={{ width: 32, height: 32, mr: 1 }}>
                            {!((comment as any).author?.profileImage) && ((comment as any).author?.firstName?.[0] || comment.author_name?.[0])}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle2">{(comment as any).author?.firstName || comment.author_name.split(' ')[0]} {(comment as any).author?.lastName || comment.author_name.split(' ').slice(1).join(' ')}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(comment.created_at)}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteComment(comment.id.toString())}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {comment.content}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Dodaj komentar..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <Button variant="contained" onClick={handleAddComment} sx={{ height: 'fit-content' }}>
                  Dodaj
                </Button>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenPostDialog(false)}>Zatvori</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Container>
  );
};