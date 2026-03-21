export default {
  async fetch(req, env) {

    // 🔥 Safe CORS (no blocking)
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*"
    };

    // Preflight
    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const url = new URL(req.url);

    // ================= SIGNUP =================
    if (url.pathname === "/signup") {
      try {
        let body = await req.text();
        let data = {};

        try {
          data = JSON.parse(body || "{}");
        } catch (e) {
          return new Response(JSON.stringify({ ok: false, error: "invalid json" }), {
            status: 400,
            headers
          });
        }

        const email = data.email;
        const password = data.password;

        if (!email || !password) {
          return new Response(JSON.stringify({ ok: false, error: "missing data" }), {
            status: 400,
            headers
          });
        }

        const id = "user_" + Date.now();

        await env.DB.prepare(
          "INSERT INTO users (id, email, password, credits) VALUES (?, ?, ?, ?)"
        ).bind(id, email, password, 30000).run();

        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...headers, "Content-Type": "application/json" }
        });

      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), {
          status: 500,
          headers
        });
      }
    }

    // ================= LOGIN =================
    if (url.pathname === "/login") {
      try {
        let body = await req.text();
        let data = {};

        try {
          data = JSON.parse(body || "{}");
        } catch (e) {
          return new Response(JSON.stringify({ ok: false, error: "invalid json" }), {
            status: 400,
            headers
          });
        }

        const email = data.email;
        const password = data.password;

        const user = await env.DB.prepare(
          "SELECT * FROM users WHERE email = ? AND password = ?"
        ).bind(email, password).first();

        if (!user) {
          return new Response(JSON.stringify({ ok: false }), {
            status: 401,
            headers
          });
        }

        return new Response(JSON.stringify({
          ok: true,
          uid: user.id
        }), {
          headers: { ...headers, "Content-Type": "application/json" }
        });

      } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), {
          status: 500,
          headers
        });
      }
    }

    // ================= USER =================
    if (url.pathname === "/user") {
      try {
        const uid = url.searchParams.get("uid");

        if (!uid) {
          return new Response(JSON.stringify({ error: "no uid" }), {
            status: 401,
            headers
          });
        }

        const user = await env.DB.prepare(
          "SELECT id, email, credits FROM users WHERE id = ?"
        ).bind(uid).first();

        return new Response(JSON.stringify({ user }), {
          headers: { ...headers, "Content-Type": "application/json" }
        });

      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), {
          status: 500,
          headers
        });
      }
    }

    // ================= DEFAULT =================
    return new Response("MoraAI API running", { headers });
  }
};
