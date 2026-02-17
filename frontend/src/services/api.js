const BASE_URL = "http://127.0.0.1:8000/api";

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
