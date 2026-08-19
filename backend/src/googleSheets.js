// Sincroniza las consultas con una planilla de Google Sheets.
//
// Si las variables de entorno GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY y
// GOOGLE_SHEET_ID no están configuradas, este módulo no hace nada (las consultas
// se siguen guardando normalmente en la base de datos local, solo que no se
// reflejan en ninguna planilla). Así el resto de la app funciona igual aunque
// todavía no hayas conectado Google Sheets.

const SHEET_TAB = process.env.GOOGLE_SHEET_TAB || "Consultas";
const HEADERS = ["Fecha", "Tipo", "Publicación", "Nombre", "Teléfono", "Estado"];

let sheetsClient = null;
let initTried = false;

function isConfigured() {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_SHEET_ID
  );
}

async function getClient() {
  if (sheetsClient) return sheetsClient;
  if (initTried) return null; // ya lo intentamos y falló, no reintentar en cada request
  initTried = true;

  if (!isConfigured()) {
    console.warn(
      "[Google Sheets] No configurado (faltan GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY / GOOGLE_SHEET_ID). " +
        "Las consultas se guardan igual en la base de datos, pero no se copian a ninguna planilla."
    );
    return null;
  }

  try {
    const { google } = require("googleapis");
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      // El private key suele venir con \n escapados al pegarlo en un .env
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    sheetsClient = google.sheets({ version: "v4", auth });
    await ensureHeaderRow();
    return sheetsClient;
  } catch (err) {
    console.error("[Google Sheets] No se pudo inicializar el cliente:", err.message);
    sheetsClient = null;
    return null;
  }
}

async function ensureHeaderRow() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const res = await sheetsClient.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_TAB}!A1:F1`,
  });
  const hasHeaders = res.data.values && res.data.values.length > 0;
  if (!hasHeaders) {
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_TAB}!A1:F1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADERS] },
    });
  }
}

// Agrega una fila nueva y devuelve el número de fila (para poder editarla después).
async function appendInquiryRow(inquiry) {
  const client = await getClient();
  if (!client) return null;

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  const row = [
    new Date(inquiry.created_at).toLocaleString("es-AR"),
    inquiry.type === "arte" ? "Arte" : "Propiedad",
    inquiry.item_title,
    inquiry.name || "",
    inquiry.phone,
    inquiry.status,
  ];

  try {
    const res = await client.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_TAB}!A:F`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
    const updatedRange = res.data.updates && res.data.updates.updatedRange; // ej: "Consultas!A5:F5"
    if (!updatedRange) return null;
    const match = updatedRange.match(/![A-Z]+(\d+):/);
    return match ? Number(match[1]) : null;
  } catch (err) {
    console.error("[Google Sheets] No se pudo agregar la fila:", err.message);
    return null;
  }
}

// Actualiza solo la columna de estado (F) de una fila ya existente.
async function updateInquiryStatusInSheet(rowNumber, status) {
  if (!rowNumber) return;
  const client = await getClient();
  if (!client) return;

  const spreadsheetId = process.env.GOOGLE_SHEET_ID;
  try {
    await client.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_TAB}!F${rowNumber}`,
      valueInputOption: "RAW",
      requestBody: { values: [[status]] },
    });
  } catch (err) {
    console.error("[Google Sheets] No se pudo actualizar el estado:", err.message);
  }
}

module.exports = { isConfigured, appendInquiryRow, updateInquiryStatusInSheet };
