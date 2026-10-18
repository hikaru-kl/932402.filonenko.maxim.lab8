const form = document.getElementById('album-form');
const list = document.getElementById('albums');
const message = document.getElementById('message');

async function loadAlbums() {
  const response = await fetch('/api/albums');
  const albums = await response.json();
  list.replaceChildren();
  albums.forEach(album => {
    const card = document.createElement('article');
    card.className = 'album-card';
    const title = document.createElement('h2');
    title.textContent = album.name;
    const id = document.createElement('p');
    id.textContent = `Альбом №${album.id}`;
    card.append(title, id);
    list.appendChild(card);
  });
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  const name = document.getElementById('album-name').value.trim();
  const response = await fetch('/api/albums', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name })
  });
  const result = await response.json();
  if (!response.ok) {
    message.textContent = result.error;
    return;
  }
  form.reset();
  message.textContent = 'Альбом добавлен.';
  loadAlbums();
});

loadAlbums();
