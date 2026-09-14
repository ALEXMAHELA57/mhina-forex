import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import healthRoutes from './routes/health.js';
import signalsRoutes from './routes/signals.js';
import paymentsRoutes from './routes/payments.js';
import headwayRoutes from './routes/headway.js';
import mediaRoutes from './routes/media.js';
import coursesRoutes from './routes/courses.js';
import marketRoutes from './routes/market.js';
import aiRoutes from './routes/ai.js';
import communityRoutes from './routes/community.js';
import notificationsRoutes from './routes/notifications.js';
import liveSessionsRoutes from './routes/liveSessions.js';
import adminRoutes from './routes/admin.js';
import publicCoursesRoutes from './routes/publicCourses.js';
import manualPaymentsRoutes from './routes/manualPayments.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/signals', signalsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/headway', headwayRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/live-sessions', liveSessionsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/public-courses', publicCoursesRoutes);
app.use('/api/manual-payments', manualPaymentsRoutes);

// Centralized error handler — catches anything thrown synchronously in a
// route that wasn't already wrapped in try/catch, so the API never leaks
// a raw stack trace to the client.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`MHINA FOREX API running on http://localhost:${PORT}`);
});
