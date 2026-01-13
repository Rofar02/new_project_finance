import hashlib
import hmac
from urllib.parse import parse_qsl
from typing import Optional, Dict


def verify_telegram_webapp_data(
    init_data: str, bot_token: str
) -> Optional[Dict[str, str]]:
    """
    Верификация данных от Telegram WebApp
    
    Args:
        init_data: Строка initData от Telegram WebApp
        bot_token: Токен бота от BotFather
        
    Returns:
        Словарь с данными пользователя или None если верификация не прошла
    """
    import logging
    logger = logging.getLogger(__name__)
    
    try:
        if not init_data:
            logger.error("init_data is empty")
            return None
            
        if not bot_token:
            logger.error("bot_token is empty")
            return None
        
        # Парсим данные
        parsed_data = dict(parse_qsl(init_data))
        logger.debug(f"Parsed data keys: {list(parsed_data.keys())}")
        
        # Извлекаем hash
        received_hash = parsed_data.pop("hash", None)
        if not received_hash:
            logger.error("Hash not found in init_data")
            return None
        
        # Создаем секретный ключ
        secret_key = hmac.new(
            key=b"WebAppData",
            msg=bot_token.encode(),
            digestmod=hashlib.sha256
        ).digest()
        
        # Создаем строку для проверки
        data_check_string = "\n".join(
            f"{k}={v}" for k, v in sorted(parsed_data.items())
        )
        
        # Вычисляем hash
        calculated_hash = hmac.new(
            key=secret_key,
            msg=data_check_string.encode(),
            digestmod=hashlib.sha256
        ).hexdigest()
        
        # Проверяем hash (защита от timing attack)
        if not hmac.compare_digest(calculated_hash, received_hash):
            logger.error(f"Hash mismatch. Calculated: {calculated_hash[:10]}..., Received: {received_hash[:10]}...")
            return None
        
        # Проверяем время (данные действительны 24 часа)
        auth_date = int(parsed_data.get("auth_date", 0))
        if auth_date == 0:
            logger.error("auth_date is missing or zero")
            return None
        
        logger.info("Telegram data verification successful")
        return parsed_data
        
    except Exception as e:
        logger.error(f"Error verifying Telegram data: {str(e)}", exc_info=True)
        return None

