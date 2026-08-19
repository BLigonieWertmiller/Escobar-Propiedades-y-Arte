export const OPERATIONS = { venta: "Venta", alquiler: "Alquiler" };
export const TYPES = { casa: "Casa", departamento: "Departamento", ph: "PH", terreno: "Terreno", local: "Local comercial" };
export const STATUSES = {
  disponible: { label: "Disponible", color: "#4F7D5C" },
  reservada: { label: "Reservada", color: "#B08D2B" },
  vendida: { label: "Vendida", color: "#C23B2B" },
  alquilada: { label: "Alquilada", color: "#C23B2B" },
};
export const ART_STATUSES = {
  disponible: { label: "Disponible", color: "#4F7D5C" },
  vendida: { label: "Vendida", color: "#C23B2B" },
};
export const INQUIRY_STATUSES = {
  nueva: { label: "Nueva", color: "#1D6FC4" },
  negociacion: { label: "En negociación", color: "#B08D2B" },
  vendida: { label: "Concretada (venta)", color: "#4F7D5C" },
  alquilada: { label: "Concretada (alquiler)", color: "#4F7D5C" },
  cancelada: { label: "Cancelada", color: "#C23B2B" },
};

export function formatCurrency(n, c) {
  return `${c === "USD" ? "U$D" : "$"} ${Number(n).toLocaleString("es-AR")}`;
}

export function whatsappLink(phone, title, id) {
  const text = encodeURIComponent(
    `Hola! Vi "${title}" (ref. ${id.slice(0, 6)}) y me gustaría más información.`
  );
  return `https://wa.me/${phone}?text=${text}`;
}

export function photoUrl(path, assetBase) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${assetBase}${path}`;
}
