import sys
from app.services.ai.translation import translate_text, detect_script_language

def test_multilingual_expansion():
    print("Testing Expanded Multilingual Translation Pipeline...")

    samples = [
        ("en", "AC not working in local train coach.", "English"),
        ("hi", "मेट्रो स्टेशन पर बहुत भीड़ है और टिकट काउंटर बंद है।", "Hindi"),
        ("mr", "बस वेळेवर आली नाही आणि वाहक उद्धटपणे बोलला.", "Marathi"),
        ("gu", "બસ સમયસર આવી નથી અને કંડક્ટરે ખરાબ વર્તન કર્યું.", "Gujarati"),
        ("ur", "بس وقت پر نہیں آئی اور کنڈکٹر نے بدتمیزی کی۔", "Urdu"),
    ]

    for lang, text, lang_name in samples:
        print(f"\n--- Testing {lang_name} ({lang}) ---")
        detected = detect_script_language(text)
        print(f"   Detected Script  : {detected}")
        
        translated = translate_text(text, source_language=lang)
        sys.stdout.buffer.write(f"   Original         : {text}\n".encode("utf-8"))
        sys.stdout.buffer.write(f"   Translated (EN)  : {translated}\n".encode("utf-8"))
        assert len(translated) > 0, f"Translation for {lang_name} returned empty text!"
        print(f"   [OK] {lang_name} translation successful.")

    # Test auto-detection without passing language parameter
    print("\n--- Testing Auto-Detection (no source_language passed) ---")
    auto_guj = "બસ સમયસર આવી નથી"
    translated_auto = translate_text(auto_guj)
    sys.stdout.buffer.write(f"   Auto-Detected Gujarati Translation: {translated_auto}\n".encode("utf-8"))
    assert len(translated_auto) > 0

    print("\nALL EXPANDED MULTILINGUAL TESTS PASSED!")

if __name__ == "__main__":
    test_multilingual_expansion()
