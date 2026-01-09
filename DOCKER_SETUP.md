# Docker Setup для Project Finance

## Быстрый старт

### 1. Разработка (Development)

```bash
# Клонируйте репозиторий (если еще не сделали)
cd project_finance

# Создайте .env файл из примера
cp .env.example .env

# Отредактируйте .env файл и укажите свои значения:
# - POSTGRES_PASSWORD (обязательно измените!)
# - JWT_SECRET (обязательно измените!)
# - TELEGRAM_BOT_TOKEN (если используете Telegram)

# Запустите все сервисы
docker-compose up -d

# Проверьте логи
docker-compose logs -f

# Остановите все сервисы
docker-compose down
```

### 2. Production

```bash
# Используйте production конфигурацию
docker-compose -f docker-compose.prod.yml up -d

# Остановка
docker-compose -f docker-compose.prod.yml down
```

## Доступ к сервисам

После запуска:

- **Frontend**: http://localhost:5173 (dev) или http://localhost (prod)
- **Backend API**: http://localhost:8000
- **PostgreSQL**: localhost:5432

## Полезные команды

### Просмотр логов
```bash
# Все сервисы
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только frontend
docker-compose logs -f frontend

# Только база данных
docker-compose logs -f db
```

### Выполнение команд в контейнерах

```bash
# Backend (миграции, shell и т.д.)
docker-compose exec backend bash
docker-compose exec backend python -m alembic upgrade head
docker-compose exec backend python -m alembic revision --autogenerate -m "description"

# Frontend (npm команды)
docker-compose exec frontend npm install
docker-compose exec frontend npm run build

# База данных (psql)
docker-compose exec db psql -U finance_user -d finance_db
```

### Пересборка образов

```bash
# Пересобрать все
docker-compose build

# Пересобрать конкретный сервис
docker-compose build backend
docker-compose build frontend

# Пересобрать без кэша
docker-compose build --no-cache
```

### Очистка

```bash
# Остановить и удалить контейнеры
docker-compose down

# Удалить также volumes (ОСТОРОЖНО: удалит данные БД!)
docker-compose down -v

# Удалить неиспользуемые образы
docker image prune -a
```

## Структура

```
project_finance/
├── docker-compose.yml          # Development конфигурация
├── docker-compose.prod.yml     # Production конфигурация
├── .env.example                # Пример переменных окружения
├── project_finance_backend/
│   ├── Dockerfile              # Production образ backend
│   ├── Dockerfile.dev          # Development образ backend
│   └── .dockerignore
└── project_finance_front/
    ├── Dockerfile              # Production образ frontend
    ├── Dockerfile.dev          # Development образ frontend
    ├── nginx.conf              # Nginx конфигурация для production
    └── .dockerignore
```

## Переменные окружения

Создайте файл `.env` в корне проекта на основе `.env.example`:

### Обязательные для Production:
- `POSTGRES_PASSWORD` - пароль для PostgreSQL
- `JWT_SECRET` - секретный ключ для JWT токенов
- `TELEGRAM_BOT_TOKEN` - токен Telegram бота (если используется)

### Опциональные:
- `POSTGRES_USER` - пользователь БД (по умолчанию: finance_user)
- `POSTGRES_DB` - название БД (по умолчанию: finance_db)
- `VITE_API_URL` - URL бэкенда для фронтенда
- `DEBUG` - режим отладки (true/false)

## Миграции базы данных

Миграции выполняются автоматически при запуске контейнера backend.

Для ручного выполнения:

```bash
# Создать новую миграцию
docker-compose exec backend python -m alembic revision --autogenerate -m "описание изменений"

# Применить миграции
docker-compose exec backend python -m alembic upgrade head

# Откатить последнюю миграцию
docker-compose exec backend python -m alembic downgrade -1
```

## Troubleshooting

### Проблема: Backend не может подключиться к БД

```bash
# Проверьте, что БД запущена и здорова
docker-compose ps
docker-compose logs db

# Проверьте переменные окружения
docker-compose exec backend env | grep DATABASE_URL
```

### Проблема: Порт уже занят

Измените порты в `docker-compose.yml`:

```yaml
ports:
  - "8001:8000"  # Вместо 8000:8000
```

### Проблема: Изменения в коде не применяются

В development режиме изменения должны применяться автоматически благодаря volumes.

Если не работают:

```bash
# Перезапустите контейнер
docker-compose restart backend
docker-compose restart frontend
```

### Проблема: Нужно очистить БД

```bash
# Остановите контейнеры
docker-compose down

# Удалите volume с данными БД
docker volume rm project_finance_postgres_data

# Запустите заново
docker-compose up -d
```

## Production Deployment

1. Создайте `.env` файл с production значениями
2. Используйте `docker-compose.prod.yml`
3. Настройте reverse proxy (nginx/traefik) для HTTPS
4. Настройте резервное копирование БД
5. Используйте секреты для чувствительных данных

```bash
docker-compose -f docker-compose.prod.yml up -d
```

