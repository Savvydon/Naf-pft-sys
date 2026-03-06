// Use relative path → goes through Vite proxy in dev
const BASE_URL = "https://naf-pft-sys-1.onrender.com/api";

// For production build (if needed – usually not required)
//const PROD_BASE_URL = "https://naf-pft-sys-1.onrender.com/api";

export async function computeFitness(payload) {
  try {
    const url = `${BASE_URL}/compute`; // ← relative now!

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Try to parse JSON even on error responses
    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      // Handle specific backend errors
      if (response.status === 409) {
        throw new Error(
          data.detail ||
            "A record already exists for this Service Number and Year. Contact admin.",
        );
      }
      if (response.status === 422) {
        throw new Error(
          data.detail || "Invalid input data (validation failed)",
        );
      }
      if (response.status >= 500) {
        throw new Error("Server error – please try again later");
      }

      throw new Error(
        data.detail || `Submission failed (HTTP ${response.status})`,
      );
    }

    return data;
  } catch (err) {
    console.error("computeFitness error:", err);

    if (err.name === "TypeError" && err.message.includes("fetch")) {
      throw new Error(
        "Network error – cannot reach the backend server. Check your internet or try again later.",
      );
    }

    throw err;
  }
}
