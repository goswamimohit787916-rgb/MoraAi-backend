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

    // 🔧 SAFE BODY PARSER
    async function getBody(req) {
      try {
        const text = await req.text();
        return text ? JSON.parse(text) : {};
      } catch {
        return {};
      }
    }

    // ================= SIGNUP =================
    if (url.pathname === "/signup") {
      const data = await getBody(req);

      if (!data.email || !data.password) {
        return new Response(JSON.stringify({
          ok: false,
          error: "missing data"
        }), { headers });
      }

      try {
        // 🔥 CHECK EXISTING USER
        const existing = await env.DB.prepare(
          "SELECT * FROM users WHERE email=?"
        ).bind(data.email).first();

        if (existing) {
          return new Response(JSON.stringify({
            ok: false,
            error: "User already exists"
          }), { headers });
        }

        const id = "user_" + Date.now();

        await env.DB.prepare(
          "INSERT INTO users (id, email, password, credits) VALUES (?, ?, ?, ?)"
        ).bind(id, data.email, data.password, 30000).run();

        return new Response(JSON.stringify({ ok: true }), { headers });

      } catch (e) {
        return new Response(JSON.stringify({
          ok: false,
          error: e.message
        }), { headers });
      }
    }

    // ================= LOGIN =================
    if (url.pathname === "/login") {
      const data = await getBody(req);

      try {
        const user = await env.DB.prepare(
          "SELECT * FROM users WHERE email=? ORDER BY rowid DESC LIMIT 1"
        ).bind(data.email).first();

        if (!user || user.password !== data.password) {
          return new Response(JSON.stringify({ ok: false }), { headers });
        }

        return new Response(JSON.stringify({
          ok: true,
          uid: user.id
        }), { headers });

      } catch (e) {
        return new Response(JSON.stringify({
          ok: false,
          error: e.message
        }), { headers });
      }
    }

    // ================= USER =================
    if (url.pathname === "/user") {
      const uid = url.searchParams.get("uid");

      try {
        const user = await env.DB.prepare(
          "SELECT id,email,credits FROM users WHERE id=?"
        ).bind(uid).first();

        return new Response(JSON.stringify({ user }), { headers });

      } catch (e) {
        return new Response(JSON.stringify({
          error: e.message
        }), { headers });
      }
    }

    // ================= SAVE VOICE =================
    if (url.pathname === "/save-voice") {
      const data = await getBody(req);

      try {
        const id = "voice_" + Date.now();

        await env.DB.prepare(
          "INSERT INTO voices (id, user_id, name, pth_base64) VALUES (?, ?, ?, ?)"
        ).bind(id, data.uid, data.name, data.pth).run();

        return new Response(JSON.stringify({ ok: true }), { headers });

      } catch (e) {
        return new Response(JSON.stringify({
          ok: false,
          error: e.message
        }), { headers });
      }
    }

    // ================= GET VOICES =================
    if (url.pathname === "/voices") {
      const uid = url.searchParams.get("uid");

      try {
        const result = await env.DB.prepare(
          "SELECT id,name FROM voices WHERE user_id=?"
        ).bind(uid).all();

        return new Response(JSON.stringify({
          voices: result.results
        }), { headers });

      } catch (e) {
        return new Response(JSON.stringify({
          error: e.message
        }), { headers });
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers });
  }
};
