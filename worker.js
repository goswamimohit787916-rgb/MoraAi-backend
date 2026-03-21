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

    async function safeBody(req) {
      try {
        const t = await req.text();
        return t ? JSON.parse(t) : {};
      } catch {
        return {};
      }
    }

    // ========= SIGNUP =========
    if (url.pathname === "/signup") {
      try {
        const data = await safeBody(req);

        if (!data.email || !data.password) {
          return new Response(JSON.stringify({ ok: false, error: "missing" }), { headers });
        }

        const id = "user_" + Date.now();

        // 🔥 IMPORTANT: no await freeze risk
        await Promise.race([
          env.DB.prepare(
            "INSERT INTO users (id, email, password, credits) VALUES (?, ?, ?, ?)"
          ).bind(id, data.email, data.password, 30000).run(),
          new Promise((_, reject) => setTimeout(() => reject("timeout"), 3000))
        ]);

        return new Response(JSON.stringify({ ok: true }), { headers });

      } catch (e) {
        return new Response(JSON.stringify({
          ok: false,
          error: String(e)
        }), { headers });
      }
    }

    // ========= LOGIN =========
    if (url.pathname === "/login") {
      try {
        const data = await safeBody(req);

        const user = await Promise.race([
          env.DB.prepare(
            "SELECT * FROM users WHERE email=? AND password=?"
          ).bind(data.email, data.password).first(),
          new Promise((_, reject) => setTimeout(() => reject("timeout"), 3000))
        ]);

        if (!user) {
          return new Response(JSON.stringify({ ok: false }), { headers });
        }

        return new Response(JSON.stringify({
          ok: true,
          uid: user.id
        }), { headers });

      } catch (e) {
        return new Response(JSON.stringify({
          ok: false,
          error: String(e)
        }), { headers });
      }
    }

    // ========= USER =========
    if (url.pathname === "/user") {
      try {
        const uid = url.searchParams.get("uid");

        const user = await env.DB.prepare(
          "SELECT id,email,credits FROM users WHERE id=?"
        ).bind(uid).first();

        return new Response(JSON.stringify({ user }), { headers });

      } catch (e) {
        return new Response(JSON.stringify({ error: String(e) }), { headers });
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers });
  }
};
