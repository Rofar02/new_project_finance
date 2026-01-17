import re
from typing import Optional, Tuple
from app.models.transaction import TransactionType
import logging

logger = logging.getLogger(__name__)

# Вариации для типа транзакции
EXPENSE_KEYWORDS = [
    "расход", "расходы", "расх", "расходов",
    "трата", "траты", "трат",
    "потратил", "потрачено", "потратить", "потратила"
]
INCOME_KEYWORDS = [
    "доход", "доходы", "дох", "доходов",
    "зарплата", "зарплату", "зарплаты",
    "получил", "получила", "получено", "получить"
]

# Словарь русских числительных
RUSSIAN_NUMBERS = {
    "ноль": 0, "один": 1, "два": 2, "три": 3, "четыре": 4, "пять": 5,
    "шесть": 6, "семь": 7, "восемь": 8, "девять": 9, "десять": 10,
    "одиннадцать": 11, "двенадцать": 12, "тринадцать": 13, "четырнадцать": 14,
    "пятнадцать": 15, "шестнадцать": 16, "семнадцать": 17, "восемнадцать": 18,
    "девятнадцать": 19, "двадцать": 20, "тридцать": 30, "сорок": 40,
    "пятьдесят": 50, "шестьдесят": 60, "семьдесят": 70, "восемьдесят": 80,
    "девяносто": 90, "сто": 100, "двести": 200, "триста": 300, "четыреста": 400,
    "пятьсот": 500, "шестьсот": 600, "семьсот": 700, "восемьсот": 800,
    "девятьсот": 900
}


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
    
    # Извлекаем сумму (ищем число или слова)
    amount = None
    
    # Сначала ищем паттерн: число + "тысяч"/"тысячи"/"тысяча" (приоритет)
    # Поддерживаем числа с пробелами и разделителями: "1 000", "5,000", "10000"
    thousands_pattern = r'(\d+(?:[ ,.\u00A0]\d+)?)\s*(тысяч|тысячи|тысяча)'
    thousands_match = re.search(thousands_pattern, text)
    if thousands_match:
        base_number_str = thousands_match.group(1).replace(' ', '').replace(',', '').replace('\u00A0', '').replace('.', '')
        try:
            base_number = int(base_number_str)
            amount = base_number * 1000
        except ValueError:
            pass
    
    # Если не нашли "число + тысяч", ищем числительные + "тысяч"
    if amount is None:
        thousands_words = ["тысяч", "тысячи", "тысяча"]
        for num_word, num_value in RUSSIAN_NUMBERS.items():
            for thousand_word in thousands_words:
                pattern = rf'\b{num_word}\s+{thousand_word}\b'
                if re.search(pattern, text):
                    amount = num_value * 1000
                    break
            if amount:
                break
    
    # Если не нашли "тысяч", ищем просто цифры (поддержка разных форматов)
    if amount is None:
        # Поддерживаем: "1000", "1 000", "1,000", "1000.50"
        # Ищем числа с разделителями тысяч (пробел, запятая, точка, неразрывный пробел)
        amount_pattern = r'(\d{1,3}(?:[ ,.\u00A0]\d{3})*(?:[.,]\d+)?|\d+(?:[.,]\d+)?)'
        amount_matches = re.findall(amount_pattern, text)
        if amount_matches:
            # Берем первое найденное число
            amount_str = amount_matches[0]
            # Убираем разделители тысяч (пробелы, неразрывные пробелы)
            amount_str = amount_str.replace(' ', '').replace('\u00A0', '')
            # Обрабатываем запятые и точки
            # Если есть запятая, она может быть разделителем тысяч или десятичным разделителем
            if ',' in amount_str:
                parts = amount_str.split(',')
                if len(parts) == 2 and len(parts[1]) <= 2:
                    # После запятой 1-2 цифры - это десятичный разделитель (копейки)
                    amount_str = '.'.join(parts)
                else:
                    # Иначе запятая - разделитель тысяч, убираем все запятые
                    amount_str = ''.join(parts)
            # Заменяем запятую на точку для десятичных (если остались)
            amount_str = amount_str.replace(',', '.')
            try:
                amount = float(amount_str)
            except ValueError:
                pass
    
    if amount is None:
        logger.warning(f"Could not find amount in text: {text}")
        return None
    
    # Извлекаем категорию (текст после "на" или "для", либо после суммы)
    category_text = None
    
    # Сначала пытаемся найти через разделители (" на ", " для ")
    for separator in [" на ", " для ", " категория "]:
        if separator in text:
            parts = text.split(separator, 1)
            if len(parts) > 1:
                category_text = parts[1].strip()
                # Убираем лишние слова в конце
                category_text = re.sub(r'\s+(на|для|категория).*$', '', category_text, flags=re.IGNORECASE)
                break
    
    # Если не нашли через разделители, извлекаем все что после суммы
    if not category_text:
        # Убираем тип транзакции (все ключевые слова)
        text_clean = text
        for keyword in EXPENSE_KEYWORDS + INCOME_KEYWORDS:
            # Заменяем с пробелами вокруг, чтобы не затронуть части других слов
            text_clean = re.sub(rf'\b{re.escape(keyword)}\b', '', text_clean, flags=re.IGNORECASE)
        
        # Убираем сумму (число и "тысяч")
        text_clean = re.sub(r'\d+(?:[.,]\d+)?', '', text_clean)  # Убираем числа
        text_clean = re.sub(r'\s*(тысяч|тысячи|тысяча)\s*', '', text_clean, flags=re.IGNORECASE)  # Убираем "тысяч"
        
        # Убираем разделители которые могли остаться
        text_clean = re.sub(r'^(на|для|категория)\s+', '', text_clean, flags=re.IGNORECASE)
        text_clean = re.sub(r'\s+(на|для|категория)\s+', ' ', text_clean, flags=re.IGNORECASE)
        
        category_text = text_clean.strip()
    
    if not category_text or len(category_text) < 2:
        logger.warning(f"Could not extract category from text: {text}")
        return None
    
    logger.info(f"Parsed transaction: type={transaction_type}, amount={amount}, category={category_text}")
    return transaction_type, amount, category_text

