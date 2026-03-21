export default {
  async fetch(req, env) {

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Allow-Methods": "*",
      "Access-Control-Allow-Credentials": "true"
    };

    if (req.method === "OPTIONS") {
      return new Response(null,{headers});
    }

    const url = new URL(req.url);

    if (url.pathname === "/signup") {
      const d = await req.json();
      const id = "user_"+Date.now();

      await env.DB.prepare(
        "INSERT INTO users VALUES (?,?,?,30000)"
      ).bind(id,d.email,d.password).run();

      return new Response("ok",{headers});
    }

    if (url.pathname === "/login") {
      const d = await req.json();

      const user = await env.DB.prepare(
        "SELECT * FROM users WHERE email=? AND password=?"
      ).bind(d.email,d.password).first();

      if(!user) return new Response("fail",{status:401,headers});

      return new Response("ok",{
        headers:{
          ...headers,
          "Set-Cookie":`uid=${user.id}; Path=/; SameSite=None; Secure`
        }
      });
    }

    const cookie = req.headers.get("Cookie")||"";
    const uid = cookie.split("uid=")[1]?.split(";")[0];

    if(!uid) return new Response("no auth",{status:401,headers});

    if (url.pathname === "/user") {
      const user = await env.DB.prepare(
        "SELECT credits FROM users WHERE id=?"
      ).bind(uid).first();

      return Response.json({user},{headers});
    }

    return new Response("ok",{headers});
  }
};
