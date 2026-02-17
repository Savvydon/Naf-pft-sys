//connecting to the backend
const BASE_URL = "https://naf-pft-sys.onrender.com/api";

export async function computeFitness(payload) {
  const response = await fetch(`${BASE_URL}/compute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to compute fitness");
  }

  return response.json();
}
