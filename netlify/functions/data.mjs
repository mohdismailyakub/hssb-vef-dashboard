// Tarik vef-data.json LIVE dari OneDrive guna endpoint api.onedrive.com/shares.
// VEF_URL mesti link kongsi ASAL (bentuk ".../:u:/g/personal/.../TOKEN?e=...").
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

// Encode link kongsi -> share ID (format Microsoft: u! + base64url)
function shareId(u) {
  const b64 = Buffer.from(u, "utf8").toString("base64");
  return "u!" + b64.replace(/=+$/, "").replace(/\//g, "_").replace(/\+/g, "-");
}

async function getJson(u) {
  const res = await fetch(u, { headers: { "User-Agent": UA, Accept: "*/*" }, redirect: "follow" });
  if (!res.ok) return null;
  const text = await res.text();
  try { JSON.parse(text); return text; } catch { return null; }
}

export default async () => {
  const url = process.env.VEF_URL;
  const cors = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json; charset=utf-8" };
  if (!url) {
    return new Response(JSON.stringify({ error: "VEF_URL belum di-set" }), { status: 500, headers: cors });
  }

  // Kaedah 1: endpoint shares (pulangkan fail terus, tiada cookie/HTML)
  try {
    const sid = shareId(url);
    const viaShares = await getJson(`https://api.onedrive.com/v1.0/shares/${sid}/root/content`);
    if (viaShares) {
      return new Response(viaShares, { status: 200, headers: { ...cors, "Cache-Control": "public, max-age=60" } });
    }
  } catch (_) {}

  // Kaedah 2: cuba terus (kalau VEF_URL sememangnya direct-download)
  try {
    const direct = await getJson(url);
    if (direct) {
      return new Response(direct, { status: 200, headers: { ...cors, "Cache-Control": "public, max-age=60" } });
    }
  } catch (_) {}

  return new Response(JSON.stringify({ error: "Gagal dapat JSON dari OneDrive (kedua-dua kaedah)" }),
    { status: 502, headers: cors });
};
