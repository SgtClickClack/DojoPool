import React, { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { Layout } from "./components/Layout/[UI]Layout";
import { LoadingSpinner } from "./components/Common/[UI]LoadingSpinner";

// Lazy load route components
const Login = React.lazy(() =>
  import("./components/Auth/[AUTH]Login").then((module) => ({
    default: module.Login,
  })),
);
const Register = React.lazy(() =>
  import("./components/Auth/[AUTH]Register").then((module) => ({
    default: module.Register,
  })),
);
const ForgotPassword = React.lazy(() =>
  import("./components/Auth/[AUTH]ForgotPassword").then((module) => ({
    default: module.ForgotPassword,
  })),
);
const DashboardPage = React.lazy(() =>
  import("../../components/Dashboard").then((module) => ({
    default: module.default,
  }))
);
const Profile = React.lazy(() =>
  import("./components/Profile/[UI]Profile").then((module) => ({
    default: module.Profile,
  })),
);
const Settings = React.lazy(() =>
  import("./components/Settings/[UI]Settings").then((module) => ({
    default: module.Settings,
  })),
);
const NotFound = React.lazy(() =>
  import("./components/Common/[UI]NotFound").then((module) => ({
    default: module.NotFound,
  })),
);
const VenueRoutes = React.lazy(() => import("./routes/[ROUTE]VenueRoutes"));
const TournamentRoutes = React.lazy(
  () => import("./routes/[ROUTE]TournamentRoutes"),
);

// Loading fallback component
const LoadingFallback = () => (
  <div className="loading-container">
    <LoadingSpinner />
  </div>
);

export const Router: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingFallback />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              !user ? (
                <Suspense fallback={<LoadingFallback />}>
                  <Login />
                </Suspense>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/register"
            element={
              !user ? (
                <Suspense fallback={<LoadingFallback />}>
                  <Register />
                </Suspense>
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/forgot-password"
            element={
              !user ? (
                <Suspense fallback={<LoadingFallback />}>
                  <ForgotPassword />
                </Suspense>
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Protected routes */}
          <Route
            path="/*"
            element={
              user ? (
                <Layout>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/settings" element={<Settings />} />

                      {/* Venue routes */}
                      <Route
                        path="/venues/*"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <VenueRoutes />
                          </Suspense>
                        }
                      />

                      {/* Tournament routes */}
                      <Route
                        path="/tournaments/*"
                        element={
                          <Suspense fallback={<LoadingFallback />}>
                            <TournamentRoutes />
                          </Suspense>
                        }
                      />

                      {/* Fallback route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
