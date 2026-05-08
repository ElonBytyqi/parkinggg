const API = (import.meta.env.VITE_API_BASE?.trim() || "/odata/v4/parking").replace(/\/$/, "");

export async function getZones() {
  const res = await fetch(`${API}/Zones?$expand=spots`);
  if (!res.ok) throw new Error(`GET Zones failed: ${res.status}`);
  const data = await res.json();
  return data.value || [];
}

export async function getSpots() {
  const res = await fetch(`${API}/Spots`);
  if (!res.ok) throw new Error(`GET Spots failed: ${res.status}`);
  const data = await res.json();
  return data.value || [];
}

export async function toggleStatus(ID) {
  const res = await fetch(`${API}/toggleStatus`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ID }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`toggleStatus failed: ${res.status} ${txt}`);
  }
  return true;
}
