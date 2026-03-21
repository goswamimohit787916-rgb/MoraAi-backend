CREATE TABLE users (
  uid TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  credits INTEGER DEFAULT 5000,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE voice_clones (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  name TEXT,
  r2_path TEXT, -- Link to .pth file in R2
  FOREIGN KEY(user_id) REFERENCES users(uid)
);

