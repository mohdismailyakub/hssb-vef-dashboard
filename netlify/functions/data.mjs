// Tarik vef-data.json LIVE dari OneDrive. SharePoint perlukan cookie dibawa sepanjang
// redirect (macam "cookie jar" curl) — fetch biasa tak buat, sebab tu kita ikut redirect manual.
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";

async function fetchWithCookies(startUrl, maxHops = 8) {
  let url = startUrl;
  let cookies = "";
  for (let i = 0; i < maxHops; i++) {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, "Accept": "*/*", ...(cookies ? { Cookie: cookies } : {}) },
      redirect: "manual",
    });
    // Kumpul cookie dari setiap hop
    let setList = [];
    try { setList = res.headers.getSetCookie ? res.headers.getSetCookie() : []; } catch (_) {}
    if (!setList.length) {
      const sc = res.headers.get("set-cookie");
      if (sc) setList = [sc];
    }
    if (setList.length) {
      const jar = setList.map((c) => c.split(";")[0]).join("; ");
      cookies = cookies ? cookies + "; " + jar : jar;
    }
    // Ikut redirect
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) return res;
      url = new URL(loc, url).toString();
      continue;
    }
    return res; // 200 atau error sebenar
  }
  throw new Error("terlalu banyak redirect");
}

export default async () => {
  const url = process.env.VEF_URL;
  const cors = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json; charset=utf-8" };
  if (!url) {
    return new Response(JSON.stringify({ error: "VEF_URL belum di-set di Netlify" }),
      { status: 500, headers: cors });
  }
  try {
    const res = await fetchWithCookies(url);
    if (!res.ok) throw new Error("OneDrive status " + res.status);
    const text = await res.text();
    JSON.parse(text); // pastikan JSON sah, bukan page HTML
    return new Response(text, { status: 200, headers: { ...cors, "Cache-Control": "public, max-age=60" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 502, headers: cors });
  }
};
