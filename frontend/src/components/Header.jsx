export default function Header({ section, page, isAdmin, onGoLanding, onGoSection, onLogout }) {
  return (
    <header className="site-header">
      <button className="brand" onClick={onGoLanding} aria-label="Ir al inicio">
        <img className="brand-logo" src="/logo-header.png" alt="Escobar Propiedades y Arte" />
      </button>
      <nav className="header-nav">
        {page !== "admin" && section !== null && (
          <div className="section-tabs">
            <button
              className={"tab-btn" + (section === "propiedades" ? " tab-btn-active" : "")}
              onClick={() => onGoSection("propiedades")}
            >
              Propiedades
            </button>
            <button
              className={"tab-btn" + (section === "arte" ? " tab-btn-active" : "")}
              onClick={() => onGoSection("arte")}
            >
              Arte
            </button>
          </div>
        )}
        {isAdmin && page === "admin" && (
          <>
            <span className="admin-pill">Panel del dueño</span>
            <button className="btn-outline" onClick={onLogout}>
              Cerrar sesión
            </button>
          </>
        )}
      </nav>
    </header>
  );
}
