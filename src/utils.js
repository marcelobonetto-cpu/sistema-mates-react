export const STORAGE_KEY = "sistema_mates_v1";

export function money(value) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function uid() {
  return Date.now() + Math.floor(Math.random() * 10000);
}

export function downloadCSV(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function roleLabel(role) {
  if (role === "superadmin") return "Super Admin";
  if (role === "admin") return "Administrador";
  return "Vendedor";
}
