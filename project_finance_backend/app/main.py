import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from app.routers.categories import router as category_router
from app.routers.users import router as user_router
from app.routers.transactions import router as transaction_router
from app.routers.auth import router as auth_router
from app.routers.profile import router as profile_router
from app.routers.stats import router as stats_router
from app.routers.telegram import router as telegram_router
from app.bot.bot import setup_bot, shutdown_bot, dp, bot



@asynccontextmanager
async def lifespan(app: FastAPI):
    """Управление жизненным циклом приложения"""
    # Настраиваем бота (регистрируем handlers)
    await setup_bot()
    
    # Запуск бота в фоне
    bot_task = asyncio.create_task(dp.start_polling(bot, drop_pending_updates=True))
    
    yield
    
    # Остановка бота
    await dp.stop_polling()
    await bot.session.close()
    bot_task.cancel()
    try:
        await bot_task
    except asyncio.CancelledError:
        pass


app = FastAPI(lifespan=lifespan)

# CORS middleware
# Разрешаем все origins для разработки (в production нужно указать конкретные)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешаем все для работы с туннелями
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(category_router)
app.include_router(transaction_router)
app.include_router(user_router)
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(stats_router)
app.include_router(telegram_router)
