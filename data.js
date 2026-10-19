const db = require('./db');

function getAlbums() {
  return db.prepare('SELECT id, name, created_at FROM albums ORDER BY name COLLATE NOCASE').all();
}

function createAlbum(name) {
  const result = db.prepare('INSERT INTO albums (name) VALUES (?)').run(name.trim());
  return db.prepare('SELECT id, name, created_at FROM albums WHERE id = ?').get(result.lastInsertRowid);
}

function updateAlbum(id, name) {
  const result = db.prepare('UPDATE albums SET name = ? WHERE id = ?').run(name.trim(), id);
  return result.changes ? db.prepare('SELECT id, name, created_at FROM albums WHERE id = ?').get(id) : null;
}

function deleteAlbum(id) {
  return db.prepare('DELETE FROM albums WHERE id = ?').run(id).changes > 0;
}

function getPhotos(filters = {}) {
  let sql = `SELECT photos.id, photos.album_id, albums.name AS album_name,
    photos.filename, photos.caption, photos.tags, photos.created_at
    FROM photos JOIN albums ON albums.id = photos.album_id WHERE 1 = 1`;
  const params = {};

  if (filters.albumId) {
    sql += ' AND photos.album_id = @albumId';
    params.albumId = filters.albumId;
  }

  if (filters.tag) {
    sql += ' AND photos.tags LIKE @tag';
    params.tag = `%${filters.tag}%`;
  }

  sql += ' ORDER BY photos.created_at DESC, photos.id DESC';
  return db.prepare(sql).all(params);
}

function createPhoto(photo) {
  const result = db.prepare(
    'INSERT INTO photos (album_id, filename, caption, tags) VALUES (?, ?, ?, ?)'
  ).run(photo.album_id, photo.filename.trim(), photo.caption.trim(), (photo.tags || '').trim());

  return db.prepare(`SELECT photos.id, photos.album_id, albums.name AS album_name,
    photos.filename, photos.caption, photos.tags, photos.created_at
    FROM photos JOIN albums ON albums.id = photos.album_id WHERE photos.id = ?`)
    .get(result.lastInsertRowid);
}

function updatePhoto(id, photo) {
  const result = db.prepare(
    'UPDATE photos SET album_id = ?, filename = ?, caption = ?, tags = ? WHERE id = ?'
  ).run(photo.album_id, photo.filename.trim(), photo.caption.trim(), (photo.tags || '').trim(), id);

  if (!result.changes) return null;

  return db.prepare(`SELECT photos.id, photos.album_id, albums.name AS album_name,
    photos.filename, photos.caption, photos.tags, photos.created_at
    FROM photos JOIN albums ON albums.id = photos.album_id WHERE photos.id = ?`)
    .get(id);
}

function deletePhoto(id) {
  return db.prepare('DELETE FROM photos WHERE id = ?').run(id).changes > 0;
}

module.exports = { getAlbums, createAlbum, updateAlbum, deleteAlbum, getPhotos, createPhoto, updatePhoto, deletePhoto };
