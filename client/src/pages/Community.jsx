import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { uploadImage } from '../lib/uploadImage.js';

// TODO: replace with your real Telegram channel link
const TELEGRAM_LINK = 'https://t.me/mhinaforex';

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [openComments, setOpenComments] = useState({}); // postId -> comments array
  const [newComment, setNewComment] = useState({}); // postId -> draft text
  const [commentSubmitting, setCommentSubmitting] = useState(null); // postId currently submitting

  function loadPosts() {
    api.get('/community/posts').then((res) => setPosts(res.posts)).catch((err) => setError(err.message));
  }

  useEffect(loadPosts, []);

  async function createPost(e) {
    e.preventDefault();
    setError(null);
    setUploading(true);
    try {
      let chartMediaId = null;
      if (file) {
        const { media } = await uploadImage(file); // validates size/dimensions, then uploads
        chartMediaId = media.id;
      }
      await api.post('/community/posts', { caption, chartMediaId, classification: 'analysis' });
      setCaption('');
      setFile(null);
      loadPosts();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function toggleLike(postId) {
    await api.post(`/community/posts/${postId}/like`);
    loadPosts();
  }

  async function toggleComments(postId) {
    if (openComments[postId]) {
      // Collapse — remove this post's key so the section hides
      setOpenComments((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
      return;
    }
    try {
      const res = await api.get(`/community/posts/${postId}/comments`);
      setOpenComments((prev) => ({ ...prev, [postId]: res.comments }));
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitComment(e, postId) {
    e.preventDefault();
    const body = (newComment[postId] || '').trim();
    if (!body) return;
    setCommentSubmitting(postId);
    try {
      await api.post(`/community/posts/${postId}/comments`, { body });
      setNewComment((prev) => ({ ...prev, [postId]: '' }));
      const res = await api.get(`/community/posts/${postId}/comments`);
      setOpenComments((prev) => ({ ...prev, [postId]: res.comments }));
    } catch (err) {
      setError(err.message);
    } finally {
      setCommentSubmitting(null);
    }
  }

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="community-page">
      <h1>Community</h1>

      <a href={TELEGRAM_LINK} target="_blank" rel="noreferrer" className="telegram-banner">
        📣 Join our Telegram for real-time discussion and updates →
      </a>
      <form onSubmit={createPost}>
        <input placeholder="Share a thought or chart caption…" value={caption} onChange={(e) => setCaption(e.target.value)} required />
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] ?? null)} />
        <button type="submit" disabled={uploading}>{uploading ? 'Posting…' : 'Post'}</button>
      </form>

      {posts.map((p) => (
        <div key={p.id} className="post-card">
          <strong>{p.profiles?.username}</strong>
          {p.chart_image_url && (
            <img src={p.chart_image_url} alt="Chart shared to community" className="post-chart-image" />
          )}
          <p>{p.caption}</p>
          <div className="post-actions">
            <button onClick={() => toggleLike(p.id)}>Like</button>
            <button onClick={() => toggleComments(p.id)}>
              {openComments[p.id] ? 'Hide comments' : 'Comments'}
            </button>
          </div>

          {openComments[p.id] && (
            <div className="comments-section">
              {openComments[p.id].length === 0 && <p className="empty-note">No comments yet — be the first.</p>}
              {openComments[p.id].map((c) => (
                <div key={c.id} className="comment-row">
                  <strong>{c.profiles?.username}</strong>
                  <span>{c.body}</span>
                </div>
              ))}
              <form onSubmit={(e) => submitComment(e, p.id)} className="comment-form">
                <input
                  placeholder="Write a comment…"
                  value={newComment[p.id] || ''}
                  onChange={(e) => setNewComment((prev) => ({ ...prev, [p.id]: e.target.value }))}
                />
                <button type="submit" disabled={commentSubmitting === p.id}>
                  {commentSubmitting === p.id ? '…' : 'Reply'}
                </button>
              </form>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
