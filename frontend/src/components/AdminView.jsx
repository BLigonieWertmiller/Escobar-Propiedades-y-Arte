import { useEffect, useState, useCallback } from "react";
import { api, ASSET_BASE } from "../api";
import { OPERATIONS, TYPES, STATUSES, ART_STATUSES, INQUIRY_STATUSES, formatCurrency, photoUrl } from "../constants";
import PropertyForm from "./PropertyForm";
import ArtForm from "./ArtForm";

export default function AdminView({ showToast }) {
  const [tab, setTab] = useState("propiedades"); // propiedades | arte | consultas

  const [properties, setProperties] = useState([]);
  const [artworks, setArtworks] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProperty, setEditingProperty] = useState(undefined); // undefined = closed, null = new, object = editing
  const [editingArt, setEditingArt] = useState(undefined);
  const [settings, setSettings] = useState({ phone: "" });
  const [phoneDraft, setPhoneDraft] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [props, art, inq, sett] = await Promise.all([
        api.getProperties({ includeClosed: "1" }),
        api.getArtworks({ includeSold: "1" }),
        api.getInquiries(),
        api.getSettings(),
      ]);
      setProperties(props);
      setArtworks(art);
      setInquiries(inq);
      setSettings(sett);
      setPhoneDraft(sett.phone || "");
    } catch (e) {
      showToast("No se pudieron cargar los datos del panel.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const removeProperty = async (id) => {
    if (!confirm("¿Eliminar esta propiedad? Esta acción no se puede deshacer.")) return;
    try {
      await api.deleteProperty(id);
      showToast("Propiedad eliminada");
      load();
    } catch (e) {
      showToast(e.message || "No se pudo eliminar.");
    }
  };

  const changePropertyStatus = async (id, status) => {
    try {
      await api.updateStatus(id, status);
      showToast("Estado actualizado");
      load();
    } catch (e) {
      showToast(e.message || "No se pudo actualizar el estado.");
    }
  };

  const removeArt = async (id) => {
    if (!confirm("¿Eliminar esta obra? Esta acción no se puede deshacer.")) return;
    try {
      await api.deleteArtwork(id);
      showToast("Obra eliminada");
      load();
    } catch (e) {
      showToast(e.message || "No se pudo eliminar.");
    }
  };

  const changeArtStatus = async (id, status) => {
    try {
      await api.updateArtworkStatus(id, status);
      showToast("Estado actualizado");
      load();
    } catch (e) {
      showToast(e.message || "No se pudo actualizar el estado.");
    }
  };

  const changeInquiryStatus = async (id, status) => {
    try {
      await api.updateInquiryStatus(id, status);
      showToast("Estado de la consulta actualizado");
      load();
    } catch (e) {
      showToast(e.message || "No se pudo actualizar el estado.");
    }
  };

  const saveSettings = async () => {
    try {
      const s = await api.updateSettings({ phone: phoneDraft });
      setSettings(s);
      showToast("Teléfono actualizado");
    } catch (e) {
      showToast(e.message || "No se pudo guardar.");
    }
  };

  return (
    <div className="admin-wrap">
      <div className="admin-topbar">
        <h2>Panel del dueño</h2>
      </div>

      <div className="section-tabs admin-section-tabs">
        <button className={"tab-btn" + (tab === "propiedades" ? " tab-btn-active" : "")} onClick={() => setTab("propiedades")}>
          Propiedades ({properties.length})
        </button>
        <button className={"tab-btn" + (tab === "arte" ? " tab-btn-active" : "")} onClick={() => setTab("arte")}>
          Arte ({artworks.length})
        </button>
        <button className={"tab-btn" + (tab === "consultas" ? " tab-btn-active" : "")} onClick={() => setTab("consultas")}>
          Consultas ({inquiries.length})
        </button>
      </div>

      <div className="settings-box">
        <label className="field-label">WhatsApp de contacto (con código de país, sin +)</label>
        <div className="settings-row">
          <input className="input" value={phoneDraft} onChange={(e) => setPhoneDraft(e.target.value)} placeholder="5492610000000" />
          <button className="btn-outline" onClick={saveSettings}>Guardar</button>
        </div>
      </div>

      <div className="settings-box">
        <div className="settings-row" style={{ justifyContent: "space-between" }}>
          <label className="field-label" style={{ margin: 0 }}>Seguridad de la cuenta</label>
          <button className="btn-ghost" onClick={() => setShowPasswordForm((v) => !v)}>
            {showPasswordForm ? "Cerrar" : "Cambiar contraseña"}
          </button>
        </div>
        {showPasswordForm && <PasswordForm showToast={showToast} onDone={() => setShowPasswordForm(false)} />}
      </div>

      {loading ? (
        <p className="hint-text">Cargando…</p>
      ) : tab === "propiedades" ? (
        <>
          <div className="admin-topbar">
            <h3>Mis propiedades</h3>
            <button className="btn-primary" onClick={() => setEditingProperty(null)}>+ Nueva propiedad</button>
          </div>
          <div className="admin-table">
            {properties.map((p) => (
              <div className="admin-row" key={p.id}>
                <img
                  className="admin-thumb"
                  src={p.photos[0] ? photoUrl(p.photos[0], ASSET_BASE) : "https://placehold.co/200x150/E8F1FA/163F7A?text=%20"}
                  alt=""
                />
                <div className="admin-row-info">
                  <p className="admin-row-title">{p.title || "(sin título)"}</p>
                  <p className="admin-row-sub">
                    {OPERATIONS[p.operation]} · {TYPES[p.type]} · {formatCurrency(p.price, p.currency)} · {p.location}
                  </p>
                </div>
                <select className="input status-select" value={p.status} onChange={(e) => changePropertyStatus(p.id, e.target.value)}>
                  {Object.entries(STATUSES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <button className="btn-outline" onClick={() => setEditingProperty(p)}>Editar</button>
                <button className="btn-danger" onClick={() => removeProperty(p.id)}>Eliminar</button>
              </div>
            ))}
            {properties.length === 0 && <p className="empty-state">Todavía no publicaste propiedades.</p>}
          </div>
        </>
      ) : tab === "arte" ? (
        <>
          <div className="admin-topbar">
            <h3>Mis obras</h3>
            <button className="btn-primary" onClick={() => setEditingArt(null)}>+ Nueva obra</button>
          </div>
          <div className="admin-table">
            {artworks.map((a) => (
              <div className="admin-row" key={a.id}>
                <img
                  className="admin-thumb"
                  src={a.photos[0] ? photoUrl(a.photos[0], ASSET_BASE) : "https://placehold.co/200x150/E8F1FA/163F7A?text=%20"}
                  alt=""
                />
                <div className="admin-row-info">
                  <p className="admin-row-title">{a.title || "(sin título)"}</p>
                  <p className="admin-row-sub">
                    {a.category || "Sin categoría"}{a.price > 0 ? ` · ${formatCurrency(a.price, a.currency)}` : ""}
                  </p>
                </div>
                <select className="input status-select" value={a.status} onChange={(e) => changeArtStatus(a.id, e.target.value)}>
                  {Object.entries(ART_STATUSES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <button className="btn-outline" onClick={() => setEditingArt(a)}>Editar</button>
                <button className="btn-danger" onClick={() => removeArt(a.id)}>Eliminar</button>
              </div>
            ))}
            {artworks.length === 0 && <p className="empty-state">Todavía no publicaste obras.</p>}
          </div>
        </>
      ) : (
        <>
          <div className="admin-topbar">
            <h3>Consultas recibidas</h3>
          </div>
          <p className="hint-text" style={{ marginBottom: 12 }}>
            El nombre y el teléfono de cada persona se completan a mano directamente en la planilla de Google Sheets,
            cuando el mensaje llega por WhatsApp. Acá solo cambiás el estado de la negociación.
          </p>
          <div className="admin-table">
            {inquiries.map((i) => (
              <div className="admin-row" key={i.id}>
                <div className="admin-row-info">
                  <p className="admin-row-title">
                    {i.type === "arte" ? "Arte" : "Propiedad"} — {i.item_title || "(sin título)"}
                  </p>
                  <p className="admin-row-sub">{new Date(i.created_at).toLocaleString("es-AR")}</p>
                </div>
                <select
                  className="input status-select"
                  value={i.status}
                  onChange={(e) => changeInquiryStatus(i.id, e.target.value)}
                >
                  {Object.entries(INQUIRY_STATUSES).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            ))}
            {inquiries.length === 0 && <p className="empty-state">Todavía no llegó ninguna consulta.</p>}
          </div>
        </>
      )}

      {editingProperty !== undefined && (
        <PropertyForm
          initial={editingProperty}
          onCancel={() => setEditingProperty(undefined)}
          onSaved={() => { setEditingProperty(undefined); load(); }}
          showToast={showToast}
        />
      )}

      {editingArt !== undefined && (
        <ArtForm
          initial={editingArt}
          onCancel={() => setEditingArt(undefined)}
          onSaved={() => { setEditingArt(undefined); load(); }}
          showToast={showToast}
        />
      )}
    </div>
  );
}

function PasswordForm({ showToast, onDone }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (next.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (next !== confirm) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }
    setSubmitting(true);
    try {
      await api.changePassword(current, next);
      showToast("Contraseña actualizada");
      onDone();
    } catch (err) {
      setError(err.message || "No se pudo cambiar la contraseña.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="password-form">
      <label className="field-label">Contraseña actual</label>
      <input className="input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
      <label className="field-label">Nueva contraseña</label>
      <input className="input" type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" />
      <label className="field-label">Confirmar nueva contraseña</label>
      <input className="input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      {error && <p className="error-text">{error}</p>}
      <button className="btn-primary" type="submit" disabled={submitting} style={{ marginTop: 8 }}>
        {submitting ? "Guardando…" : "Actualizar contraseña"}
      </button>
    </form>
  );
}
