import { useRef, useState } from "react";
import { api, ASSET_BASE } from "../api";
import { OPERATIONS, TYPES, STATUSES, photoUrl } from "../constants";

function emptyProperty() {
  return {
    id: null,
    title: "",
    operation: "venta",
    type: "casa",
    price: "",
    currency: "USD",
    location: "",
    address: "",
    bedrooms: "",
    bathrooms: "",
    area: "",
    description: "",
    features: [],
    photos: [],
    status: "disponible",
  };
}

export default function PropertyForm({ initial, onCancel, onSaved, showToast }) {
  const [form, setForm] = useState(initial ? { ...initial, features: [...initial.features], photos: [...initial.photos] } : emptyProperty());
  const [featureText, setFeatureText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addFeature = () => {
    if (!featureText.trim()) return;
    set("features", [...form.features, featureText.trim()]);
    setFeatureText("");
  };
  const removeFeature = (i) => set("features", form.features.filter((_, idx) => idx !== i));

  const handleFiles = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    try {
      const { urls } = await api.uploadPhotos(files);
      set("photos", [...form.photos, ...urls]);
    } catch (err) {
      setError(err.message || "No se pudieron subir las imágenes.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removePhoto = (i) => set("photos", form.photos.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.price || !form.location.trim()) {
      setError("Completá al menos título, precio y ubicación.");
      return;
    }
    setError("");
    try {
      if (form.id) {
        await api.updateProperty(form.id, form);
        showToast("Propiedad actualizada");
      } else {
        await api.createProperty(form);
        showToast("Propiedad publicada");
      }
      onSaved();
    } catch (err) {
      setError(err.message || "No se pudo guardar la propiedad.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form className="form-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{form.id ? "Editar propiedad" : "Nueva propiedad"}</h2>

        <label className="field-label">Título</label>
        <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Casa con parral y quincho" />

        <div className="form-grid-2">
          <div>
            <label className="field-label">Operación</label>
            <select className="input" value={form.operation} onChange={(e) => set("operation", e.target.value)}>
              {Object.entries(OPERATIONS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Tipo</label>
            <select className="input" value={form.type} onChange={(e) => set("type", e.target.value)}>
              {Object.entries(TYPES).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-3">
          <div>
            <label className="field-label">Precio</label>
            <input className="input" type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Moneda</label>
            <select className="input" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </div>
          <div>
            <label className="field-label">Estado</label>
            <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
              {Object.entries(STATUSES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div>
            <label className="field-label">Ubicación (barrio, ciudad)</label>
            <input className="input" value={form.location} onChange={(e) => set("location", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Dirección</label>
            <input className="input" value={form.address} onChange={(e) => set("address", e.target.value)} />
          </div>
        </div>

        <div className="form-grid-3">
          <div>
            <label className="field-label">Dormitorios</label>
            <input className="input" type="number" min="0" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Baños</label>
            <input className="input" type="number" min="0" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Superficie (m²)</label>
            <input className="input" type="number" min="0" value={form.area} onChange={(e) => set("area", e.target.value)} />
          </div>
        </div>

        <label className="field-label">Descripción</label>
        <textarea className="input textarea" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} />

        <label className="field-label">Características</label>
        <div className="tag-input-row">
          <input
            className="input"
            value={featureText}
            onChange={(e) => setFeatureText(e.target.value)}
            placeholder="Ej: Pileta"
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
          />
          <button type="button" className="btn-outline" onClick={addFeature}>Agregar</button>
        </div>
        <div className="feature-list">
          {form.features.map((f, i) => (
            <span key={i} className="feature-tag feature-tag-removable" onClick={() => removeFeature(i)}>
              {f} ×
            </span>
          ))}
        </div>

        <label className="field-label">Fotos</label>
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={handleFiles} disabled={uploading} />
        {uploading && <p className="hint-text">Subiendo imágenes…</p>}
        <div className="photo-preview-row">
          {form.photos.map((ph, i) => (
            <div key={i} className="photo-preview">
              <img src={photoUrl(ph, ASSET_BASE)} alt="" />
              <button type="button" className="photo-remove" onClick={() => removePhoto(i)}>×</button>
            </div>
          ))}
          {form.photos.length === 0 && <p className="hint-text">Sin fotos todavía — subí una o más imágenes (máx. 5MB cada una).</p>}
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="btn-primary" disabled={uploading}>Guardar propiedad</button>
        </div>
      </form>
    </div>
  );
}
