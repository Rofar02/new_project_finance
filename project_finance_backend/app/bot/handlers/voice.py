import tempfile
import os
import json
from pathlib import Path
from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.fsm.context import FSMContext
from aiogram.filters import StateFilter

from app.bot.bot import bot
from app.bot.states.voice import VoiceTransactionStates
from app.bot.services.speech_recognition import transcribe_audio_file
from app.bot.services.transaction_parser import parse_transaction_text
from app.bot.services.category_matcher import match_categories_by_prefix
from app.db import AsyncSessionLocal
from app.crud.user import get_user_by_telegram_id
from app.crud.category import get_categories
from app.crud.transaction import create_transaction
from app.schemas.transactions import TransactionCreate
from app.models.transaction import TransactionType
import logging

logger = logging.getLogger(__name__)

router = Router()


@router.message(F.voice | F.video_note)
async def handle_voice_message(message: Message, state: FSMContext):
    """Обработчик голосовых сообщений"""
    
    # Проверяем, что пользователь зарегистрирован
    telegram_id = message.from_user.id
    async with AsyncSessionLocal() as db:
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user:
            await message.answer(
                "❌ Ваш аккаунт не связан с системой.\n\n"
                "Пожалуйста, сначала откройте приложение через кнопку /start и свяжите ваш Telegram аккаунт."
            )
            return
    
    # Определяем тип файла
    if message.voice:
        file = message.voice
    elif message.video_note:
        file = message.video_note
    else:
        return
    
    # Отправляем сообщение о начале обработки
    processing_msg = await message.answer("🎤 Обрабатываю голосовое сообщение...")
    
    try:
        # Скачиваем файл
        file_info = await bot.get_file(file.file_id)
        file_path = file_info.file_path
        
        # Создаем временный файл
        with tempfile.NamedTemporaryFile(delete=False, suffix='.ogg') as temp_file:
            temp_path = temp_file.name
            await bot.download_file(file_path, temp_path)
        
        # Распознаем речь
        text = await transcribe_audio_file(temp_path)
        
        # Удаляем временный файл
        os.unlink(temp_path)
        
        if not text:
            await processing_msg.edit_text("❌ Не удалось распознать речь. Попробуйте ещё раз.")
            return
        
        # Парсим текст
        parsed = parse_transaction_text(text)
        if not parsed:
            await processing_msg.edit_text(
                "❌ Не удалось распознать транзакцию из текста.\n\n"
                f"Распознанный текст: <i>{text}</i>\n\n"
                "Формат: Расход/Доход [сумма] на [категория]\n"
                "Пример: Расход 10000 на коммунальные платежи"
            )
            return
        
        transaction_type, amount, category_text = parsed
        
        # Получаем категории пользователя
        async with AsyncSessionLocal() as db:
            categories = await get_categories(user, db)
            
            # Ищем подходящие категории
            matched_categories = match_categories_by_prefix(
                category_text, categories, transaction_type
            )
            
            if not matched_categories:
                await processing_msg.edit_text(
                    f"❌ Категория '{category_text}' не найдена.\n\n"
                    "Пожалуйста, создайте эту категорию в приложении или попробуйте ещё раз с другой формулировкой."
                )
                return
            
            # Сохраняем данные в состояние
            await state.update_data(
                transaction_type=transaction_type.value,
                amount=amount,
                category_text=category_text,
                recognized_text=text
            )
            
            # Если одна категория - сразу идем на подтверждение
            if len(matched_categories) == 1:
                category = matched_categories[0]
                await state.update_data(category_id=category.id)
                await state.set_state(VoiceTransactionStates.confirming_transaction)
                await show_confirmation_message(processing_msg, transaction_type, amount, category.name, state)
            else:
                # Если несколько категорий - показываем выбор
                await state.update_data(matched_categories=[
                    {"id": cat.id, "name": cat.name} for cat in matched_categories
                ])
                await state.set_state(VoiceTransactionStates.selecting_category)
                await show_category_selection(processing_msg, matched_categories, state)
    
    except Exception as e:
        logger.error(f"Error processing voice message: {e}", exc_info=True)
        try:
            await processing_msg.edit_text("❌ Произошла ошибка при обработке. Попробуйте ещё раз.")
        except:
            pass


