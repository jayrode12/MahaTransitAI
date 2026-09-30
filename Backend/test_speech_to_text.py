import math
import os
import struct
import wave
from app.services.ai.speech_to_text import transcribe_audio_bytes, get_whisper_model

def create_synthetic_wav(duration_seconds: float = 1.0, sample_rate: int = 16000, freq: float = 440.0) -> bytes:
    """Generates a simple synthetic sine wave audio file in memory as bytes."""
    import io
    buffer = io.BytesIO()
    with wave.open(buffer, "wb") as wav_file:
        wav_file.setnchannels(1)  # Mono
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        
        num_samples = int(duration_seconds * sample_rate)
        for i in range(num_samples):
            # 440Hz sine wave tone
            value = int(32767.0 * 0.3 * math.sin(2.0 * math.pi * freq * (i / sample_rate)))
            data = struct.pack("<h", value)
            wav_file.writeframes(data)
            
    return buffer.getvalue()

def test_transcription():
    print("Testing local Whisper speech-to-text pipeline...")
    
    # 1. Verify model loader
    print("1. Loading Whisper model into memory (using 'tiny' for fast test)...")
    model = get_whisper_model("tiny")
    print(f"   Model loaded successfully: {type(model)}")
    
    # 2. Generate a valid WAV file
    print("2. Generating synthetic 16kHz test WAV audio in-memory...")
    wav_bytes = create_synthetic_wav(duration_seconds=1.5)
    print(f"   Generated {len(wav_bytes)} bytes of audio data.")
    
    # 3. Transcribe audio bytes
    print("3. Running transcribe_audio_bytes (tests tempfile handling + ffmpeg decoding)...")
    result = transcribe_audio_bytes(wav_bytes, original_filename="test_tone.wav", model_size="tiny")
    print("   Transcription result:", result)
    assert "text" in result
    assert "language" in result
    print("ALL STANDALONE SPEECH-TO-TEXT TESTS PASSED!")

if __name__ == "__main__":
    test_transcription()
