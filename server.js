const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', database: 'SQLite' });
});

app.get('/api/albums', (req, res) => {
  res.json(db.prepare('SELECT id, name, created_at FROM albums ORDER BY name').all());
});

app.post('/api/albums', (req, res) => {
  const name = req.body && req.body.name;
  if (typeof name !== 'string' || !name.trim()) return res.status(400).json({ error: 'Album name is required' });
  try {
    const result = db.prepare('INSERT INTO albums (name) VALUES (?)').run(name.trim());
    res.status(201).json(db.prepare('SELECT id, name, created_at FROM albums WHERE id = ?').get(result.lastInsertRowid));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Album already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(port, () => console.log(`Server started on port ${port}`));
