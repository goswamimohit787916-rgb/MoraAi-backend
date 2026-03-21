// index.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': '*' } };

    // CREATE TABLES ON FIRST RUN
    await env.DB.exec(`
      CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, credits INTEGER DEFAULT 15000);
      CREATE TABLE IF NOT EXISTS generations (id INTEGER PRIMARY KEY, email TEXT, text TEXT, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS voice_clones (email TEXT PRIMARY KEY, pth_file TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      INSERT OR IGNORE INTO users (email, credits) VALUES ('john@example.com', 15000);
    `);

    // GET CREDITS
    if (url.pathname === '/credits') {
      const email = url.searchParams.get('email');
      const { results } = await env.DB.prepare('SELECT credits FROM users WHERE email = ?').bind(email).all();
      const used = 15000 - (results[0]?.credits || 0);
      return Response.json({ used: used }, cors);
    }

    // GENERATE VOICE (placeholder until you connect Lightning AI)
    if (url.pathname === '/generate' && request.method === 'POST') {
      const { email, text } = await request.json();
      
      // Deduct credits (2 chars = 1 credit for demo)
      const used = Math.floor(text.length / 2);
      await env.DB.prepare('UPDATE users SET credits = credits - ? WHERE email = ?').bind(used, email).run();

      // Record generation
      await env.DB.prepare('INSERT INTO generations (email, text) VALUES (?, ?)').bind(email, text).run();

      // Return a working public demo audio (replace later with Lightning AI URL)
      return Response.json({
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3",
        message: "Audio generated (Lightning AI placeholder)"
      }, cors);
    }

    // CLONE VOICE – stores metadata + you can later save .pth to R2
    if (url.pathname === '/clone-voice' && request.method === 'POST') {
      const form = await request.formData();
      const email = form.get('email');
      const file = form.get('audio');

      // For now we just record (you will replace with Lightning AI call + R2 upload)
      await env.DB.prepare('INSERT OR REPLACE INTO voice_clones (email, pth_file) VALUES (?, ?)').bind(email, file.name + '.pth').run();

      return Response.json({ success: true, message: `.pth file bound to ${email} in D1` }, cors);
    }

    return new Response('Not found', { status: 404 });
  }
};
