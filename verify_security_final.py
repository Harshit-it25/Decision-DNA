from ml.watermarker import Watermarker
import joblib
import os
import json

def verify_system():
    print("--- Decision DNA Final Security Verification ---")
    
    # 1. Check Model Metadata
    meta_path = 'models/model_metadata_prod.json'
    if os.path.exists(meta_path):
        with open(meta_path, 'r') as f:
            meta = json.load(f)
        print(f"Model Version: {meta.get('version')}")
        print(f"Hardening Active: {meta.get('is_hardened')}")
        print(f"Watermarking Active: {meta.get('is_watermarked')}")
    
    # 2. Verify Watermark Signature
    model_path = 'models/random_forest_model_prod.pkl'
    scaler_path = 'models/scaler_prod.pkl'
    
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        wm = Watermarker(scaler_path=scaler_path)
        verification = wm.verify_watermark(model, sample_size=50)
        print(f"\nOwnership Verification:")
        print(f"Status: {'[VERIFIED]' if verification['is_watermarked'] else '[FAILED]'}")
        print(f"Confidence: {verification['confidence']:.2f}")
        print(f"Correct Responses: {verification['correct_responses']}/{verification['sample_size']}")

if __name__ == "__main__":
    verify_system()
