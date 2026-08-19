import { OPERATIONS, STATUSES, formatCurrency, photoUrl } from "../constants";
import { ASSET_BASE } from "../api";

export default function PropertyCard({ p, onOpen }) {
  const cover = p.photos[0]
    ? photoUrl(p.photos[0], ASSET_BASE)
    : "https://placehold.co/900x600/EFE7DA/8A5A3B?text=Sin+foto";

  return (
    <button className="card" onClick={onOpen}>
      <div className="card-media">
        <img src={cover} alt={p.title} loading="lazy" />
        <span className="badge" style={{ background: STATUSES[p.status].color }}>
          {STATUSES[p.status].label}
        </span>
        <span className="badge badge-op">{OPERATIONS[p.operation]}</span>
      </div>
      <div className="card-body">
        <p className="card-price">
          {formatCurrency(p.price, p.currency)}
          {p.operation === "alquiler" ? " /mes" : ""}
        </p>
        <h3 className="card-title">{p.title}</h3>
        <p className="card-location">{p.location}</p>
        <div className="card-meta">
          {p.bedrooms > 0 && <span>{p.bedrooms} dorm.</span>}
          {p.bathrooms > 0 && <span>{p.bathrooms} baño{p.bathrooms > 1 ? "s" : ""}</span>}
          <span>{p.area} m²</span>
        </div>
      </div>
    </button>
  );
}
