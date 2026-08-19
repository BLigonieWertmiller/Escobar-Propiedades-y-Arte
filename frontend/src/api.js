const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...options,
  });

  let data = null;
  try {
    data = await res.json();
  } catch (e) {
    // respuesta sin cuerpo (por ejemplo, 204)
  }

  if (!res.ok) {
    const message = (data && data.error) || `Error ${res.status}`;
    throw new Error(message);
  }
  return data;
}

export const api = {
  // Propiedades
  getProperties: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null)
    ).toString();
    return request(`/properties${qs ? `?${qs}` : ""}`);
  },
  getProperty: (id) => request(`/properties/${id}`),
  createProperty: (payload) => request("/properties", { method: "POST", body: JSON.stringify(payload) }),
  updateProperty: (id, payload) => request(`/properties/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  updateStatus: (id, status) =>
    request(`/properties/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteProperty: (id) => request(`/properties/${id}`, { method: "DELETE" }),

  // Arte
  getArtworks: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== "" && v !== undefined && v !== null)
    ).toString();
    return request(`/artworks${qs ? `?${qs}` : ""}`);
  },
  getArtwork: (id) => request(`/artworks/${id}`),
  createArtwork: (payload) => request("/artworks", { method: "POST", body: JSON.stringify(payload) }),
  updateArtwork: (id, payload) => request(`/artworks/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  updateArtworkStatus: (id, status) =>
    request(`/artworks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
  deleteArtwork: (id) => request(`/artworks/${id}`, { method: "DELETE" }),

  // Configuración
  getSettings: () => request("/settings"),
  updateSettings: (payload) => request("/settings", { method: "PUT", body: JSON.stringify(payload) }),

  // Imágenes
  uploadPhotos: (files) => {
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("photos", f));
    return request("/uploads", { method: "POST", body: form });
  },

  // Autenticación
  login: (username, password) =>
    request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
  changePassword: (currentPassword, newPassword) =>
    request("/auth/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }),

  // Consultas (registro silencioso al tocar "Consultar por WhatsApp")
  createInquiry: (payload) => request("/inquiries", { method: "POST", body: JSON.stringify(payload) }),
  getInquiries: () => request("/inquiries"),
  updateInquiryStatus: (id, status) =>
    request(`/inquiries/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
};

export const ASSET_BASE = API_URL.replace(/\/api$/, "");
