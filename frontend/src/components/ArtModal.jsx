import { useState } from "react";
import { ART_STATUSES, formatCurrency, whatsappLink, photoUrl } from "../constants";
import { ASSET_BASE, api } from "../api";

function WhatsAppIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.47 3.47 1.29 4.92L2 22l5.31-1.39a9.87 9.87 0 0 0 4.73 1.2h.01c5.46 0 9.91-4.45 9.91-9.9C21.96 6.45 17.5 2 12.04 2zm5.8 14.1c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.11.11-1.79-.11-.41-.13-.94-.3-1.62-.6-2.85-1.23-4.71-4.1-4.85-4.29-.14-.19-1.16-1.54-1.16-2.94 0-1.4.73-2.08.99-2.37.26-.28.57-.35.76-.35.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.58.81 2 .88 2.14.07.14.12.31.02.5-.1.19-.15.31-.29.48-.15.17-.31.37-.44.5-.15.14-.3.3-.13.59.17.29.76 1.25 1.63 2.03 1.12 1 2.06 1.31 2.35 1.46.29.15.46.13.63-.05.17-.18.72-.84.91-1.13.19-.29.38-.24.64-.14.26.1 1.66.78 1.94.92.29.14.48.21.55.33.08.12.08.68-.16 1.36z" />
    </svg>
  );
}

export default function ArtModal({ a, phone, onClose }) {
  const [photoIdx, setPhotoIdx] = useState(0);
  const closed = a.status === "vendida";
  const photos = a.photos.length
    ? a.photos.map((ph) => photoUrl(ph, ASSET_BASE))
    : ["https://placehold.co/900x900/E8F1FA/163F7A?text=Sin+foto"];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>
        <div className="modal-gallery">
          <img src={photos[photoIdx]} alt={a.title} />
          {photos.length > 1 && (
            <div className="thumb-row">
              {photos.map((ph, i) => (
                <button
                  key={i}
                  className={"thumb" + (i === photoIdx ? " thumb-active" : "")}
                  onClick={() => setPhotoIdx(i)}
                >
                  <img src={ph} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="modal-body">
          <div className="modal-tags">
            {a.category && <span className="badge badge-op">{a.category}</span>}
            <span className="badge" style={{ background: ART_STATUSES[a.status].color }}>
              {ART_STATUSES[a.status].label}
            </span>
          </div>
          <h2>{a.title}</h2>
          {a.price > 0 && <p className="modal-price">{formatCurrency(a.price, a.currency)}</p>}
          {a.description && <p className="modal-desc">{a.description}</p>}
          {closed && <p className="closed-note">Esta obra ya fue vendida. Consultanos por piezas similares.</p>}
          <a
            className="btn-whatsapp"
            href={whatsappLink(phone, a.title, a.id, undefined, false)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => {
              api.createInquiry({ type: "arte", itemId: a.id, itemTitle: a.title }).catch(() => {});
            }}
          >
            <WhatsAppIcon /> Consultar por WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
