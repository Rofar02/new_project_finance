from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path
from dotenv import load_dotenv

# Загружаем .env файл вручную для большей надежности
# Пробуем несколько путей: локальный (для разработки) и Docker путь
env_path_local = Path(__file__).parent.parent.parent / ".env"
env_path_docker = Path("/app/.env")

if env_path_local.exists():
    load_dotenv(env_path_local, override=True)
elif env_path_docker.exists():
    load_dotenv(env_path_docker, override=True)
else:
    # Если ни один файл не найден, пробуем загрузить из текущей директории
    load_dotenv(override=True)


class Settings(BaseSettings):
    app_name: str
    debug: bool = True
    host: str = "127.0.0.1"
    port: int = 8000

    database_url: str
    jwt_secret: str
    algorithm: str
    access_token_expire_minutes: int
    
    # Telegram Bot
    telegram_bot_token: str
    telegram_webapp_url: str = ""  # URL вашего фронтенда

    model_config = SettingsConfigDict(
        # Pydantic будет читать переменные из окружения (уже загруженные через load_dotenv)
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
