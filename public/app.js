const gallery = document.getElementById('gallery');
const message = document.getElementById('message');
const albumFilter = document.getElementById('album-filter');
const tagFilter = document.getElementById('tag-filter');
const sortOrder = document.getElementById('sort-order');
const photoDialog = document.getElementById('photo-dialog');
const albumDialog = document.getElementById('album-dialog');
const viewDialog = document.getElementById('view-dialog');
const photoForm = document.getElementById('photo-form');
const albumForm = document.getElementById('album-form');
const pageSize = 6;
let currentPage = 1;
let photos = [];
let albums = [];

async function request(url, options = {}) {
  const response = await fetch(url, options);
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Не удалось выполнить запрос');
  return data;
}

function showMessage(text) {
  message.textContent = text;
}

async function loadAlbums() {
  albums = await request('/api/albums');
  const selected = albumFilter.value;
  albumFilter.replaceChildren(new Option('Все альбомы', ''));
  const photoAlbum = document.getElementById('photo-album');
  photoAlbum.replaceChildren();

  albums.forEach(album => {
    albumFilter.add(new Option(album.name, album.id));
    photoAlbum.add(new Option(album.name, album.id));
  });

  if ([...albumFilter.options].some(option => option.value === selected)) albumFilter.value = selected;
}

async function loadPhotos() {
  const params = new URLSearchParams();
  if (albumFilter.value) params.set('album_id', albumFilter.value);
  if (tagFilter.value.trim()) params.set('tag', tagFilter.value.trim());

  try {
    photos = await request(`/api/photos?${params}`);
    if (sortOrder.value === 'oldest') photos.reverse();
    currentPage = Math.min(currentPage, Math.max(1, Math.ceil(photos.length / pageSize)));
    renderPhotos();
    showMessage('');
  } catch (error) {
    showMessage(error.message);
  }
}

function renderPhotos() {
  gallery.replaceChildren();
  const start = (currentPage - 1) * pageSize;
  const visiblePhotos = photos.slice(start, start + pageSize);
  document.getElementById('photo-count').textContent = `${photos.length} фотографий`;
  document.getElementById('gallery-title').textContent = albumFilter.value
    ? albums.find(album => String(album.id) === albumFilter.value)?.name || 'Альбом'
    : 'Все фотографии';

  if (!visiblePhotos.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Пока нет фотографий. Добавь первый снимок.';
    gallery.appendChild(empty);
  }

  visiblePhotos.forEach(photo => {
    const card = document.createElement('article');
    card.className = 'photo-card';

    const preview = document.createElement('div');
    preview.className = 'photo-preview photo-placeholder';
    preview.textContent = photo.filename;
    preview.setAttribute('role', 'img');
    preview.setAttribute('aria-label', photo.caption);
    preview.tabIndex = 0;
    preview.addEventListener('click', () => openPhoto(photo));
    preview.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') openPhoto(photo);
    });

    if (/^https?:\/\//i.test(photo.filename)) {
      const image = document.createElement('img');
      image.className = 'photo-preview';
      image.src = photo.filename;
      image.alt = photo.caption;
      image.addEventListener('error', () => {
        image.replaceWith(preview);
      });
      image.addEventListener('click', () => openPhoto(photo));
      card.appendChild(image);
    } else {
      card.appendChild(preview);
    }

    const info = document.createElement('div');
    info.className = 'photo-info';
    const caption = document.createElement('h3');
    caption.textContent = photo.caption;
    const album = document.createElement('p');
    album.textContent = photo.album_name;
    const tags = document.createElement('p');
    tags.className = 'tags';
    tags.textContent = photo.tags ? `# ${photo.tags.split(',').map(tag => tag.trim()).filter(Boolean).join(' # ')}` : 'Без тегов';
    const date = document.createElement('p');
    date.textContent = new Date(`${photo.created_at.replace(' ', 'T')}Z`).toLocaleDateString('ru-RU');

    const actions = document.createElement('div');
    actions.className = 'card-actions';
    const view = document.createElement('button');
    view.type = 'button';
    view.className = 'button-light';
    view.textContent = 'Просмотр';
    view.addEventListener('click', () => openPhoto(photo));

    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'button-light';
    edit.textContent = 'Изменить';
    edit.addEventListener('click', () => openEdit(photo));

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'danger';
    remove.textContent = 'Удалить';
    remove.addEventListener('click', async () => {
      if (!confirm('Удалить фотографию?')) return;
      try {
        await request(`/api/photos/${photo.id}`, { method: 'DELETE' });
        await loadPhotos();
      } catch (error) {
        showMessage(error.message);
      }
    });

    actions.append(view, edit, remove);
    info.append(caption, album, tags, date, actions);
    card.appendChild(info);
    gallery.appendChild(card);
  });

  renderPagination();
}

