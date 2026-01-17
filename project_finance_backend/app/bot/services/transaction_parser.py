import re
from typing import Optional, Tuple
from app.models.transaction import TransactionType
import logging

logger = logging.getLogger(__name__)

# Вариации для типа транзакции
EXPENSE_KEYWORDS = ["расход", "расходы", "трата", "траты", "потратил", "потрачено", "потратить"]
INCOME_KEYWORDS = ["доход", "доходы", "зарплата", "получил", "получено", "получить"]


def parse_transaction_text(text: str) -> Optional[Tuple[TransactionType, float, str]]:
    """
    Парсит текст транзакции и извлекает тип, сумму и категорию
    
    Формат: [Тип] [Сумма] на [Категория]
    
    Args:
        text: Распознанный текст
    
    Returns:
        Кортеж (TransactionType, amount, category_text) или None если не удалось распарсить
    """
    text = text.lower().strip()
    
    # Определяем тип транзакции
    transaction_type = None
    if any(keyword in text for keyword in EXPENSE_KEYWORDS):
        transaction_type = TransactionType.EXPENSE
    elif any(keyword in text for keyword in INCOME_KEYWORDS):
        transaction_type = TransactionType.INCOME
    
    if transaction_type is None:
        logger.warning(f"Could not determine transaction type from text: {text}")
        return None
    
    # Извлекаем сумму (ищем число)
    amount_pattern = r'(\d+(?:[.,]\d+)?)'
    amount_matches = re.findall(amount_pattern, text)
    
    if not amount_matches:
        logger.warning(f"Could not find amount in text: {text}")
        return None
    
    # Берем первое найденное число
    amount_str = amount_matches[0].replace(',', '.')
    try:
        amount = float(amount_str)
    except ValueError:
        logger.warning(f"Could not parse amount: {amount_str}")
        return None
    
    # Извлекаем категорию (текст после "на" или "для")
    category_text = None
    for separator in [" на ", " для ", " категория "]:
        if separator in text:
            parts = text.split(separator, 1)
            if len(parts) > 1:
                category_text = parts[1].strip()
                # Убираем лишние слова в конце
                category_text = re.sub(r'\s+(на|для|категория).*$', '', category_text, flags=re.IGNORECASE)
                break
    
    # Если не нашли через разделители, пытаемся извлечь последнее слово/слова после суммы
    if not category_text:
        # Убираем тип и сумму, что осталось - категория
        text_clean = text
        for keyword in EXPENSE_KEYWORDS + INCOME_KEYWORDS:
            text_clean = text_clean.replace(keyword, "")
        text_clean = re.sub(amount_pattern, "", text_clean)
        category_text = text_clean.strip()
        # Убираем лишние слова
        category_text = re.sub(r'^(на|для|категория)\s+', '', category_text, flags=re.IGNORECASE)
    
    if not category_text or len(category_text) < 2:
        logger.warning(f"Could not extract category from text: {text}")
        return None
    
    logger.info(f"Parsed transaction: type={transaction_type}, amount={amount}, category={category_text}")
    return transaction_type, amount, category_text

