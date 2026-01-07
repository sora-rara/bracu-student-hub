import axios from "./axios.jsx";

export async function getConnectData() {
  const res = await axios.get("/connect/raw"); // -> /api/connect/raw
  return res.data?.data || [];
}

export async function getMyPicks() {
  const res = await axios.get("/routine/picks"); // -> /api/routine/picks
  return res.data?.data || null;
}

export async function saveMyPicks(payload) {
  const res = await axios.post("/routine/picks", payload);
  return res.data?.data;
}
