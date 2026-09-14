import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import ManualPaymentFlow from '../components/ManualPaymentFlow.jsx';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState(null);
  const [accessError, setAccessError] = useState(null);
  const [error, setError] = useState(null);
  const [readingUrl, setReadingUrl] = useState(null);

  useEffect(() => {
    // Course metadata (title/description/price) is always visible;
    // lessons are what's actually gated — fetched separately so we can
    // show a "Buy" prompt using the course info even when lessons 403s.
    api.get(`/courses/${id}`).then((res) => setCourse(res.course)).catch((err) => setError(err.message));

    api.get(`/courses/${id}/lessons`)
      .then((res) => setLessons(res.lessons))
      .catch((err) => setAccessError(err.message));
  }, [id]);

  async function enroll() {
    await api.post(`/courses/${id}/enroll`);
  }

  async function readDocument(mediaId) {
    setError(null);
    try {
      const { viewUrl } = await api.get(`/media/documents/${mediaId}/view-url`);
      setReadingUrl(`${viewUrl}#toolbar=0`);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <p className="error">{error}</p>;
  if (!course) return <p>Loading…</p>;

  if (readingUrl) {
    return (
      <div className="document-reader">
        <div className="call-header">
          <span>Reading — view only</span>
          <button onClick={() => setReadingUrl(null)}>Close</button>
        </div>
        <iframe title="Course document" src={readingUrl} className="document-frame" />
      </div>
    );
  }

  return (
    <div className="course-detail-page">
      <h1>{course.title}</h1>
      <p className="course-meta">
        {course.required_tier.toUpperCase()} tier
        {course.price ? ` — or buy individually for $${course.price}` : ''}
      </p>

      {lessons ? (
        <>
          <button onClick={enroll}>Enroll</button>
          <ol>
            {lessons.map((l) => (
              <li key={l.id}>
                {l.title}
                {l.document_media_id && (
                  <button className="read-btn" onClick={() => readDocument(l.document_media_id)}>Read</button>
                )}
              </li>
            ))}
          </ol>
        </>
      ) : (
        <div className="access-blocked">
          <p>{accessError || 'Checking access…'}</p>
          {course.price && <ManualPaymentFlow purpose="course" contentId={id} price={course.price} />}
        </div>
      )}
    </div>
  );
}
