const API_BASE = "https://naf-pft-sys-1.onrender.com";

const getHeaders = (contentType = true) => {
  const headers = {};
  if (contentType) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
};

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
  console.log("[DEBUG] Attempting login with:", credentials.svc_no);

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(credentials),
  });

  let data = {};
  try {
    data = await response.json();
  } catch (e) {
    console.log("[DEBUG] Parse error:", e);
  }

  console.log("[DEBUG] Full response:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    throw new Error(data.detail || `Login failed (status ${response.status})`);
  }

  const rawRole = data.role;
  console.log("[DEBUG] Raw role value:", rawRole, "Type:", typeof rawRole);

  const userRole = String(rawRole || "unknown")
    .toLowerCase()
    .trim();
  console.log("[DEBUG] Processed role:", userRole);

  if (userRole !== "admin" && userRole !== "super_admin") {
    throw new Error(
      `This account is registered as "${rawRole || "unknown"}". ` +
        `Only Admins can use this login portal.`,
    );
  }

  return data;
}

// ==================== PFT RESULTS (Admin Only) ====================

export async function getAllPersonnel() {
  const response = await fetch(`${API_BASE}/api/pft-results`, {
    credentials: "include",
    headers: getHeaders(),
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
    credentials: "include",
    headers: getHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Record not found");
    }
    await handleError(response);
  }

  return response.json();
}

// ✅ CLIENT-SIDE SEARCH (avoids URL encoding issues)
export async function searchPersonnel(svcNo) {
  if (!svcNo?.trim()) return [];

  const searchTerm = svcNo.trim();
  console.log("[SEARCH] Client-side search for:", searchTerm);

  // Get all records and filter
  const allRecords = await getAllPersonnel();

  // Flexible matching
  const normalizedSearch = searchTerm.toUpperCase().replace(/\//g, "");

  const filtered = allRecords.filter((record) => {
    const recordSvcNo = (record.svc_no || "").toUpperCase();
    const normalizedRecord = recordSvcNo.replace(/\//g, "");

    return (
      recordSvcNo === searchTerm.toUpperCase() ||
      recordSvcNo.includes(searchTerm.toUpperCase()) ||
      normalizedRecord === normalizedSearch
    );
  });

  console.log("[SEARCH] Found", filtered.length, "of", allRecords.length);
  return filtered;
}

export async function deletePersonnel(id) {
  const response = await fetch(`${API_BASE}/api/pft-results/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: getHeaders(),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return { success: true, message: "Record deleted" };
}

// Update personnel with recomputation - Returns full record
export async function updatePersonnel(id, updateData) {
  const response = await fetch(`${API_BASE}/api/pft-results/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
}
