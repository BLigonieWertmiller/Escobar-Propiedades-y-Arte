import { useEffect, useState, useCallback } from "react";
import { api } from "../api";
import { TYPES } from "../constants";
import PropertyCard from "./PropertyCard";
import PropertyModal from "./PropertyModal";

const EMPTY_FILTERS = { operation: "todas", type: "todas", location: "", priceMin: "", priceMax: "", bedrooms: "todas" };

export default function SiteView() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [activeId, setActiveId] = useState(null);
  const [phone, setPhone] = useState("");

  const load = useCallback(async (f) => {
    setLoading(true);
    setError("");
    try {
      const params = {
        operation: f.operation === "todas" ? "" : f.operation,
        type: f.type === "todas" ? "" : f.type,
        location: f.location,
        priceMin: f.priceMin,
        priceMax: f.priceMax,
        bedrooms: f.bedrooms === "todas" ? "" : f.bedrooms,
      };
      const data = await api.getProperties(params);
      setProperties(data);
    } catch (e) {
      setError("No pudimos cargar las propiedades. Probá de nuevo en unos minutos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    api.getSettings().then((s) => setPhone(s.phone || "")).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(filters), 300); // debounce
    return () => clearTimeout(t);
  }, [filters, load]);

  const active = properties.find((p) => p.id === activeId);
  const hasActiveFilters =
    filters.operation !== "todas" ||
    filters.type !== "todas" ||
    filters.location ||
    filters.priceMin ||
    filters.priceMax ||
    filters.bedrooms !== "todas";

  return (
    <>
      <section className="hero">
        <h1>Encontrá tu próximo lugar</h1>
        <p>Casas, departamentos, PH y terrenos para comprar o alquilar.</p>
      </section>

      <section className="filters">
        <div className="filter-row">
          <div className="seg">
            {["todas", "venta", "alquiler"].map((op) => (
              <button
                key={op}
                className={"seg-btn" + (filters.operation === op ? " seg-btn-active" : "")}
                onClick={() => setFilters((f) => ({ ...f, operation: op }))}
              >
                {op === "todas" ? "Todas" : op === "venta" ? "Venta" : "Alquiler"}
              </button>
            ))}
          </div>
          <input
            className="input"
            placeholder="Buscar por barrio o dirección…"
            value={filters.location}
            onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
          />
        </div>
        <div className="filter-row filter-row-wrap">
          <select className="input select" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}>
            <option value="todas">Tipo de propiedad</option>
            {Object.entries(TYPES).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            className="input input-narrow"
            type="number"
            placeholder="Precio mín."
            value={filters.priceMin}
            onChange={(e) => setFilters((f) => ({ ...f, priceMin: e.target.value }))}
          />
          <input
            className="input input-narrow"
            type="number"
            placeholder="Precio máx."
            value={filters.priceMax}
            onChange={(e) => setFilters((f) => ({ ...f, priceMax: e.target.value }))}
          />
          <select className="input select" value={filters.bedrooms} onChange={(e) => setFilters((f) => ({ ...f, bedrooms: e.target.value }))}>
            <option value="todas">Dormitorios (mín.)</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
          {hasActiveFilters && (
            <button className="btn-ghost" onClick={() => setFilters(EMPTY_FILTERS)}>
              Limpiar filtros
            </button>
          )}
        </div>
      </section>

      <section className="results">
        {error && <p className="error-text">{error}</p>}
        {!error && (
          <p className="results-count">
            {loading ? "Buscando…" : `${properties.length} ${properties.length === 1 ? "propiedad encontrada" : "propiedades encontradas"}`}
          </p>
        )}
        <div className="grid">
          {properties.map((p) => (
            <PropertyCard key={p.id} p={p} onOpen={() => setActiveId(p.id)} />
          ))}
          {!loading && !error && properties.length === 0 && (
            <div className="empty-state">No hay propiedades que coincidan con esa búsqueda. Probá ajustar los filtros.</div>
          )}
        </div>
      </section>

      {active && <PropertyModal p={active} phone={phone} onClose={() => setActiveId(null)} />}
    </>
  );
}
