import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import PublicLayout from './components/PublicLayout.jsx';
import AuthenticatedLayout from './components/AuthenticatedLayout.jsx';

// Public site — one continuous scrolling page (see SinglePageSite.jsx)
import SinglePageSite from './pages/public/SinglePageSite.jsx';

// Auth
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Account from './pages/Account.jsx';
import AccessGate from './pages/AccessGate.jsx';
import Onboarding from './pages/Onboarding.jsx';
import PostAuthRedirect from './pages/PostAuthRedirect.jsx';

// Authenticated app — lives under /app/*
import Dashboard from './pages/Dashboard.jsx';
import Signals from './pages/Signals.jsx';
import Education from './pages/Education.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import MarketNews from './pages/MarketNews.jsx';
import AIAnalyzer from './pages/AIAnalyzer.jsx';
import Community from './pages/Community.jsx';
import LiveSessions from './pages/LiveSessions.jsx';
import AdminHeadwayQueue from './pages/AdminHeadwayQueue.jsx';
import AdminCourses from './pages/AdminCourses.jsx';
import AdminSignals from './pages/AdminSignals.jsx';
import AdminModeration from './pages/AdminModeration.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import AdminDashboardHome from './pages/AdminDashboardHome.jsx';
import AdminUsers from './pages/AdminUsers.jsx';
import AdminLiveSessions from './pages/AdminLiveSessions.jsx';
import AdminCourseLessons from './pages/AdminCourseLessons.jsx';
import AdminMarketNews from './pages/AdminMarketNews.jsx';
import Membership from './pages/Membership.jsx';
import AdminManualPayments from './pages/AdminManualPayments.jsx';

export default function App() {
  return (
    <Routes>
      {/* Public site — now one continuous scrolling page. Old individual
          URLs redirect to the matching anchor on that page, so any
          existing bookmarks/links (or a search engine's cached page)
          still land in the right place instead of 404ing. */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<SinglePageSite />} />
        <Route path="/about" element={<Navigate to="/#about" replace />} />
        <Route path="/academy" element={<Navigate to="/#academy" replace />} />
        <Route path="/analysis" element={<Navigate to="/#analysis" replace />} />
        <Route path="/signals" element={<Navigate to="/#signals" replace />} />
        <Route path="/ai-analyzer" element={<Navigate to="/#ai-analyzer" replace />} />
        <Route path="/community" element={<Navigate to="/#community" replace />} />
        <Route path="/headway" element={<Navigate to="/#about" replace />} />
        <Route path="/contact" element={<Navigate to="/#contact" replace />} />
      </Route>

      {/* Auth pages — no active membership required, just a session */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/access-gate"
        element={
          <ProtectedRoute>
            <AccessGate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      {/* Deliberately NOT wrapped in ProtectedRoute — that component
          checks for a session immediately and would race against the
          Google OAuth exchange the same way PostAuthRedirect itself
          used to. PostAuthRedirect already handles "wait, then decide"
          properly on its own; double-checking here just reintroduces
          the bug at one layer up. */}
      <Route path="/post-login" element={<PostAuthRedirect />} />

      {/* Authenticated app, namespaced under /app — requires only being
          logged in, NOT an active/paid status. Anyone with an account is
          Free tier by default and can browse free content immediately;
          Pro/VIP-gated content is restricted route-by-route (courses,
          signals, live sessions all already check tier + purchase status
          server-side), not by blocking the whole section up front. Kept
          separate from the public site so e.g. /signals (public preview)
          and /app/signals (real signal list) can coexist without colliding. */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="signals" element={<Signals />} />
        <Route path="academy" element={<Education />} />
        <Route path="academy/:id" element={<CourseDetail />} />
        <Route path="market" element={<MarketNews />} />
        <Route path="ai-analyzer" element={<AIAnalyzer />} />
        <Route path="community" element={<Community />} />
        <Route path="membership" element={<Membership />} />
        <Route path="account" element={<Account />} />
        <Route path="live-sessions" element={<LiveSessions />} />
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardHome />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="headway-queue" element={<AdminHeadwayQueue />} />
          <Route path="manual-payments" element={<AdminManualPayments />} />
          <Route path="courses" element={<AdminCourses />} />
          <Route path="courses/:id/lessons" element={<AdminCourseLessons />} />
          <Route path="signals" element={<AdminSignals />} />
          <Route path="market-news" element={<AdminMarketNews />} />
          <Route path="moderation" element={<AdminModeration />} />
          <Route path="live-sessions" element={<AdminLiveSessions />} />
        </Route>
      </Route>
    </Routes>
  );
}
