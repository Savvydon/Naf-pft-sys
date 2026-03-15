const API_BASE = "https://naf-pft-sys-1.onrender.com"; // no trailing slash
// REGISTER
export async function registerUser(userData) {
  console.log("Register Payload:", userData);

  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(
      data.detail || `Registration failed (status ${response.status})`,
    );
  }

  return data;
}

// LOGIN
export async function loginUser(credentials) {
  console.log("Login Payload:", credentials);

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(data.detail || `Login failed (status ${response.status})`);
  }

  return data;
}

// LOGIN OR REGISTER
export async function loginOrRegister(credentials) {
  try {
    return await loginUser(credentials);
  } catch (error) {
    // If service number not registered → create account
    if (
      error.message.toLowerCase().includes("not registered") ||
      error.message.includes("404")
    ) {
      await registerUser(credentials);

      // try login again
      return await loginUser(credentials);
    }

    throw error;
  }
}

// GET CURRENT USER
export async function getCurrentUser(token) {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info (status ${response.status})`);
  }

  return response.json();
}

// COMPUTE FITNESS
export async function computeFitness(payload) {
  const token = localStorage.getItem("pft_token");

  const response = await fetch(`${API_BASE}/api/compute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error(
        data.detail ||
          "A record already exists for this Service Number and Year.",
      );
    }

    if (response.status === 422) {
      throw new Error(data.detail || "Invalid input data");
    }

    throw new Error(
      data.detail || `Submission failed (status ${response.status})`,
    );
  }

  return data;
}
