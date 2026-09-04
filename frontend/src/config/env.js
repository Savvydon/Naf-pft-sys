const DEFAULT_API_BASE = "https://naf-pft-sys-1.onrender.com";

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE).replace(/\/$/, "");
