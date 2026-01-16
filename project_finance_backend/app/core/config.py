from pydantic_settings import BaseSettings
from pathlib import Path


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

    class Config:
        env_file = "/app/.env"
        env_file_encoding = "utf-8"


settings = Settings()
