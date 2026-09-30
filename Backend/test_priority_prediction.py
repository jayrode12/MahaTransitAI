from app.services.ai.priority_prediction import predict_priority, get_priority_model

def test_priority_prediction_pipeline():
    print("Testing Complaint Priority Prediction pipeline (XGBoost)...")

    # 1. Verify model artifact loading
    print("1. Loading trained model artifact from disk...")
    artifact = get_priority_model()
    print("   Artifact keys:", list(artifact.keys()))
    print("   Target classes:", artifact["classes"])
    print("   Feature dimension:", artifact["feature_dim"])
    assert artifact["feature_dim"] == 387

    # 2. Test predictions on diverse real-world transit complaints
    test_cases = [
        ("Heavy fire and burning smoke spreading from bus engine near Sion.", "bus", "critical"),
        ("Signal failure between Bandra and Mahim, trains stopped for 1 hour.", "train", "high"),
        ("Air conditioning in metro coach 2 is not cooling and very humid.", "metro", "medium"),
        ("Spelling mistake on station signboard at platform 2.", "train", "low"),
    ]

    print("\n2. Running inference on test complaints...")
    for text, mode, expected_category in test_cases:
        priority, confidence = predict_priority(text, transit_mode=mode)
        print(f"\n   Text       : '{text}'")
        print(f"   Mode       : {mode}")
        print(f"   Predicted  : {priority.upper()} (Confidence: {confidence * 100:.2f}%)")
        print(f"   Expected   : ~{expected_category.upper()}")
        assert priority in ["low", "medium", "high", "critical"]
        assert 0.0 <= confidence <= 1.0

    print("\nALL STANDALONE PRIORITY PREDICTION TESTS PASSED!")

if __name__ == "__main__":
    test_priority_prediction_pipeline()
