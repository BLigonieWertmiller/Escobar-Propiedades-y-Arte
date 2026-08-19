import { useEffect, useState, useCallback } from "react";
import { api } from "./api";
import Header from "./components/Header";
import LandingView from "./components/LandingView";
import SiteView from "./components/SiteView";
import ArteSite from "./components/ArteSite";
import LoginView from "./components/LoginView";
import AdminView from "./components/AdminView";

const ADMIN_PATH = "/admin";

function isAdminPath() {
  return window.location.pathname.replace(/\/$/, "") === ADMIN_PATH;
}

export default function App() {
  const [section, setSection] = useState(null); // null (landing) | 'propiedades' | 'arte'
  const [page, setPage] = useState(isAdminPath() ? "login" : "site");
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }, []);

  const goLanding = useCallback(() => {
    if (isAdminPath()) window.history.pushState({}, "", "/");
    setSection(null);
    setPage("site");
  }, []);

  const goSection = useCallback((s) => {
    if (isAdminPath()) window.history.pushState({}, "", "/");
    setSection(s);
    setPage("site");
  }, []);

  const goAdmin = useCallback(() => {
    window.history.pushState({}, "", ADMIN_PATH);
    setPage("admin");
  }, []);

  useEffect(() => {
    api
      .me()
      .then(() => {
        setIsAdmin(true);
        if (isAdminPath()) setPage("admin");
      })
      .catch(() => setIsAdmin(false))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    const onPop = () => setPage(isAdminPath() ? (isAdmin ? "admin" : "login") : "site");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isAdmin]);

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // igual limpiamos el estado local
    }
    setIsAdmin(false);
    goLanding();
  };

  if (checkingSession) {
    return <div className="app-root" />;
  }

  return (
    <div className="app-root">
      <Header
        section={section}
        page={page}
        isAdmin={isAdmin}
        onGoLanding={goLanding}
        onGoSection={goSection}
        onLogout={handleLogout}
      />

      {page === "site" && section === null && <LandingView onSelect={setSection} />}
      {page === "site" && section === "propiedades" && <SiteView />}
      {page === "site" && section === "arte" && <ArteSite />}

      {page === "login" && !isAdmin && (
        <LoginView
          onSuccess={() => {
            setIsAdmin(true);
            goAdmin();
          }}
        />
      )}

      {page === "admin" && isAdmin && <AdminView showToast={showToast} />}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
