import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { uploadVideo } from '../lib/uploadVideo.js';
import { uploadDocument } from '../lib/uploadDocument.js';

export default function AdminCourseLessons() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [title, setTitle] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  function load() {
    api.get(`/courses/${id}/lessons`).then((res) => {
      setCourse(res.course);
      setLessons(res.lessons);
    }).catch((err) => setError(err.message));
  }
  useEffect(load, [id]);

  async function addLesson(e) {
    e.preventDefault();
    setError(null);

    if (!videoFile && !documentFile) {
      setError('Attach a video or a document (or both) for this lesson');
      return;
    }

    setProgress(0);
    try {
      let videoMediaId = null;
      let durationSeconds = null;
      if (videoFile) {
        const { media } = await uploadVideo(videoFile, { title, onProgress: setProgress });
        videoMediaId = media.id;
        durationSeconds = media.duration_seconds;
      }

      let documentMediaId = null;
      if (documentFile) {
        const media = await uploadDocument(documentFile);
        documentMediaId = media.id;
      }

      await api.post(`/courses/${id}/lessons`, {
        title,
        videoMediaId,
        documentMediaId,
        orderIndex: lessons.length,
        durationSeconds,
      });
      setTitle('');
      setVideoFile(null);
      setDocumentFile(null);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setProgress(null);
    }
  }

  if (error) return <p className="error">{error}</p>;
  if (!course) return <p>Loading…</p>;

  return (
    <div className="admin-page">
      <h1>Lessons — {course.title}</h1>

      <form onSubmit={addLesson} className="admin-form">
        <input
          placeholder="Lesson title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <label className="file-label">
          Lesson video (optional)
          <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0] ?? null)} />
        </label>
        <label className="file-label">
          Lesson book/PDF (optional, view-only for members)
          <input type="file" accept="application/pdf" onChange={(e) => setDocumentFile(e.target.files[0] ?? null)} />
        </label>
        {progress !== null && (
          <div className="upload-progress">
            <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
            <span>{progress}% uploaded</span>
          </div>
        )}
        <button type="submit" disabled={progress !== null}>
          {progress !== null ? 'Uploading…' : 'Add lesson'}
        </button>
      </form>

      <h2>Lessons</h2>
      <ol>
        {lessons.map((l) => (
          <li key={l.id}>
            {l.title}
            {l.video_media_id && ' 🎬'}
            {l.document_media_id && ' 📄'}
          </li>
        ))}
      </ol>
    </div>
  );
}
