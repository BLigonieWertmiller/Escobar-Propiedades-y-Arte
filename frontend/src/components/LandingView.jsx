export default function LandingView({ onSelect }) {
  return (
    <section className="landing">
      <img className="landing-logo" src="/logo-full.png" alt="Escobar Propiedades y Arte" />
      <p className="landing-subtitle">Elegí qué querés ver</p>
      <div className="landing-grid">
        <button className="landing-card" onClick={() => onSelect("propiedades")}>
          <span className="landing-icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M3 11.5 12 4l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h2>Propiedades</h2>
          <p>Casas, departamentos, PH y terrenos para comprar o alquilar.</p>
        </button>
        <button className="landing-card" onClick={() => onSelect("arte")}>
          <span className="landing-icon" aria-hidden="true">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 3c-4.5 1-8 4.7-8 9a8 8 0 0 0 8 8c1 0 1.8-.8 1.8-1.8 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-1 .8-1.8 1.8-1.8H16a4 4 0 0 0 4-4c0-4.4-3.6-7-8-7Z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="7.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
              <circle cx="10.5" cy="7" r="1" fill="currentColor" stroke="none" />
              <circle cx="14.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <h2>Arte</h2>
          <p>Obras y piezas artísticas disponibles, directo del atelier.</p>
        </button>
      </div>
    </section>
  );
}
