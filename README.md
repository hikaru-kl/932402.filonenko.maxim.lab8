# Лабораторная работа №8 — Галерея фотографий

Вариант 11. Приложение на Node.js, Express и SQLite для управления альбомами и фотографиями.

## Запуск

```bash
npm install
npm start
```

Откройте `http://localhost:3000`.

## Возможности

- CRUD альбомов и фотографий.
- Фото добавляются по имени файла или URL (эмуляция загрузки).
- Фильтр по альбому и тегу.
- Модальное окно просмотра и редактирования.
- Переименование и удаление альбомов из интерфейса.
- Пагинация и сортировка по дате добавления.
- Адаптивная сетка и обработка ошибок API.

## API

- `GET /api/albums`
- `POST /api/albums` с JSON `{"name":"Путешествия"}`
- `PUT /api/albums/:id` с JSON `{"name":"Отпуск"}`
- `DELETE /api/albums/:id`
- `GET /api/photos?album_id=1&tag=nature`
- `POST /api/photos` с JSON `{"album_id":1,"filename":"photo.jpg","caption":"Горы","tags":"nature,travel"}`
- `PUT /api/photos/:id` с полями `album_id`, `filename`, `caption`, `tags`
- `DELETE /api/photos/:id`
- `GET /api/status`

## Схема базы данных

- `albums(id, name, created_at)`
- `photos(id, album_id, filename, caption, tags, created_at)`

Связь: `photos.album_id` ссылается на `albums.id`. При удалении альбома его фотографии удаляются каскадно.
