export default {
  async fetch(req, env) {

    // 🔥 TEMP SAFE CORS (no credentials issues)
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*"
    };

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const url = new URL(req.url);

    // ================= SIGNUP =================
    if (url.pathname === "/signup") {
      try {
        const { email, password } = await req.json();

        const id = "user_" + Date.now();

        await env.DB.prepare(
          "INSERT INTO users (id,email,password,credits) VALUES (?,?,?,30000)"
        ).bind(id, email, password).run();

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...headers, "Content-Type": "application/json" }
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: "signup failed" }), {
          status: 500,
          headers
        });
      }
    }

    // ================= LOGIN =================
    if (url.pathname === "/login") {
      try {
        const { email, password } = await req.json();

        const user = await env.DB.prepare(
          "SELECT * FROM users WHERE email=? AND password=?"
        ).bind(email, password).first();

        if (!user) {
          return new Response(JSON.stringify({ ok: false }), {
            status: 401,
            headers
          });
        }

        return new Response(JSON.stringify({ ok: true, uid: user.id }), {
          headers: {
            ...headers,
            "Content-Type": "application/json"
          }
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: "login failed" }), {
          status: 500,
          headers
        });
      }
    }

    // ================= USER =================
    if (url.pathname === "/user") {
      const uid = url.searchParams.get("uid");

      if (!uid) {
        return new Response(JSON.stringify({ error: "no uid" }), {
          status: 401,
          headers
        });
      }

      const user = await env.DB.prepare(
        "SELECT id,email,credits FROM users WHERE id=?"
      ).bind(uid).first();

      return new Response(JSON.stringify({ user }), {
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    return new Response("ok", { headers });
  }
};