async def show_category_selection(
    message: Message,
    categories: list,
    state: FSMContext
):
    """Показывает выбор категории из нескольких вариантов"""
    buttons = []
    for category in categories[:10]:  # Ограничиваем до 10 категорий
        buttons.append([
            InlineKeyboardButton(
                text=category.name,
                callback_data=f"voice_cat_{category.id}"
            )
        ])
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
    
    category_names = ", ".join([cat.name for cat in categories[:5]])
    if len(categories) > 5:
        category_names += f" и ещё {len(categories) - 5}"
    
    await message.edit_text(
        f"📁 Найдено несколько категорий:\n\n"
        f"Выберите нужную категорию:",
        reply_markup=keyboard
    )


async def show_confirmation_message(
    message: Message,
    transaction_type: TransactionType,
    amount: float,
    category_name: str,
    state: FSMContext
):
    """Показывает сообщение подтверждения транзакции"""
    type_emoji = "💸" if transaction_type == TransactionType.EXPENSE else "💰"
    type_text = "Расход" if transaction_type == TransactionType.EXPENSE else "Доход"
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Да", callback_data="voice_confirm_yes"),
            InlineKeyboardButton(text="❌ Нет", callback_data="voice_confirm_no")
        ]
    ])
    
    await message.edit_text(
        f"Правильно ли я понял?\n\n"
        f"{type_emoji} <b>Тип:</b> {type_text}\n"
        f"💰 <b>Сумма:</b> {int(amount)}\n"
        f"📁 <b>Категория:</b> {category_name}",
        reply_markup=keyboard
    )


@router.callback_query(F.data.startswith("voice_cat_"), StateFilter(VoiceTransactionStates.selecting_category))
async def handle_category_selection(callback: CallbackQuery, state: FSMContext):
    """Обработчик выбора категории"""
    category_id = int(callback.data.split("_")[-1])
    
    # Получаем данные из состояния
    data = await state.get_data()
    transaction_type = TransactionType(data["transaction_type"])
    amount = data["amount"]
    
    # Находим название категории
    matched_categories = data.get("matched_categories", [])
    category_name = None
    for cat in matched_categories:
        if cat["id"] == category_id:
            category_name = cat["name"]
            break
    
    if not category_name:
        await callback.answer("Ошибка: категория не найдена", show_alert=True)
        await state.clear()
        return
    
    # Сохраняем выбранную категорию
    await state.update_data(category_id=category_id)
    await state.set_state(VoiceTransactionStates.confirming_transaction)
    
    # Показываем подтверждение
    await show_confirmation_message(
        callback.message,
        transaction_type,
        amount,
        category_name,
        state
    )
    await callback.answer()


@router.callback_query(F.data == "voice_confirm_yes", StateFilter(VoiceTransactionStates.confirming_transaction))
async def handle_transaction_confirm(callback: CallbackQuery, state: FSMContext):
    """Обработчик подтверждения транзакции"""
    data = await state.get_data()
    
    telegram_id = callback.from_user.id
    async with AsyncSessionLocal() as db:
        user = await get_user_by_telegram_id(db, telegram_id)
        if not user:
            await callback.answer("Ошибка: пользователь не найден", show_alert=True)
            await state.clear()
            return
        
        # Создаем транзакцию
        transaction_create = TransactionCreate(
            category_id=data["category_id"],
            amount=data["amount"],
            transaction_type=TransactionType(data["transaction_type"]),
            description=None
        )
        
        try:
            transaction = await create_transaction(user, db, transaction_create)
            
            type_emoji = "💸" if transaction.transaction_type == TransactionType.EXPENSE else "💰"
            await callback.message.edit_text(
                f"{type_emoji} ✅ Транзакция успешно добавлена!\n\n"
                f"💰 Сумма: {int(transaction.amount)}\n"
                f"📁 Категория: {transaction.category.name}\n"
                f"💵 Баланс: {int(user.balance)}"
            )
            await callback.answer("Транзакция добавлена!")
        
        except Exception as e:
            logger.error(f"Error creating transaction: {e}", exc_info=True)
            await callback.message.edit_text("❌ Ошибка при создании транзакции. Попробуйте ещё раз.")
            await callback.answer("Ошибка", show_alert=True)
    
    await state.clear()


@router.callback_query(F.data == "voice_confirm_no", StateFilter(VoiceTransactionStates.confirming_transaction))
async def handle_transaction_cancel(callback: CallbackQuery, state: FSMContext):
    """Обработчик отмены транзакции"""
    await callback.message.edit_text(
        "❌ Транзакция отменена.\n\n"
        "Попробуйте отправить голосовое сообщение ещё раз."
    )
    await callback.answer("Транзакция отменена")
    await state.clear()

