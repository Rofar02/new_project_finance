from aiogram.fsm.state import State, StatesGroup


class VoiceTransactionStates(StatesGroup):
    """Состояния для обработки голосовых транзакций"""
    
    # Ожидание выбора категории (если несколько подходят)
    selecting_category = State()
    
    # Ожидание подтверждения транзакции
    confirming_transaction = State()


