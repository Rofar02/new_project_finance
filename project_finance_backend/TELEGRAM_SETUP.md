# Настройка Telegram мини-приложения

## Шаги настройки

### 1. Создание бота в Telegram

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. Следуйте инструкциям и создайте бота
4. Сохраните токен бота (например: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Настройка WebApp для локальной разработки

Telegram требует HTTPS для WebApp, поэтому для локальной разработки нужно использовать туннель.

#### Вариант 1: ngrok (рекомендуется)

1. Установите [ngrok](https://ngrok.com/download)
2. Зарегистрируйтесь и получите токен на [ngrok.com](https://dashboard.ngrok.com/get-started/your-authtoken)
3. Авторизуйтесь:
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```
4. Запустите туннель для вашего фронтенда:
   ```bash
   ngrok http 5173
   ```
5. Скопируйте HTTPS URL (например: `https://abc123.ngrok-free.app`)
6. Откройте [@BotFather](https://t.me/BotFather)
7. Отправьте команду `/mybots`
8. Выберите вашего бота
9. Выберите "Bot Settings" → "Menu Button"
10. Выберите "Configure Menu Button"
11. Введите текст кнопки (например: "Открыть приложение")
12. Введите HTTPS URL от ngrok (например: `https://abc123.ngrok-free.app`)

#### Вариант 2: cloudflared (альтернатива)

1. Установите cloudflared:
   ```bash
   # Windows (через Chocolatey)
   choco install cloudflared
   
   # Или скачайте с https://github.com/cloudflare/cloudflared/releases
   ```
2. Запустите туннель:
   ```bash
   cloudflared tunnel --url http://localhost:5173
   ```
3. Используйте полученный HTTPS URL в BotFather

#### Вариант 3: pingy (для РФ, если доступен)

1. Установите:
   ```bash
   npm install -g pingy-cli
   ```
2. Запустите туннель:
   ```bash
   pingy dev 5173
   # или
   pingy start 5173
   ```
3. Используйте полученный HTTPS URL в BotFather

#### Вариант 4: Российские аналоги (для РФ)

**xTunnel:**
1. Зарегистрируйтесь на https://xtunnel.ru
2. Следуйте инструкциям на сайте
3. Используйте полученный HTTPS URL

**Tuna:**
1. Зарегистрируйтесь на https://tuna.ru (если доступен)
2. Следуйте инструкциям на сайте
3. Используйте полученный HTTPS URL

#### ⚠️ Не используйте localtunnel для Telegram WebApp!

Localtunnel показывает страницу-предупреждение, которую Telegram не может обойти.

### 3. Настройка переменных окружения

Добавьте в файл `.env`:

```env
# Telegram Bot
telegram_bot_token=YOUR_BOT_TOKEN_HERE
telegram_webapp_url=https://your-ngrok-url.ngrok-free.app
```

**Важно:** Используйте HTTPS URL от ngrok (или другого туннеля), а не `localhost`!

Для локальной разработки с ngrok:
```env
telegram_webapp_url=https://abc123.ngrok-free.app
```

Для production:
```env
telegram_webapp_url=https://your-domain.com
```

### 4. Установка зависимостей

```bash
cd project_finance_backend
poetry install
```

### 5. Запуск приложения

**Важно:** Сначала запустите ngrok, затем приложения!

1. **Запустите ngrok** (в отдельном терминале):
   ```bash
   ngrok http 5173
   ```
   Скопируйте HTTPS URL (например: `https://abc123.ngrok-free.app`)

2. **Обновите `.env`** с ngrok URL:
   ```env
   telegram_webapp_url=https://abc123.ngrok-free.app
   ```

3. **Запустите Backend** (в новом терминале):
   ```bash
   cd project_finance_backend
   poetry run uvicorn app.main:app --reload
   ```

4. **Запустите Frontend** (в новом терминале):
   ```bash
   cd project_finance_front
   npm run dev
   ```

**Порядок важен:**
- ngrok должен быть запущен первым
- URL в `.env` должен совпадать с ngrok URL
- URL в BotFather должен совпадать с ngrok URL

### 6. Тестирование

1. Откройте вашего бота в Telegram
2. Отправьте команду `/start`
3. Нажмите кнопку "Открыть приложение"
4. Приложение должно открыться и автоматически авторизовать вас через Telegram

## Структура проекта

```
project_finance_backend/
├── app/
│   ├── bot/                    # Telegram бот
│   │   ├── bot.py              # Инициализация бота
│   │   └── handlers/          # Обработчики команд
│   │       ├── start.py       # Команды /start, /help, /balance
│   │       └── webapp.py      # Обработка данных от WebApp
│   ├── routers/
│   │   └── telegram.py        # API для аутентификации через Telegram
│   └── core/
│       └── telegram_verification.py  # Верификация данных от Telegram
```

## API Endpoints

### POST `/telegram/auth`

Аутентификация через Telegram WebApp

**Request:**
```json
{
  "init_data": "user={\"id\":123456789,\"first_name\":\"John\"}&auth_date=1234567890&hash=..."
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "tg_123456789",
    "email": "tg_123456789@telegram.local",
    "balance": 0.0,
    "telegram_id": 123456789,
    "telegram_name": "John"
  },
  "is_new_user": true
}
```

## Команды бота

- `/start` - Начать работу с ботом (показывает кнопку для открытия приложения)
- `/help` - Показать справку
- `/balance` - Открыть приложение на странице баланса

## Безопасность

- Все данные от Telegram WebApp верифицируются с использованием HMAC-SHA256
- Токен бота используется для создания секретного ключа верификации
- Данные действительны в течение 24 часов (можно настроить проверку времени)

## Troubleshooting

### Бот не отвечает
- Проверьте, что токен бота правильный
- Убедитесь, что бот запущен (проверьте логи)
- Проверьте, что `telegram_bot_token` указан в `.env`

### WebApp не открывается
- **Проверьте, что туннель запущен** и показывает активное соединение
- Убедитесь, что URL в BotFather совпадает с URL туннеля
- Проверьте, что фронтенд запущен на порту 5173
- Убедитесь, что URL в `.env` совпадает с URL туннеля
- Если используется ngrok и показывает предупреждение, нажмите "Visit Site" в браузере для подтверждения
- **Для РФ:** убедитесь, что используете доступный сервис (pingy, xTunnel, Tuna)

### Ошибка авторизации
- Проверьте, что `init_data` передается корректно
- Убедитесь, что токен бота в `.env` совпадает с токеном в BotFather
- Проверьте логи backend для деталей ошибки

### ngrok показывает "Visit Site" страницу
- Это нормально для бесплатного плана ngrok
- Просто нажмите "Visit Site" один раз, затем WebApp будет работать
- Или используйте платный план ngrok для отключения этой страницы

### URL изменился после перезапуска ngrok
- ngrok генерирует новый URL при каждом запуске (на бесплатном плане)
- Обновите URL в BotFather и `.env` при каждом перезапуске
- Или используйте статический домен на платном плане ngrok

