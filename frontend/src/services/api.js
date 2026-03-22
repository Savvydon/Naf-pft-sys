const API_BASE = "https://naf-pft-sys-1.onrender.com";

// Helper for headers - no token needed, cookies handle auth
const getHeaders = (contentType = true) => {
  const headers = {};
  if (contentType) {
    headers["Content-Type"] = "application/json";
  }
  // No Authorization header - using cookies instead
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

// ==================== AUTH ENDPOINTS ====================

// REGISTER
export async function registerUser(userData) {
  console.log("Register Payload:", userData);
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
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
    headers: getHeaders(),
    credentials: "include", // Important: receives cookie
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

// LOGOUT
export async function logoutUser() {
  const response = await fetch(`${API_BASE}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }

  return response.json();
}

// GET CURRENT USER
export async function getCurrentUser() {
  const response = await fetch(`${API_BASE}/auth/me`, {
    credentials: "include",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get user info (status ${response.status})`);
  }

  return response.json();
}

// CHECK SESSION
export async function checkSession() {
  const response = await fetch(`${API_BASE}/auth/session`, {
    credentials: "include",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Session invalid");
  }

  return response.json();
}

// ==================== PFT / EVALUATOR ENDPOINTS ====================

// COMPUTE FITNESS - Evaluator only
export async function computeFitness(payload) {
  const response = await fetch(`${API_BASE}/api/compute`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
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
    if (response.status === 403) {
      throw new Error(
        "You don't have permission to perform evaluations. Admins cannot evaluate.",
      );
    }
    throw new Error(
      data.detail || `Submission failed (status ${response.status})`,
    );
  }

  return data;
}

// CHECK IF RECORD EXISTS
export async function checkExists(prefix, number, year) {
  const response = await fetch(
    `${API_BASE}/api/exists/${prefix}/${number}/${year}`,
    {
      credentials: "include",
      headers: getHeaders(),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to check existence");
  }

  return response.json();
}

// SEND EMAIL REPORT
export async function sendEmailReport(email, reportData) {
  const response = await fetch(`${API_BASE}/send-report`, {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify({
      email: email,
      report_data: reportData,
    }),
  });

  let data = {};
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(data.detail || "Failed to send email");
  }

  return data;
}

// ==================== ADMIN ENDPOINTS ====================

// Get all PFT results (Admin only)
export async function getAllPFTResults() {
  const response = await fetch(`${API_BASE}/api/pft-results`, {
    credentials: "include",
    headers: getHeaders(),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("Admin access required");
    }
    throw new Error("Failed to fetch results");
  }

  return response.json();
}

// Get PFT result by ID (Admin only)
export async function getPFTResultById(id) {
  const response = await fetch(`${API_BASE}/api/pft-results/${id}`, {
    credentials: "include",
    headers: getHeaders(),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Record not found");
    }
    throw new Error("Failed to fetch record");
  }

  return response.json();
}

// Get PFT results by service number (Admin only)
export async function searchPFTBySvcNo(svcNo) {
  const response = await fetch(`${API_BASE}/api/pft-results/svc/${svcNo}`, {
    credentials: "include",
    headers: getHeaders(),
  });

  if (response.status === 404) {
    return []; // Return empty array if not found
  }

  if (!response.ok) {
    throw new Error("Search failed");
  }

  return response.json();
}

// Update PFT result (Admin only) - Returns full updated record
export async function updatePFTResult(id, updateData) {
  const response = await fetch(`${API_BASE}/api/pft-results/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || "Failed to update record");
  }

  return response.json();
}

// Delete PFT result (Admin only)
export async function deletePFTResult(id) {
  const response = await fetch(`${API_BASE}/api/pft-results/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to delete record");
  }

  return response.json();
}

// ==== old code===
// const API_BASE = "https://naf-pft-sys-1.onrender.com";

// // Helper to get token
// const getToken = () => localStorage.getItem("pft_token");

// // Helper for headers
// const getHeaders = (auth = false) => {
//   const headers = {
//     "Content-Type": "application/json",
//   };
//   if (auth && getToken()) {
//     headers.Authorization = `Bearer ${getToken()}`;
//   }
//   return headers;
// };

// // Helper for error handling
// async function handleError(res) {
//   let data = {};
//   try {
//     data = await res.json();
//   } catch {}
//   const message =
//     data.detail || data.message || `Request failed (status ${res.status})`;
//   throw new Error(message);
// }

// // ==================== AUTH ENDPOINTS ====================

// // REGISTER
// export async function registerUser(userData) {
//   console.log("Register Payload:", userData);
//   const response = await fetch(`${API_BASE}/auth/register`, {
//     method: "POST",
//     headers: getHeaders(),
//     body: JSON.stringify(userData),
//   });

//   let data = {};
//   try {
//     data = await response.json();
//   } catch {}

//   if (!response.ok) {
//     throw new Error(
//       data.detail || `Registration failed (status ${response.status})`,
//     );
//   }

//   return data;
// }

// // LOGIN
// export async function loginUser(credentials) {
//   console.log("Login Payload:", credentials);
//   const response = await fetch(`${API_BASE}/auth/login`, {
//     method: "POST",
//     headers: getHeaders(),
//     body: JSON.stringify(credentials),
//   });

//   let data = {};
//   try {
//     data = await response.json();
//   } catch {}

//   if (!response.ok) {
//     throw new Error(data.detail || `Login failed (status ${response.status})`);
//   }

//   return data;
// }

// // LOGIN OR REGISTER (Auto-register if not exists)
// export async function loginOrRegister(credentials) {
//   try {
//     return await loginUser(credentials);
//   } catch (error) {
//     // If service number not registered → create account
//     if (
//       error.message.toLowerCase().includes("not registered") ||
//       error.message.includes("404")
//     ) {
//       await registerUser(credentials);
//       // try login again
//       return await loginUser(credentials);
//     }
//     throw error;
//   }
// }

// // GET CURRENT USER
// export async function getCurrentUser(token) {
//   const response = await fetch(`${API_BASE}/auth/me`, {
//     headers: getHeaders(true),
//   });

//   if (!response.ok) {
//     throw new Error(`Failed to get user info (status ${response.status})`);
//   }

//   return response.json();
// }

// // ==================== PFT / EVALUATOR ENDPOINTS ====================

// // COMPUTE FITNESS - Evaluator only
// export async function computeFitness(payload) {
//   const response = await fetch(`${API_BASE}/api/compute`, {
//     method: "POST",
//     headers: getHeaders(true),
//     body: JSON.stringify(payload),
//   });

//   let data = {};
//   try {
//     data = await response.json();
//   } catch {}

//   if (!response.ok) {
//     if (response.status === 409) {
//       throw new Error(
//         data.detail ||
//           "A record already exists for this Service Number and Year.",
//       );
//     }
//     if (response.status === 422) {
//       throw new Error(data.detail || "Invalid input data");
//     }
//     if (response.status === 403) {
//       throw new Error(
//         "You don't have permission to perform evaluations. Admins cannot evaluate.",
//       );
//     }
//     throw new Error(
//       data.detail || `Submission failed (status ${response.status})`,
//     );
//   }

//   return data;
// }

// // CHECK IF RECORD EXISTS
// export async function checkExists(prefix, number, year) {
//   const response = await fetch(
//     `${API_BASE}/api/exists/${prefix}/${number}/${year}`,
//     {
//       headers: getHeaders(true),
//     },
//   );

//   if (!response.ok) {
//     throw new Error("Failed to check existence");
//   }

//   return response.json();
// }

// // SEND EMAIL REPORT - Fixed to match backend
// export async function sendEmailReport(email, reportData) {
//   const response = await fetch(`${API_BASE}/send-report`, {
//     method: "POST",
//     headers: getHeaders(true),
//     body: JSON.stringify({
//       email: email,
//       report_data: reportData,
//     }),
//   });

//   let data = {};
//   try {
//     data = await response.json();
//   } catch {}

//   if (!response.ok) {
//     throw new Error(data.detail || "Failed to send email");
//   }

//   return data;
// }

// // ==================== ADMIN ENDPOINTS ====================

// // Get all PFT results (Admin only)
// export async function getAllPFTResults() {
//   const response = await fetch(`${API_BASE}/api/pft-results`, {
//     headers: getHeaders(true),
//   });

//   if (!response.ok) {
//     if (response.status === 403) {
//       throw new Error("Admin access required");
//     }
//     throw new Error("Failed to fetch results");
//   }

//   return response.json();
// }

// // Get PFT result by ID (Admin only)
// export async function getPFTResultById(id) {
//   const response = await fetch(`${API_BASE}/api/pft-results/${id}`, {
//     headers: getHeaders(true),
//   });

//   if (!response.ok) {
//     if (response.status === 404) {
//       throw new Error("Record not found");
//     }
//     throw new Error("Failed to fetch record");
//   }

//   return response.json();
// }

// // Get PFT results by service number (Admin only)
// export async function searchPFTBySvcNo(svcNo) {
//   const response = await fetch(`${API_BASE}/api/pft-results/svc/${svcNo}`, {
//     headers: getHeaders(true),
//   });

//   if (response.status === 404) {
//     return []; // Return empty array if not found
//   }

//   if (!response.ok) {
//     throw new Error("Search failed");
//   }

//   return response.json();
// }

// // Update PFT result (Admin only)
// export async function updatePFTResult(id, updateData) {
//   const response = await fetch(`${API_BASE}/api/pft-results/${id}`, {
//     method: "PUT",
//     headers: getHeaders(true),
//     body: JSON.stringify(updateData),
//   });

//   if (!response.ok) {
//     throw new Error("Failed to update record");
//   }

//   return response.json();
// }

// // Delete PFT result (Admin only)
// export async function deletePFTResult(id) {
//   const response = await fetch(`${API_BASE}/api/pft-results/${id}`, {
//     method: "DELETE",
//     headers: getHeaders(true),
//   });

//   if (!response.ok) {
//     throw new Error("Failed to delete record");
//   }

//   return response.json();
// }
