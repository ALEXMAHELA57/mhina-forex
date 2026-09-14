import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { uploadImage } from '../lib/uploadImage.js';

export default function AdminCourses() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', level: 'beginner', required_tier: 'free', price: '' });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  function load() {
    api.get('/courses').then((res) => setCourses(res.courses)).catch((err) => setError(err.message));
  }
  useEffect(load, []);

  async function createCourse(e) {
    e.preventDefault();
    setError(null);
    setUploading(true);
    try {
      let thumbnail_media_id = null;
      if (thumbnailFile) {
        const { media } = await uploadImage(thumbnailFile);
        thumbnail_media_id = media.id;
      }
      await api.post('/courses', { ...form, price: form.price ? Number(form.price) : null, thumbnail_media_id, is_published: true });
      setForm({ title: '', description: '', level: 'beginner', required_tier: 'free', price: '' });
      setThumbnailFile(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="admin-page">
      <h1>Manage Courses</h1>

      <form onSubmit={createCourse} className="admin-form">
        <input
          placeholder="Course title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
        <select value={form.required_tier} onChange={(e) => setForm({ ...form, required_tier: e.target.value })}>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="vip">VIP</option>
        </select>
        <input
          placeholder="Individual price (optional, e.g. 50) — leave blank if only tier-gated"
          type="number" step="any"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
        />
        <label className="file-label">
          Thumbnail image
          <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files[0] ?? null)} />
        </label>
        <button type="submit" disabled={uploading}>{uploading ? 'Creating…' : 'Create course'}</button>
      </form>

      {error && <p className="error">{error}</p>}

      <h2>Existing courses</h2>
      {courses.map((c) => (
        <div key={c.id} className="course-card admin-course-row">
          <div>
            <strong>{c.title}</strong> — {c.level} — {c.required_tier}
            {c.price ? ` — $${c.price}` : ''}
          </div>
          <Link to={`/app/admin/courses/${c.id}/lessons`}>Manage lessons</Link>
        </div>
      ))}
    </div>
  );
}
