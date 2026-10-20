const express = require('express');
const path = require('path');
const db = require('./db');
const data = require('./data');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', database: 'SQLite', timestamp: new Date().toISOString() });
});

app.get('/api/albums', (req, res) => {
  res.json(data.getAlbums());
});

app.post('/api/albums', (req, res) => {
  const name = req.body && req.body.name;
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Album name is required' });
  }
  try {
    res.status(201).json(data.createAlbum(name));
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Album already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/albums/:id', (req, res) => {
  const id = Number(req.params.id);
  const name = req.body && req.body.name;
  if (!Number.isInteger(id) || id < 1 || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Valid ID and album name are required' });
  }
  try {
    const album = data.updateAlbum(id, name);
    if (!album) return res.status(404).json({ error: 'Album not found' });
    res.json(album);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(409).json({ error: 'Album already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/albums/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid album ID' });
  if (!data.deleteAlbum(id)) return res.status(404).json({ error: 'Album not found' });
  res.status(204).end();
});

app.get('/api/photos', (req, res) => {
  const filters = {};
  if (req.query.album_id !== undefined) {
    const albumId = Number(req.query.album_id);
    if (!Number.isInteger(albumId) || albumId < 1) return res.status(400).json({ error: 'Invalid album_id' });
    filters.albumId = albumId;
  }
  if (req.query.tag !== undefined) filters.tag = String(req.query.tag).trim();
  res.json(data.getPhotos(filters));
});

app.post('/api/photos', (req, res) => {
  const body = req.body || {};
  const albumId = Number(body.album_id);
  if (!Number.isInteger(albumId) || albumId < 1 ||
      ![body.filename, body.caption].every(value => typeof value === 'string' && value.trim())) {
    return res.status(400).json({ error: 'Album, filename and caption are required' });
  }
  if (!db.prepare('SELECT id FROM albums WHERE id = ?').get(albumId)) {
    return res.status(400).json({ error: 'Album not found' });
  }
  try {
    res.status(201).json(data.createPhoto({ ...body, album_id: albumId }));
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/photos/:id', (req, res) => {
  const id = Number(req.params.id);
  const body = req.body || {};
  const albumId = Number(body.album_id);
  if (!Number.isInteger(id) || id < 1 || !Number.isInteger(albumId) || albumId < 1 ||
      ![body.filename, body.caption].every(value => typeof value === 'string' && value.trim())) {
    return res.status(400).json({ error: 'Valid ID, album, filename and caption are required' });
  }
  if (!db.prepare('SELECT id FROM albums WHERE id = ?').get(albumId)) {
    return res.status(400).json({ error: 'Album not found' });
  }
  const photo = data.updatePhoto(id, { ...body, album_id: albumId });
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  res.json(photo);
});

app.delete('/api/photos/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Invalid photo ID' });
  if (!data.deletePhoto(id)) return res.status(404).json({ error: 'Photo not found' });
  res.status(204).end();
});

app.use((req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(port, () => console.log(`Server started on port ${port}`));

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
