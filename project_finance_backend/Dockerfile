FROM python:3.12-slim

WORKDIR /app

# Установка системных зависимостей
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Копирование файлов зависимостей
COPY pyproject.toml ./

# Установка Poetry
RUN pip install --no-cache-dir poetry && \
    poetry config virtualenvs.create false

# Устанавливаем CPU-only версию PyTorch ПЕРЕД poetry install
# Это предотвратит установку CUDA пакетов через poetry (~3GB экономии)
RUN pip install --no-cache-dir --index-url https://download.pytorch.org/whl/cpu torch torchaudio

# Установка зависимостей Python (БЕЗ whisper в pyproject.toml)
RUN poetry install --no-dev --no-interaction --no-ansi

# Устанавливаем Whisper ПОСЛЕ poetry install (torch уже установлен)
RUN pip install --no-cache-dir openai-whisper

# Копирование кода приложения
COPY . .

# Создание директории для логов
RUN mkdir -p /app/logs

# Переменные окружения по умолчанию
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Порт приложения
EXPOSE 8000

# Команда запуска
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]



