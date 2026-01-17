import whisper
import tempfile
import os
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Глобальная переменная для хранения модели
_whisper_model = None


def load_whisper_model(model_name: str = "tiny"):
    """Загружает модель Whisper (загружается один раз)"""
    global _whisper_model
    if _whisper_model is None:
        logger.info(f"Loading Whisper model: {model_name}")
        _whisper_model = whisper.load_model(model_name)
        logger.info("Whisper model loaded successfully")
    return _whisper_model


async def transcribe_audio_file(audio_path: str, model_name: str = "tiny") -> Optional[str]:
    """
    Распознает речь в аудиофайле используя Whisper
    
    Args:
        audio_path: Путь к аудиофайлу
        model_name: Название модели Whisper (tiny, base, small, medium, large)
    
    Returns:
        Распознанный текст или None в случае ошибки
    """
    try:
        model = load_whisper_model(model_name)
        logger.info(f"Transcribing audio file: {audio_path}")
        
        # Распознавание речи
        result = model.transcribe(audio_path, language="ru")
        text = result["text"].strip()
        
        logger.info(f"Transcribed text: {text}")
        return text
    except Exception as e:
        logger.error(f"Error transcribing audio: {e}")
        return None

