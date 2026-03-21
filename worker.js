export default {
  async fetch(req, env) {

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*"
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const url = new URL(req.url);

    // ========= SIGNUP =========
    if (url.pathname === "/signup") {
      let data = JSON.parse(await req.text() || "{}");

      const id = "user_" + Date.now();

      await env.DB.prepare(
        "INSERT INTO users (id, email, password, credits) VALUES (?, ?, ?, ?)"
      ).bind(id, data.email, data.password, 30000).run();

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    // ========= LOGIN =========
    if (url.pathname === "/login") {
      let data = JSON.parse(await req.text() || "{}");

      const user = await env.DB.prepare(
        "SELECT * FROM users WHERE email=? AND password=?"
      ).bind(data.email, data.password).first();

      if (!user) {
        return new Response(JSON.stringify({ ok: false }), { headers });
      }

      return new Response(JSON.stringify({
        ok: true,
        uid: user.id
      }), {
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    // ========= USER =========
    if (url.pathname === "/user") {
      const uid = url.searchParams.get("uid");

      const user = await env.DB.prepare(
        "SELECT id,email,credits FROM users WHERE id=?"
      ).bind(uid).first();

      return new Response(JSON.stringify({ user }), {
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    // ========= SAVE VOICE =========
    if (url.pathname === "/save-voice") {
      let data = JSON.parse(await req.text() || "{}");

      const id = "voice_" + Date.now();

      await env.DB.prepare(
        "INSERT INTO voices (id, user_id, name, pth_base64) VALUES (?, ?, ?, ?)"
      ).bind(id, data.uid, data.name, data.pth).run();

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    // ========= GET VOICES =========
    if (url.pathname === "/voices") {
      const uid = url.searchParams.get("uid");

      const voices = await env.DB.prepare(
        "SELECT id,name FROM voices WHERE user_id=?"
      ).bind(uid).all();

      return new Response(JSON.stringify({ voices }), {
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    return new Response("MoraAI API", { headers });
  }
};
