import { Layout } from "antd";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAppSession } from "./hooks/useAppSession";
import LandingPage from "./pages/LandingPage";
import DomainReadonlyPage from "./pages/DomainReadonlyPage";
import HomePage from "./pages/HomePage";
import SessionRestorePage from "./pages/SessionRestorePage";
import WorkspaceTestsPage from "./pages/WorkspaceTestsPage";
import "./App.css";

const { Content } = Layout;

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";

function App() {
  const location = useLocation();
  const {
    authBootstrapPending,
    authError,
    authPending,
    domainProbeResults,
    domainProbes,
    handleGoogleSuccess,
    handleLogout,
    probeResults,
    probes,
    runDomainProbe,
    runProbe,
    session,
  } = useAppSession();

  if (authBootstrapPending) {
    return <SessionRestorePage />;
  }

  return (
    <Layout className="app-shell">
      <Content className="app-content">
        <Routes>
          <Route
            path="/"
            element={
              session ? (
                <Navigate to="/home" replace />
              ) : (
                <LandingPage
                  authError={authError}
                  authPending={authPending}
                  clientIdConfigured={googleClientId.length > 0}
                  onGoogleSuccess={handleGoogleSuccess}
                />
              )
            }
          />
          <Route
            path="/home"
            element={
              session ? (
                <HomePage
                  currentPath={location.pathname}
                  onLogout={handleLogout}
                  userRole={session.user.role}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/workspace-tests"
            element={
              session ? (
                <WorkspaceTestsPage
                  currentPath={location.pathname}
                  onLogout={handleLogout}
                  onRunProbe={runProbe}
                  probeResults={probeResults}
                  probes={probes}
                  user={session.user}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="/domain-readonly"
            element={
              session ? (
                session.user.role === "admin" ? (
                  <DomainReadonlyPage
                    currentPath={location.pathname}
                    onLogout={handleLogout}
                    onRunProbe={runDomainProbe}
                    probeResults={domainProbeResults}
                    probes={domainProbes}
                    user={session.user}
                  />
                ) : (
                  <Navigate to="/home" replace />
                )
              ) : (
                <Navigate to="/" replace />
              )
            }
          />
          <Route
            path="*"
            element={<Navigate to={session ? "/home" : "/"} replace />}
          />
        </Routes>
      </Content>
    </Layout>
  );
}

export default App;
