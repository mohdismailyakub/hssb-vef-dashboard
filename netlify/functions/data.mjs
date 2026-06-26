export default async () => {
  const url = process.env.VEF_URL;
  const cors = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json; charset=utf-8" };

  if (!url) {
    return new Response(JSON.stringify({ error: "VEF_URL belum di-set di Netlify" }),
      { status: 500, headers: cors });
  }
  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      redirect: "follow",
    });
    if (!upstream.ok) throw new Error("OneDrive status " + upstream.status);
    const text = await upstream.text();
    JSON.parse(text);
    return new Response(text, {
      status: 200,
      headers: { ...cors, "Cache-Control": "public, max-age=60" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 502, headers: cors });
  }
};
