import React from 'react';
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

function App() {
  return (

    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes with role check*/}
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
          <Route path="/404" element={<div>404 Not Found</div>} />

        {/* Uncomment this if you have a feed page */}
        {/* <Route path="/feed" element={<FeedPage />} /> */}
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
