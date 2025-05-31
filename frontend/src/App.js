import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from './components/PtotrctedRoute';
import SignUpPage from './pages/SignUpPage';
import LoginPage from './pages/LoginPage';
import LandingPage from './pages/LandingPage';
import HomeOwnerProfilePage from './pages/HomeOwnerProfilePage';
import ProfessionalProfilePage from './pages/ProfessionalProfilePage';
import FeedPage from './pages/FeedPage';
import PostDetails from './components/PostDetails';
import ChatPage from './pages/ChatPage';
import NotFoundPage from './pages/NotFoundPage';
import SubscribePage from './pages/SubscribePage';

import AOS from 'aos';
import 'aos/dist/aos.css';

function App() {
  useEffect(() => {
    AOS.init({ duration: 1500 });
  }, []);

  return (

    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes with role check*/}
        <Route path="/subscription" element={
          <ProtectedRoute allowedRoles={['professional']}>
            <SubscribePage />
          </ProtectedRoute>
        } />

        <Route path="/feed" element={
          <ProtectedRoute allowedRoles={['homeowner', 'professional']}>
            <FeedPage />
          </ProtectedRoute>
        } />

        <Route path="/post-details" element={
          <ProtectedRoute allowedRoles={['homeowner', 'professional']}>
            <PostDetails />
          </ProtectedRoute>
        } />

        <Route path="/chat" element={
          <ProtectedRoute allowedRoles={['homeowner', 'professional']}>
            <ChatPage />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute allowedRoles={['homeowner', 'professional']}>
            <HomeOwnerProfilePage />
          </ProtectedRoute>
        } />

        <Route path="/professional-profile" element={
          <ProtectedRoute allowedRoles={['homeowner', 'professional']}>
            <ProfessionalProfilePage />
          </ProtectedRoute>
        } />

        {/* Redirect all other routes to 404 */}
        <Route path="*" element={<Navigate to="/404" replace />} />

        {/* 404 Page */}
        <Route path="/404" element={<NotFoundPage />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
