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
  const message =
    data.detail || data.message || `Request failed (status ${res.status})`;
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

  // FIXED: Case-insensitive role check, allow both admin and super_admin
  const userRole = (data.role || "").toLowerCase().trim();

  if (userRole !== "admin" && userRole !== "super_admin") {
    throw new Error(
      `This account is registered as "${data.role}". ` +
        `Only Admins can use this login portal.`,
    );
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

  const response = await fetch(
    `${API_BASE}/api/pft-results/svc/${serviceNumber}`,
    {
      headers: getHeaders(true),
    },
  );

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
