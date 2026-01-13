from aiogram import Router, F
from aiogram.types import Message, WebAppData

router = Router()


@router.message(F.web_app_data)
async def handle_webapp_data(message: Message):
    """Обработчик данных от WebApp"""
    web_app_data: WebAppData = message.web_app_data
    
    # Данные от WebApp приходят как строка
    # Здесь можно обработать данные, если нужно
    await message.answer(
        "✅ Данные получены!\n"
        "Приложение работает корректно."
    )

