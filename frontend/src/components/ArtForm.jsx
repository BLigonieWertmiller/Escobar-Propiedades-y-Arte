import { useRef, useState } from "react";
import { api, ASSET_BASE } from "../api";
import { ART_STATUSES, photoUrl } from "../constants";

function emptyArtwork() {
  return { id: null, title: "", category: "", price: "", currency: "ARS", description: "", photos: [], status: "disponible" };
}

export default function ArtForm({ initial, onCancel, onSaved, showToast }) {
  const [form, setForm] = useState(initial ? { ...initial, photos: [...initial.photos] } : emptyArtwork());
  const [showPrice, setShowPrice] = useState(initial ? initial.price > 0 : false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

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
    if (!form.title.trim()) {
      setError("Completá al menos el título de la obra.");
      return;
    }
    setError("");
    try {
      if (form.id) {
        await api.updateArtwork(form.id, form);
        showToast("Obra actualizada");
      } else {
        await api.createArtwork(form);
        showToast("Obra publicada");
      }
      onSaved();
    } catch (err) {
      setError(err.message || "No se pudo guardar la obra.");
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form className="form-modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h2>{form.id ? "Editar obra" : "Nueva obra"}</h2>

        <label className="field-label">Título</label>
        <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Atardecer sobre la cordillera" />

        <div className="form-grid-2">
          <div>
            <label className="field-label">Categoría / técnica</label>
            <input className="input" value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Pintura al óleo, Cerámica, Fotografía…" />
          </div>
          <div>
            <label className="field-label">Estado</label>
            <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
              {Object.entries(ART_STATUSES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-grid-2">
          <div>
            <label className="field-label">Precio (opcional, 0 = "consultar")</label>
            <input className="input" type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)} />
          </div>
          <div>
            <label className="field-label">Moneda</label>
            <select className="input" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <label className="field-label">Descripción</label>
        <textarea className="input textarea" rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Técnica, medidas, materiales…" />

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
          <button type="submit" className="btn-primary" disabled={uploading}>Guardar obra</button>
        </div>
      </form>
    </div>
  );
}
