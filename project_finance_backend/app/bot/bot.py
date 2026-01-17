from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.memory import MemoryStorage

from app.core.config import settings

# Инициализация бота
bot = Bot(
    token=settings.telegram_bot_token,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)

# Диспетчер с хранилищем состояний
storage = MemoryStorage()
dp = Dispatcher(storage=storage)


async def setup_bot():
    """Настройка бота и регистрация всех handlers"""
    from app.bot.handlers import start_router, webapp_router, voice_router
    
    # Регистрируем роутеры
    dp.include_router(start_router)
    dp.include_router(webapp_router)
    dp.include_router(voice_router)


async def shutdown_bot():
    """Остановка бота"""
    await bot.session.close()

