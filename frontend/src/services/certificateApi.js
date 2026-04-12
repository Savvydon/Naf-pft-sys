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

// ==================== CERTIFICATE ENDPOINTS ====================

// Create new certificate
export async function createCertificate(certificateData) {
  const response = await fetch(`${API_BASE}/certificates/`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(certificateData),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
}

// Get certificate by ID
export async function getCertificate(certId) {
  const response = await fetch(`${API_BASE}/certificates/${certId}`, {
    credentials: "include",
    headers: getHeaders(),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
}

// Get certificate by PFT result ID
export async function getCertificateByPFT(pftResultId) {
  const response = await fetch(`${API_BASE}/certificates/pft/${pftResultId}`, {
    credentials: "include",
    headers: getHeaders(),
  });

  if (response.status === 404) {
    return null; // No certificate exists
  }

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
}

// Check if certificate exists for PFT
export async function checkCertificateExists(pftResultId) {
  const response = await fetch(`${API_BASE}/certificates/check/${pftResultId}`, {
    credentials: "include",
    headers: getHeaders(),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
}

// Update certificate
export async function updateCertificate(certId, certificateData) {
  const response = await fetch(`${API_BASE}/certificates/${certId}`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(certificateData),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
}

// Get all certificates (SuperAdmin only)
export async function getAllCertificates() {
  const response = await fetch(`${API_BASE}/certificates/`, {
    credentials: "include",
    headers: getHeaders(),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
}

// Delete certificate (SuperAdmin only)
export async function deleteCertificate(certId) {
  const response = await fetch(`${API_BASE}/certificates/${certId}`, {
    method: "DELETE",
    credentials: "include",
    headers: getHeaders(),
  });

  if (!response.ok) {
    await handleError(response);
  }

  return response.json();
}