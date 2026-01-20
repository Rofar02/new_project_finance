from typing import List, Optional
from app.models.category import Categories
from app.models.transaction import TransactionType
import logging

logger = logging.getLogger(__name__)


def match_categories_by_prefix(
    category_text: str,
    categories: List[Categories],
    transaction_type: TransactionType
) -> List[Categories]:
    """
    Находит категории по первым 3 буквам
    
    Args:
        category_text: Текст категории из распознанного голоса
        categories: Список всех категорий пользователя
        transaction_type: Тип транзакции (для фильтрации)
    
    Returns:
        Список подходящих категорий
    """
    if not category_text or len(category_text) < 2:
        return []
    
    # Берем первые 3 буквы (минимум 2, если меньше)
    prefix_length = min(3, len(category_text))
    prefix = category_text[:prefix_length].lower()
    
    # Фильтруем категории по типу и проверяем первые буквы
    matched_categories = []
    for category in categories:
        # Проверяем тип категории
        if category.type != transaction_type.value:
            continue
        
        # Проверяем первые буквы (регистронезависимо)
        category_name_lower = category.name.lower()
        if len(category_name_lower) >= prefix_length:
            if category_name_lower[:prefix_length] == prefix:
                matched_categories.append(category)
    
    logger.info(f"Matched {len(matched_categories)} categories for prefix '{prefix}' and type '{transaction_type.value}'")
    return matched_categories


