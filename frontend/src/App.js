import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import SignUpPage from './pages/SignUpPage';
import LandingPage from './pages/LandingPage';


function App() {
  return (

    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
