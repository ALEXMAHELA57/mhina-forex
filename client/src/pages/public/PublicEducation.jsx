import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';

export default function PublicEducation() {
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/public-courses').then((res) => setCourses(res.courses)).catch((err) => setError(err.message));
  }, []);

  return (
    <div className="public-page">
      <section className="hero hero-bold hero-pattern-bg">
        <h1>
          <span className="hero-line-1">Learn the market.</span>
          <span className="hero-line-2">Not just theory.</span>
        </h1>
        <p className="hero-sub">
          Built from real trading experience, not textbooks a clear
          path from beginner to advanced.
        </p>
      </section>

      {error && <p className="error">{error}</p>}
      {courses && courses.length === 0 && <p className="empty-note" style={{ textAlign: 'center' }}>Courses are coming soon.</p>}

      <section className="paths-grid">
        {courses?.map((c) => (
          <div key={c.id} className="path-card">
            <span className="path-level">{c.level}</span>
            <h3>{c.title}</h3>
            <p>{c.description}</p>
            <p className="course-price-line">
              {c.price ? `$${c.price}` : `Included in ${c.required_tier.toUpperCase()} membership`}
            </p>
            <Link to="/register" className="btn-primary">Enroll</Link>
          </div>
        ))}
      </section>
    </div>
  );
}
