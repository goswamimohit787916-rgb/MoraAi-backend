export default {
  async fetch(req, env) {

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
      "Content-Type": "application/json"
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const url = new URL(req.url);

    // ---------- SAFE BODY ----------
    async function body(req) {
      try {
        const t = await req.text();
        return t ? JSON.parse(t) : {};
      } catch { return {}; }
    }

    // ---------- SIGNUP ----------
    if (url.pathname === "/signup") {
      const d = await body(req);

      if (!d.email || !d.password) {
        return new Response(JSON.stringify({ ok:false, error:"missing" }), { headers });
      }

      const existing = await env.DB.prepare(
        "SELECT * FROM users WHERE email=?"
      ).bind(d.email).first();

      if (existing) {
        return new Response(JSON.stringify({ ok:false, error:"User exists" }), { headers });
      }

      const id = "user_" + Date.now();

      await env.DB.prepare(
        "INSERT INTO users (id,email,password,credits) VALUES (?,?,?,?)"
      ).bind(id, d.email, d.password, 30000).run();

      return new Response(JSON.stringify({ ok:true }), { headers });
    }

    // ---------- LOGIN ----------
    if (url.pathname === "/login") {
      const d = await body(req);

      const user = await env.DB.prepare(
        "SELECT * FROM users WHERE email=?"
      ).bind(d.email).first();

      if (!user || user.password !== d.password) {
        return new Response(JSON.stringify({ ok:false }), { headers });
      }

      return new Response(JSON.stringify({
        ok:true,
        uid:user.id
      }), { headers });
    }

    // ---------- USER ----------
    if (url.pathname === "/user") {
      const uid = url.searchParams.get("uid");

      const user = await env.DB.prepare(
        "SELECT id,email,credits FROM users WHERE id=?"
      ).bind(uid).first();

      return new Response(JSON.stringify({ user }), { headers });
    }

    // ---------- SAVE VOICE (.pth base64) ----------
    if (url.pathname === "/save-voice") {
      const d = await body(req);

      const id = "voice_" + Date.now();

      await env.DB.prepare(
        "INSERT INTO voices (id,user_id,name,pth_base64) VALUES (?,?,?,?)"
      ).bind(id, d.uid, d.name, d.pth).run();

      return new Response(JSON.stringify({ ok:true }), { headers });
    }

    // ---------- GET VOICES ----------
    if (url.pathname === "/voices") {
      const uid = url.searchParams.get("uid");

      const res = await env.DB.prepare(
        "SELECT id,name FROM voices WHERE user_id=?"
      ).bind(uid).all();

      return new Response(JSON.stringify({
        voices: res.results
      }), { headers });
    }

    // ---------- GENERATE (TTS) ----------
    if (url.pathname === "/generate") {
      const d = await body(req);

      // 👉 Replace with Lightning API
      // TEMP demo audio
      return new Response(JSON.stringify({
        ok:true,
        audio:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"
      }), { headers });
    }

    return new Response(JSON.stringify({ ok:true }), { headers });
  }
};
