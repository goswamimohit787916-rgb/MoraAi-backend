export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = { headers: { "Access-Control-Allow-Origin": "*" } };

    if (url.pathname === "/generate" && req.method === "POST") {
      const { text } = await req.json();
      // TODO: connect Lightning AI here later
      return Response.json({ audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3" }, cors);
    }

    if (url.pathname === "/clone-voice" && req.method === "POST") {
      // Saves .pth metadata to D1
      await env.DB.prepare("INSERT OR REPLACE INTO voice_clones (email, pth_file) VALUES (?, ?)").bind("john@example.com", "cloned.pth").run();
      return Response.json({ success: true }, cors);
    }

    return new Response("OK", cors);
  }
};
