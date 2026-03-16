const API_BASE = "https://naf-pft-sys-1.onrender.com"; // ← update this if you switch domains
const API = {
  auth: `${API_BASE}/auth`,
  pft: `${API_BASE}/api`, // or /pft-results depending on your backend routing
};

// /**
//  * Helper - creates headers with optional Authorization
//  * @param {string} [token] - JWT token
//  * @returns {HeadersInit}
//  */
function getHeaders(token = null) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Helper - consistent error handling
 * @param {Response} res
 * @returns {Promise<never>}
 */
async function handleError(res) {
  let data = {};
  try {
    data = await res.json();
  } catch {
    // body was not JSON or empty
  }

  const message =
    data.detail || data.message || `Request failed with status ${res.status}`;

  throw new Error(message);
}

// ────────────────────────────────────────────────
//  Auth endpoints
// ────────────────────────────────────────────────

export async function registerUser(userData) {
  const res = await fetch(`${API.auth}/register`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });

  if (!res.ok) await handleError(res);
  return res.json();
}

export async function loginUser(credentials) {
  const res = await fetch(`${API.auth}/login`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(credentials),
  });

  if (!res.ok) await handleError(res);
  return res.json();
}

/**
 * Attempts login → if not found → auto-register → login again
 */
export async function loginOrRegister(credentials) {
  try {
    return await loginUser(credentials);
  } catch (err) {
    const msg = err.message.toLowerCase();
    if (msg.includes("not registered") || msg.includes("404")) {
      await registerUser(credentials);
      return await loginUser(credentials);
    }
    throw err;
  }
}

export async function getCurrentUser(token) {
  const res = await fetch(`${API.auth}/me`, {
    headers: getHeaders(token),
  });

  if (!res.ok) await handleError(res);
  return res.json();
}

// ────────────────────────────────────────────────
//  PFT / Personnel endpoints
// ────────────────────────────────────────────────

export async function getAllPersonnel() {
  const res = await fetch(`${API.pft}/pft-results`);

  if (!res.ok) await handleError(res);
  return res.json();
}

export async function getPersonnelById(id) {
  const res = await fetch(`${API.pft}/pft-results/${id}`);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Record not found");
    }
    await handleError(res);
  }
  return res.json();
}

export async function deletePersonnel(id, token) {
  const res = await fetch(`${API.pft}/pft-results/${id}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });

  if (!res.ok) await handleError(res);

  // Most DELETE endpoints return 204 No Content
  // Return success message or just nothing
  return { success: true, message: "Record deleted" };
}

export async function searchPersonnel(svcNo) {
  if (!svcNo?.trim()) return [];

  const serviceNumber = svcNo.trim().toUpperCase();

  const res = await fetch(`${API.pft}/pft-results/svc/${serviceNumber}`);

  if (res.ok) {
    return res.json();
  }

  if (res.status === 404) {
    return [];
  }

  await handleError(res);
}

// ────────────────────────────────────────────────
//  Admin / Computation endpoint
// ────────────────────────────────────────────────

export async function computeFitness(payload, token) {
  if (!token) {
    throw new Error("Authentication token is required");
  }

  const res = await fetch(`${API.pft}/compute`, {
    method: "POST",
    headers: getHeaders(token),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let data = {};
    try {
      data = await res.json();
    } catch {}

    if (res.status === 409) {
      throw new Error(
        data.detail ||
          "A record already exists for this Service Number and Year.",
      );
    }
    if (res.status === 422) {
      throw new Error(data.detail || "Invalid input data");
    }

    await handleError(res);
  }

  return res.json();
}
