export default {
  async fetch(req, env) {

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
      "Content-Type": "application/json"
    };

    if (req.method === "OPTIONS") return new Response(null, { headers });

    const url = new URL(req.url);

    async function body(req){
      try { return JSON.parse(await req.text()); }
      catch { return {}; }
    }

    // SIGNUP
    if (url.pathname === "/signup") {
      const d = await body(req);
      const id = "user_" + Date.now();

      await env.DB.prepare(
        "INSERT INTO users VALUES (?,?,?,?)"
      ).bind(id, d.email, d.password, 15000).run();

      return new Response(JSON.stringify({ ok:true }), { headers });
    }

    // LOGIN
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

    // USER
    if (url.pathname === "/user") {
      const uid = url.searchParams.get("uid");

      const user = await env.DB.prepare(
        "SELECT * FROM users WHERE id=?"
      ).bind(uid).first();

      return new Response(JSON.stringify({ user }), { headers });
    }

    // GENERATE
    if (url.pathname === "/generate") {
      const d = await body(req);

      const user = await env.DB.prepare(
        "SELECT * FROM users WHERE id=?"
      ).bind(d.uid).first();

      const cost = d.text.length;

      if (!user || user.credits < cost) {
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

    // PAYMENT
    if (url.pathname === "/verify-payment") {
      const d = await body(req);

      await env.DB.prepare(
        "UPDATE users SET credits = credits + 100000 WHERE id=?"
      ).bind(d.uid).run();

      return new Response(JSON.stringify({ ok:true }), { headers });
    }

    return new Response("OK", { headers });
  }
};
