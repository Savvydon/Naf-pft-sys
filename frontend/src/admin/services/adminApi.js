const BASE_URL = "https://naf-pft-sys.onrender.com/api";

export async function getAllPersonnel() {
  const res = await fetch(`${BASE_URL}/pft-results`);
  if (!res.ok) {
    throw new Error(`Failed to fetch personnel: ${res.status}`);
  }
  return res.json();
}

export async function getPersonnelById(id) {
  const res = await fetch(`${BASE_URL}/pft-results/${id}`);
  if (!res.ok) {
    if (res.status === 404) throw new Error("Record not found");
    throw new Error(`Failed to fetch record: ${res.status}`);
  }
  return res.json();
}

export async function deletePersonnel(id) {
  const res = await fetch(`${BASE_URL}/pft-results/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || `Delete failed: ${res.status}`);
  }
  // Optional: return await res.json(); if you want the message
}

export async function searchPersonnel(query) {
  if (!query?.trim()) return [];

  const svcNo = query.trim().toUpperCase();
  const res = await fetch(`${BASE_URL}/pft-results/svc/${svcNo}`);

  if (res.ok) {
    return res.json();
  }

  if (res.status === 404) {
    return []; // No results → empty array (clean UX)
  }

  throw new Error(`Search failed: ${res.status}`);
}
