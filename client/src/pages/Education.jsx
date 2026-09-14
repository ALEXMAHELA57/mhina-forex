import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function Education() {
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/courses').then((res) => setCourses(res.courses)).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="error">{error}</p>;

  return (
    <div className="education-page">
      <h1>Academy</h1>
      {courses.map((c) => (
        <div key={c.id} className="course-card">
          <Link to={`/app/academy/${c.id}`}>{c.title}</Link>
          <span> — {c.level} — {c.required_tier}</span>
        </div>
      ))}
    </div>
  );
}
