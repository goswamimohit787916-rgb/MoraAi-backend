export default {
  async fetch(req, env) {

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Content-Type": "application/json"
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    const url = new URL(req.url);

    // SAFE JSON PARSER
    async function getBody(req) {
      try {
        const text = await req.text();
        if (!text) return {};
        return JSON.parse(text);
      } catch (e) {
        return { error: "Invalid request body" };
      }
    }

    // ---------------- SIGNUP ----------------
    if (url.pathname === "/signup" && req.method === "POST") {

      const d = await getBody(req);

      if (!d.email || !d.password) {
        return new Response(JSON.stringify({
          ok:false,
          error:"Missing email or password"
        }), { headers });
      }

      const id = "user_" + Date.now();

      await env.DB.prepare(
        "INSERT INTO users VALUES (?,?,?,?)"
      ).bind(id, d.email, d.password, 15000).run();

      return new Response(JSON.stringify({ ok:true }), { headers });
    }

    // ---------------- LOGIN ----------------
    if (url.pathname === "/login" && req.method === "POST") {

      const d = await getBody(req);

      if (!d.email || !d.password) {
        return new Response(JSON.stringify({
          ok:false,
          error:"Missing fields"
        }), { headers });
      }

      const user = await env.DB.prepare(
        "SELECT * FROM users WHERE email=?"
      ).bind(d.email).first();

      if (!user || user.password !== d.password) {
        return new Response(JSON.stringify({
          ok:false,
          error:"Invalid login"
        }), { headers });
      }

      return new Response(JSON.stringify({
        ok:true,
        uid:user.id
      }), { headers });
    }

    // ---------------- USER ----------------
    if (url.pathname === "/user") {

      const uid = url.searchParams.get("uid");

      if (!uid) {
        return new Response(JSON.stringify({
          ok:false,
          error:"Missing uid"
        }), { headers });
      }

      const user = await env.DB.prepare(
        "SELECT * FROM users WHERE id=?"
      ).bind(uid).first();

      return new Response(JSON.stringify({ user }), { headers });
    }

    // ---------------- GENERATE ----------------
    if (url.pathname === "/generate" && req.method === "POST") {

      const d = await getBody(req);

      if (!d.uid || !d.text) {
        return new Response(JSON.stringify({
          ok:false,
          error:"Missing uid or text"
        }), { headers });
      }

      const user = await env.DB.prepare(
        "SELECT * FROM users WHERE id=?"
      ).bind(d.uid).first();

      if (!user) {
        return new Response(JSON.stringify({
          ok:false,
          error:"User not found"
        }), { headers });
      }

      const cost = d.text.length;

      if (user.credits < cost) {
        return new Response(JSON.stringify({
          ok:false,
          error:"Not enough credits"
        }), { headers });
      }

      await env.DB.prepare(
        "UPDATE users SET credits = credits - ? WHERE id=?"
      ).bind(cost, d.uid).run();

      return new Response(JSON.stringify({
        ok:true,
        audio:"https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        remaining:user.credits - cost
      }), { headers });
    }

    // ---------------- PAYMENT ----------------
    if (url.pathname === "/verify-payment" && req.method === "POST") {

      const d = await getBody(req);

      if (!d.uid) {
        return new Response(JSON.stringify({
          ok:false,
          error:"Missing uid"
        }), { headers });
      }

      await env.DB.prepare(
        "UPDATE users SET credits = credits + 100000 WHERE id=?"
      ).bind(d.uid).run();

      return new Response(JSON.stringify({ ok:true }), { headers });
    }

    return new Response(JSON.stringify({ ok:true }), { headers });
  }
};
