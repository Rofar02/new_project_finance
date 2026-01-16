from aiogram import Router, F
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from aiogram.filters import Command

from app.core.config import settings

router = Router()


@router.message(Command("start"))
async def cmd_start(message: Message):
    """Обработчик команды /start"""
    webapp_url = settings.telegram_webapp_url
    print(f"\n🚀 DEBUG BOT SETTINGS: webapp_url is currently -> {webapp_url}\n")    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="🚀 Открыть приложение",
            web_app=WebAppInfo(url=webapp_url)
        )]
    ])
    
    await message.answer(
        "💰 <b>Финансовый менеджер</b>\n\n"
        "Управляйте своими финансами прямо в Telegram!\n\n"
        "📊 Отслеживайте доходы и расходы\n"
        "📈 Смотрите статистику и графики\n"
        "💳 Контролируйте баланс\n\n"
        "Нажмите кнопку ниже, чтобы открыть приложение 👇",
        reply_markup=keyboard
    )


@router.message(Command("help"))
async def cmd_help(message: Message):
    """Обработчик команды /help"""
    await message.answer(
        "📖 <b>Справка по боту</b>\n\n"
        "<b>Команды:</b>\n"
        "/start - Начать работу с ботом\n"
        "/help - Показать эту справку\n"
        "/balance - Показать баланс (требуется авторизация)\n\n"
        "<b>Как использовать:</b>\n"
        "1. Нажмите кнопку 'Открыть приложение'\n"
        "2. Зарегистрируйтесь или войдите\n"
        "3. Управляйте своими финансами!\n\n"
        "💡 Все данные хранятся безопасно и доступны только вам."
    )


@router.message(Command("balance"))
async def cmd_balance(message: Message):
    """Обработчик команды /balance (показывает баланс через WebApp)"""
    webapp_url = f"{settings.telegram_webapp_url}/dashboard"
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(
            text="📊 Открыть баланс",
            web_app=WebAppInfo(url=webapp_url)
        )]
    ])
    
    await message.answer(
        "💳 <b>Баланс</b>\n\n"
        "Для просмотра баланса откройте приложение:",
        reply_markup=keyboard
    )

