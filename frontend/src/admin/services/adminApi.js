const API_BASE = "https://naf-pft-sys-1.onrender.com";

// Helper to get token
const getToken = () => localStorage.getItem("pft_token");

// Helper for headers
const getHeaders = (auth = false) => {
  const headers = {
    "Content-Type": "application/json",
  };
  if (auth && getToken()) {
    headers.Authorization = `Bearer ${getToken()}`;
  }
  return headers;
};

// Helper for error handling
async function handleError(res) {
  let data = {};
  try {
    data = await res.json();
  } catch {}
  const message = data.detail || data.message || `Request failed (status ${res.status})`;
  throw new Error(message);
}

// ==================== AUTH (for Admin) ====================

export async function loginAdmin(credentials) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(credentials),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(data.detail || `Login failed (status ${response.status})`);
  }

  // Verify role is admin or super_admin
  if (data.role !== "admin" && data.role !== "super_admin") {
    throw new Error("This login is for Admins only.");
  }

  return data;
}

// ==================== PFT RESULTS (Admin Only) ====================

export async function getAllPersonnel() {
  const response = await fetch(`${API_BASE}/api/pft-results`, {
    headers: getHeaders(true),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Admin access required");
    }
    await handleError(response);
  }

  return response.json();
}

export async function getPersonnelById(id) {
  const response = await fetch(`${API_BASE}/api/pft-results/${id}`, {
    headers: getHeaders(true),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Record not found");
    }
    await handleError(response);
  }

  return response.json();
}

export async function deletePersonnel(id) {
  const response = await fetch(`${API_BASE}/api/pft-results/${id}`, {
    method: "DELETE",
    headers: getHeaders(true),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return { success: true, message: "Record deleted" };
}

export async function searchPersonnel(svcNo) {
  if (!svcNo?.trim()) return [];

  const serviceNumber = svcNo.trim().toUpperCase();

  const response = await fetch(`${API_BASE}/api/pft-results/svc/${serviceNumber}`, {
    headers: getHeaders(true),
  });

  if (response.ok) {
    return response.json();
  }

  if (response.status === 404) {
    return [];
  }

  await handleError(response);
}

export async function updatePersonnel(id, updateData) {
  const response = await fetch(`${API_BASE}/api/pft-results/${id}`, {
    method: "PUT",
    headers: getHeaders(true),
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
}

// const BASE_URL = "https://naf-pft-sys.onrender.com/api";

// export async function getAllPersonnel() {
//   const res = await fetch(`${BASE_URL}/pft-results`);
//   if (!res.ok) {
//     throw new Error(`Failed to fetch personnel: ${res.status}`);
//   }
//   return res.json();
// }

// export async function getPersonnelById(id) {
//   const res = await fetch(`${BASE_URL}/pft-results/${id}`);
//   if (!res.ok) {
//     if (res.status === 404) throw new Error("Record not found");
//     throw new Error(`Failed to fetch record: ${res.status}`);
//   }
//   return res.json();
// }

// export async function deletePersonnel(id) {
//   const res = await fetch(`${BASE_URL}/pft-results/${id}`, {
//     method: "DELETE",
//   });
//   if (!res.ok) {
//     const errData = await res.json().catch(() => ({}));
//     throw new Error(errData.detail || `Delete failed: ${res.status}`);
//   }
//   // Optional: return await res.json(); if you want the message
// }

// export async function searchPersonnel(query) {
//   if (!query?.trim()) return [];

//   const svcNo = query.trim().toUpperCase();
//   const res = await fetch(`${BASE_URL}/pft-results/svc/${svcNo}`);

//   if (res.ok) {
//     return res.json();
//   }

//   if (res.status === 404) {
//     return []; // No results → empty array (clean UX)
//   }

//   throw new Error(`Search failed: ${res.status}`);
// }
