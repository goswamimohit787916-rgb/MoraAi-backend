export default {
  async fetch(req, env) {

    const headers = {
      "Access-Control-Allow-Origin": "https://moraai.pages.dev",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Credentials": "true"
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const url = new URL(req.url);

    // SIGNUP
    if (url.pathname === "/signup") {
      const { email, password } = await req.json();

      const id = "user_" + Date.now();

      await env.DB.prepare(
        "INSERT INTO users (id,email,password,credits) VALUES (?,?,?,30000)"
      ).bind(id, email, password).run();

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...headers, "Content-Type": "application/json" }
      });
    }

    // LOGIN
    if (url.pathname === "/login") {
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

      return new Response(JSON.stringify({ ok: true }), {
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Set-Cookie": `uid=${user.id}; Path=/; SameSite=None; Secure`
        }
      });
    }

    // AUTH
    const cookie = req.headers.get("Cookie") || "";
    const uid = cookie.split("uid=")[1]?.split(";")[0];

    if (!uid) {
      return new Response(JSON.stringify({ error: "no auth" }), {
        status: 401,
        headers
      });
    }

    // USER
    if (url.pathname === "/user") {
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
