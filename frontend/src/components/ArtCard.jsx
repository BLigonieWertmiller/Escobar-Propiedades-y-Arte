import { ART_STATUSES, formatCurrency, photoUrl } from "../constants";
import { ASSET_BASE } from "../api";

export default function ArtCard({ a, onOpen }) {
  const cover = a.photos[0]
    ? photoUrl(a.photos[0], ASSET_BASE)
    : "https://placehold.co/900x900/E8F1FA/163F7A?text=Sin+foto";

  return (
    <button className="card" onClick={onOpen}>
      <div className="card-media">
        <img src={cover} alt={a.title} loading="lazy" />
        <span className="badge" style={{ background: ART_STATUSES[a.status].color }}>
          {ART_STATUSES[a.status].label}
        </span>
      </div>
      <div className="card-body">
        {a.price > 0 && <p className="card-price">{formatCurrency(a.price, a.currency)}</p>}
        <h3 className="card-title">{a.title}</h3>
        {a.category && <p className="card-location">{a.category}</p>}
      </div>
    </button>
  );
}
