import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono<{ Bindings: { DB: D1Database, BUCKET: R2Bucket } }>();
app.use('/*', cors());

// 1. User Auth & Sync
app.post('/login', async (c) => {
  const { uid, email } = await c.req.json();
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE uid = ?").bind(uid).first();
  
  if (!user) {
    await c.env.DB.prepare("INSERT INTO users (uid, email) VALUES (?, ?)").bind(uid, email).run();
  }
  return c.json({ ok: true });
});

// 2. Credit Management
app.get('/user', async (c) => {
  const uid = c.req.query('uid');
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE uid = ?").bind(uid).first();
  return c.json({ user });
});

// 3. Generate Audio (Logic)
app.post('/generate', async (c) => {
  const { uid, text, voice } = await c.req.json();
  const cost = text.length;

  const user = await c.env.DB.prepare("SELECT credits FROM users WHERE uid = ?").bind(uid).first();
  if (!user || user.credits < cost) return c.json({ ok: false, error: "Insufficient credits" });

  // Deduct Credits
  await c.env.DB.prepare("UPDATE users SET credits = credits - ? WHERE uid = ?").bind(cost, uid).run();

  // MOCK: In a real scenario, you'd call an RVC/TTS GPU endpoint here
  const mockAudioUrl = `https://r2.moraai.com/outputs/${uid}_${Date.now()}.mp3`;
  
  return c.json({ ok: true, audio: mockAudioUrl });
});

export default app;