function renderPagination() {
  const pagination = document.getElementById('pagination');
  pagination.replaceChildren();
  const pageCount = Math.ceil(photos.length / pageSize);
  if (pageCount < 2) return;

  for (let page = 1; page <= pageCount; page++) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = page;
    if (page === currentPage) button.setAttribute('aria-current', 'page');
    button.addEventListener('click', () => {
      currentPage = page;
      renderPhotos();
    });
    pagination.appendChild(button);
  }
}

function openPhoto(photo) {
  const image = document.getElementById('view-image');
  image.removeAttribute('src');
  image.alt = photo.caption;
  if (/^https?:\/\//i.test(photo.filename)) {
    image.src = photo.filename;
    image.hidden = false;
  } else {
    image.hidden = true;
  }
  document.getElementById('view-caption').textContent = photo.caption;
  document.getElementById('view-meta').textContent = `${photo.album_name} · ${photo.tags || 'Без тегов'} · ${photo.filename}`;
  viewDialog.showModal();
}

function openEdit(photo) {
  document.getElementById('photo-dialog-title').textContent = 'Редактировать фото';
  document.getElementById('photo-id').value = photo.id;
  document.getElementById('photo-album').value = photo.album_id;
  document.getElementById('photo-filename').value = photo.filename;
  document.getElementById('photo-caption').value = photo.caption;
  document.getElementById('photo-tags').value = photo.tags;
  photoDialog.showModal();
}

function openAddPhoto() {
  if (!albums.length) {
    showMessage('Сначала создай альбом.');
    albumDialog.showModal();
    return;
  }
  photoForm.reset();
  document.getElementById('photo-id').value = '';
  document.getElementById('photo-dialog-title').textContent = 'Добавить фото';
  photoDialog.showModal();
}

document.getElementById('add-photo-button').addEventListener('click', openAddPhoto);
document.getElementById('add-album-button').addEventListener('click', () => albumDialog.showModal());
document.getElementById('filter-button').addEventListener('click', () => {
  currentPage = 1;
  loadPhotos();
});
document.getElementById('sort-order').addEventListener('change', () => {
  currentPage = 1;
  loadPhotos();
});

photoForm.addEventListener('submit', async event => {
  event.preventDefault();
  const id = document.getElementById('photo-id').value;
  const payload = {
    album_id: Number(document.getElementById('photo-album').value),
    filename: document.getElementById('photo-filename').value.trim(),
    caption: document.getElementById('photo-caption').value.trim(),
    tags: document.getElementById('photo-tags').value.trim()
  };

  try {
    await request(id ? `/api/photos/${id}` : '/api/photos', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    photoDialog.close();
    await loadAlbums();
    await loadPhotos();
    showMessage(id ? 'Фотография обновлена.' : 'Фотография добавлена.');
  } catch (error) {
    showMessage(error.message);
  }
});

albumForm.addEventListener('submit', async event => {
  event.preventDefault();
  const name = document.getElementById('album-name').value.trim();
  try {
    await request('/api/albums', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    albumForm.reset();
    albumDialog.close();
    await loadAlbums();
    showMessage('Альбом создан.');
  } catch (error) {
    showMessage(error.message);
  }
});

document.getElementById('close-photo-dialog').addEventListener('click', () => photoDialog.close());
document.getElementById('cancel-photo').addEventListener('click', () => photoDialog.close());
document.getElementById('close-album-dialog').addEventListener('click', () => albumDialog.close());
document.getElementById('cancel-album').addEventListener('click', () => albumDialog.close());
document.getElementById('close-view-dialog').addEventListener('click', () => viewDialog.close());

async function start() {
  try {
    await loadAlbums();
    await loadPhotos();
  } catch (error) {
    showMessage(error.message);
  }
}

start();
