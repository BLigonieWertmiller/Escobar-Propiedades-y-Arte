import { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import ArtCard from "./ArtCard";
import ArtModal from "./ArtModal";

export default function ArteSite() {
  const [artworks, setArtworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [phone, setPhone] = useState("");

  const load = useCallback(async (q) => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getArtworks({ search: q });
      setArtworks(data);
    } catch (e) {
      setError("No pudimos cargar las obras. Probá de nuevo en unos minutos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.getSettings().then((s) => setPhone(s.phone || "")).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const active = artworks.find((a) => a.id === activeId);

  return (
    <>
      <section className="hero">
        <h1>Obras y piezas</h1>
      </section>

      <section className="filters">
        <div className="filter-row">
          <input className="input" placeholder="Buscar por título o técnica…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </section>

      <section className="results">
        {error && <p className="error-text">{error}</p>}
        {!error && (
          <p className="results-count">
            {loading ? "Buscando…" : `${artworks.length} ${artworks.length === 1 ? "obra encontrada" : "obras encontradas"}`}
          </p>
        )}
        <div className="grid">
          {artworks.map((a) => (
            <ArtCard key={a.id} a={a} onOpen={() => setActiveId(a.id)} />
          ))}
          {!loading && !error && artworks.length === 0 && (
            <div className="empty-state">No hay obras que coincidan con esa búsqueda.</div>
          )}
        </div>
      </section>

      {active && <ArtModal a={active} phone={phone} onClose={() => setActiveId(null)} />}
    </>
  );
}
