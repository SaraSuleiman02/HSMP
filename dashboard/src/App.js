import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import RouteScrollToTop from "./helper/RouteScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";

// Pages imports
import SignInPage from "./pages/SignInPage";
import HomePageTen from "./pages/HomePageTen";
import ProfilePage from "./pages/ProfilePage";
import HomeownerPage from "./pages/HomeownerPage";
import ProfessionalPage from "./pages/ProfessionalPage";

function App() {
  return (
    <BrowserRouter>
      <RouteScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route path="/sign-in" element={<SignInPage />} />

        {/* Protected routes with position checks */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedPositions={['admin']}>
              {/* <HomePageTen /> */}
            </ProtectedRoute>
          }
        />
        <Route
          path="/homeowners"
          element={
            <ProtectedRoute allowedPositions={['admin']}>
              <HomeownerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/professionals"
          element={
            <ProtectedRoute allowedPositions={['admin']}>
              <ProfessionalPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedPositions={['admin']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Catch all route - redirect to signin if not authenticated */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              {({ user }) => (
                user ? (
                  <Navigate to={user.position === 'tech' ? '/tech/dashboard' : '/'} replace />
                ) : (
                  <Navigate to="/sign-in" replace />
                )
              )}
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
