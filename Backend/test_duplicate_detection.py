from app.services.ai.duplicate_detection import (
    generate_embedding,
    calculate_cosine_similarity,
    find_similar_texts_in_memory,
    EMBEDDING_DIM,
)

def test_duplicate_detection_pipeline():
    print("Testing Duplicate Complaint Detection pipeline (Sentence Transformers)...")

    # 1. Test embedding generation
    print("1. Testing 384-dim vector generation...")
    text_sample = "Air conditioning is not cooling in Mumbai Metro line 1 train."
    vec = generate_embedding(text_sample)
    print(f"   Generated vector length: {len(vec)}")
    assert len(vec) == EMBEDDING_DIM, f"Expected {EMBEDDING_DIM} dims, got {len(vec)}"
    print("   [OK] Embedding dimension verified (384-dim).")

    # 2. Test semantic similarity with realistic transit complaint duplicates
    print("\n2. Testing semantic similarity with duplicate transit complaints...")
    complaint_a = "Route 302 BEST bus delayed by 45 minutes at Dadar stop."
    complaint_b = "Bus 302 arrived 45 minutes late at Dadar bus station."
    complaint_c = "Metro ticket vending machine swallowed my 100 rupee note."

    vec_a = generate_embedding(complaint_a)
    vec_b = generate_embedding(complaint_b)
    vec_c = generate_embedding(complaint_c)

    sim_ab = calculate_cosine_similarity(vec_a, vec_b)
    sim_ac = calculate_cosine_similarity(vec_a, vec_c)

    print(f"   Complaint A: '{complaint_a}'")
    print(f"   Complaint B (Duplicate): '{complaint_b}'")
    print(f"   Complaint C (Unrelated): '{complaint_c}'")
    print(f"\n   Cosine Similarity (A vs B - Same incident): {sim_ab:.4f}")
    print(f"   Cosine Similarity (A vs C - Unrelated)    : {sim_ac:.4f}")

    assert sim_ab >= 0.75, f"Expected similarity >= 0.75, got {sim_ab}"
    assert sim_ac < 0.40, f"Expected similarity < 0.40, got {sim_ac}"
    print("   [OK] Semantic similarity correctly distinguishes duplicates from distinct complaints.")

    # 3. Test in-memory candidate ranking
    print("\n3. Testing in-memory candidate duplicate ranking...")
    candidates = [
        {"id": "comp-101", "text": "Bus 302 was running very late at Dadar."},
        {"id": "comp-102", "text": "Escalator stopped working at Ghatkopar metro."},
        {"id": "comp-103", "text": "BEST route 302 bus delayed over 40 minutes at Dadar station."},
    ]

    matches = find_similar_texts_in_memory(complaint_a, candidates, threshold=0.75)
    print(f"   Found {len(matches)} duplicates above threshold 0.75:")
    for m in matches:
        print(f"     -> Matched ID: {m['candidate_id']} | Score: {m['similarity_score']:.4f} | Text: '{m['text']}'")

    assert len(matches) == 2, f"Expected 2 duplicates, got {len(matches)}"
    assert matches[0]["candidate_id"] in ["comp-101", "comp-103"]
    print("   [OK] Duplicate ranking and threshold filtering successful.")

    print("\nALL STANDALONE DUPLICATE DETECTION TESTS PASSED!")

if __name__ == "__main__":
    test_duplicate_detection_pipeline()
