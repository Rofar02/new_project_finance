import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

from app.db import AsyncSessionLocal
from app.crud.user import get_all_telegram_users
from app.bot.bot import bot

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

# Используем московское время (Europe/Moscow)
MOSCOW_TZ = pytz.timezone('Europe/Moscow')


async def send_daily_notifications():
    """Отправляет ежедневные уведомления всем пользователям с Telegram"""
    try:
        async with AsyncSessionLocal() as db:
            users = await get_all_telegram_users(db)
            
            for user in users:
                try:
                    # Извлекаем telegram_id из username (формат: tg_123456789)
                    telegram_id = int(user.username.replace("tg_", ""))
                    
                    await bot.send_message(
                        chat_id=telegram_id,
                        text=(
                            "🌙 <b>Добрый вечер!</b>\n\n"
                            "Не забудьте записать расходы и доходы за сегодня.\n\n"
                            "📊 Отправьте голосовое сообщение или откройте приложение"
                        )
                    )
                    logger.info(f"Sent daily notification to user {telegram_id}")
                except Exception as e:
                    logger.error(f"Error sending notification to user {user.username}: {e}")
    except Exception as e:
        logger.error(f"Error in send_daily_notifications: {e}")


def start_scheduler():
    """Запускает планировщик для ежедневных уведомлений"""
    # Отправка уведомлений каждый день в 17:00 по московскому времени
    scheduler.add_job(
        send_daily_notifications,
        trigger=CronTrigger(hour=17, minute=0, timezone=MOSCOW_TZ),
        id="daily_notifications",
        replace_existing=True
    )
    scheduler.start()
    logger.info("Scheduler started: daily notifications at 17:00 (Moscow time)")


def shutdown_scheduler():
    """Останавливает планировщик"""
    scheduler.shutdown()
    logger.info("Scheduler stopped")

