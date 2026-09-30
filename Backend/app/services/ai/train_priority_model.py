import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import xgboost as xgb

from app.services.ai.duplicate_detection import generate_embedding

# Define the 4 target classes matching Supabase complaint_priority enum
PRIORITY_CLASSES = ["low", "medium", "high", "critical"]
CLASS_TO_INT = {cls: idx for idx, cls in enumerate(PRIORITY_CLASSES)}
INT_TO_CLASS = {idx: cls for idx, cls in enumerate(PRIORITY_CLASSES)}
TRANSIT_MODES = ["metro", "bus", "train"]


def build_synthetic_dataset() -> pd.DataFrame:
    """
    Constructs a balanced, realistic synthetic training dataset of 120+ Mumbai transit complaints.
    Covers Mumbai Metro, BEST Buses, and Mumbai Local Trains (Western/Central/Harbour lines).
    """
    data = [
        # ================= CRITICAL (Immediate Life Safety / Major Emergency) =================
        # Train
        ("Heavy smoke and burning smell coming from the wheels of local train near Kurla.", "train", "critical"),
        ("Man fell into the gap between platform and local train at Dadar platform 3, severe bleeding.", "train", "critical"),
        ("Rail track fracture spotted near Vidyavihar, local train approaching rapidly.", "train", "critical"),
        ("Stampede-like surge on the foot-over-bridge at Parel station, passengers choking.", "train", "critical"),
        ("Overhead high tension electric wire snapped and hanging live near platform 1.", "train", "critical"),
        ("Passenger having a severe heart attack in the second class compartment.", "train", "critical"),
        ("Gang of criminals with knives threatening passengers in late night local train.", "train", "critical"),
        ("Large boulder fell onto railway tracks between Ghatkopar and Vikhroli.", "train", "critical"),
        ("Local train hit a railway barrier, passengers thrown to floor with severe head injuries.", "train", "critical"),
        ("Fire alarm sounding and dense smoke in local train motor cab.", "train", "critical"),

        # Bus
        ("BEST bus engine caught fire near Sion circle, flames spreading towards passenger cabin.", "bus", "critical"),
        ("Brakes failed on route 340 bus descending downhill, driver unable to stop.", "bus", "critical"),
        ("Violent fight broke out inside bus with iron rods, passengers screaming for help.", "bus", "critical"),
        ("Elderly commuter collapsed unconscious and unresponsive on bus floor.", "bus", "critical"),
        ("Bus hit a pedestrian near Dadar TT circle, victim trapped under wheel.", "bus", "critical"),
        ("Smell of leaking CNG gas very strong inside BEST bus cabin, fire risk.", "bus", "critical"),
        ("Bus driver suffering dizziness and chest pain while driving on highway.", "bus", "critical"),
        ("Roof hatch detached and hanging dangerously inside bus full of school children.", "bus", "critical"),

        # Metro
        ("Metro train doors opened on the wrong side while train was speeding between stations.", "metro", "critical"),
        ("Dense black smoke detected inside metro underground tunnel between BKC and Airport.", "metro", "critical"),
        ("Passenger jumped onto the metro tracks at Andheri station, power cutoff required immediately.", "metro", "critical"),
        ("Severe panic and suffocating stampede condition on metro escalator during emergency stop.", "metro", "critical"),
        ("Glass panel shattered and fell from metro station roof onto passenger platform.", "metro", "critical"),
        ("Active fire in the electrical panel room at Ghatkopar metro station.", "metro", "critical"),
        ("Metro coach emergency communication lever pulled, passenger having respiratory arrest.", "metro", "critical"),
        ("Suspicious unattended bag with ticking electronic sound left under metro seat.", "metro", "critical"),

        # ================= HIGH (Urgent Disruption / Harassment / Theft) =================
        # Train
        ("Signal failure between Bandra and Mahim, all suburban trains stalled for over 45 minutes.", "train", "high"),
        ("Male passenger entered ladies compartment and is harassing and misbehaving with female commuters.", "train", "high"),
        ("Organized pickpocket gang snatched gold chain and phone near train door at Kurla.", "train", "high"),
        ("Overhead wire breakdown at Churchgate, power supply lost on all 4 lines.", "train", "high"),
        ("Train stalled inside dark tunnel for 30 minutes with zero fan ventilation.", "train", "high"),
        ("Emergency alarm chain pulled repeatedly by drunk passengers blocking the entire line.", "train", "high"),
        ("Platform edge tactile tiles broken, blind commuter almost fell onto active track.", "train", "high"),
        ("Door mechanism jammed shut in overcrowded coach, passengers trapped inside.", "train", "high"),
        ("Heavy waterlogging above track level at Sion, trains halting unexpectedly.", "train", "high"),
        ("Physical scuffle and verbal abuse between passengers escalating rapidly near compartment exit.", "train", "high"),

        # Bus
        ("BEST bus broke down on narrow flyover, creating a 5 km traffic standstill.", "bus", "high"),
        ("Drunk driver speeding recklessly and jumping red lights along route 201.", "bus", "high"),
        ("Conductor physically pushed a college student off moving bus.", "bus", "high"),
        ("Front tyre burst violently on Western Express Highway while bus was in motion.", "bus", "high"),
        ("Women passenger harassed by drunk commuter, conductor refused to intervene.", "bus", "high"),
        ("Bus steering wheel locked up suddenly at intersection.", "bus", "high"),
        ("Fare card machine deducted money 3 times and conductor threatened passenger.", "bus", "high"),
        ("Bus door mechanism broke open while traveling at high speed on sea link.", "bus", "high"),

        # Metro
        ("Metro train came to an abrupt emergency halt between stations, lights turned off.", "metro", "high"),
        ("Ticket checking barrier malfunctioning, trapping passengers against glass gates.", "metro", "high"),
        ("Man caught secretly video recording women inside metro ladies coach.", "metro", "high"),
        ("Platform screen doors (PSD) failed to open, train departed leaving commuters stranded.", "metro", "high"),
        ("Severe water leakage pouring onto high-voltage escalator at metro concourse.", "metro", "high"),
        ("Metro AFC gate electronic system completely down at Andheri, massive crowd buildup.", "metro", "high"),
        ("Luggage scanner machine smoking and emitting sparks at station security checkpoint.", "metro", "high"),
        ("Station lift stalled with pregnant woman and child stuck inside for 25 minutes.", "metro", "high"),

        # ================= MEDIUM (Service Deficiencies / Delays / Inconvenience) =================
        # Train
        ("Air conditioning in AC local train coach 4 is completely non-functional and sweating.", "train", "medium"),
        ("Local train arrived 25 minutes behind scheduled timetable without any prior announcement.", "train", "medium"),
        ("Coach ceiling leaking heavily during rain, seats completely soaked.", "train", "medium"),
        ("Multiple seat handles and grab rails broken in general compartment.", "train", "medium"),
        ("Ticket vending machine at station deducted 50 rupees but failed to print ticket.", "train", "medium"),
        ("Foul smell and overflowing garbage near platform 2 water dispensing area.", "train", "medium"),
        ("Station public address system audio is very muffled and difficult to understand.", "train", "medium"),
        ("Train window latch broken, window shutter keeps falling down repeatedly.", "train", "medium"),
        ("Station fan over platform seating area is rattling loudly and wobbling.", "train", "medium"),
        ("Display indicator board showing incorrect train arrival times at Borivali.", "train", "medium"),

        # Bus
        ("BEST bus route 312 skipped scheduled trip twice, waited for 50 minutes.", "bus", "medium"),
        ("Conductor was extremely rude, refused to give 5 rupee coin change.", "bus", "medium"),
        ("Rainwater dripping continuously from bus window pane onto passenger seat.", "bus", "medium"),
        ("Bus interior seats are covered in thick dirt and grease.", "bus", "medium"),
        ("Digital destination board on front of bus is blank, commuters confused.", "bus", "medium"),
        ("Chalo smart card reader device was not accepting payment on route 418.", "bus", "medium"),
        ("Stop bell wire inside bus is disconnected, passengers unable to signal stop.", "bus", "medium"),
        ("Bus stopped 50 meters away from the designated bus shelter in muddy water.", "bus", "medium"),

        # Metro
        ("Metro coach air conditioning temperature set too warm, very stuffy during evening peak.", "metro", "medium"),
        ("Ticket counter staff was unhelpful and refused to assist with card recharge.", "metro", "medium"),
        ("Metro token dropped in turnstile but gate did not unlock.", "metro", "medium"),
        ("Station washroom has no running water and locks are broken.", "metro", "medium"),
        ("Customer service desk at Versova station had no staff present for 20 minutes.", "metro", "medium"),
        ("Digital route map screen inside coach flickering and showing error screen.", "metro", "medium"),
        ("Mobile ticketing QR code reader at entry turnstile takes multiple attempts to scan.", "metro", "medium"),
        ("Hand sanitizer dispensers at station entry points are completely empty.", "metro", "medium"),

        # ================= LOW (Minor Feedback / Suggestions / Cosmetic) =================
        # Train
        ("Spelling mistake on English direction sign at Marine Lines platform 1.", "train", "low"),
        ("Request to add one additional dustbin near the east exit gate.", "train", "low"),
        ("Station clock on platform 4 is 3 minutes slower than actual time.", "train", "low"),
        ("Suggestion to introduce a fast local halt at this station during morning hours.", "train", "low"),
        ("Water cooler water is at room temperature, could be colder in summer.", "train", "low"),
        ("Paint peeling off from the boundary wall near platform staircase.", "train", "low"),
        ("Platform lighting is slightly dim near the north end of the station.", "train", "low"),
        ("Inquiry regarding monthly railway pass concessions for senior citizens.", "train", "low"),
        ("Old advertising poster torn and hanging from bulletin board.", "train", "low"),
        ("Request for a digital train timetable chart near the main booking office.", "train", "low"),

        # Bus
        ("Bus stop name board paint has faded and is hard to read from distance.", "bus", "low"),
        ("Suggestion to extend route 385 by two stops up to the new hospital.", "bus", "low"),
        ("Bus stop timetable sheet is outdated, still shows old schedule.", "bus", "low"),
        ("Seat cushion on last row has a small tear in the fabric.", "bus", "low"),
        ("Inquiry about student bus pass application process for college semester.", "bus", "low"),
        ("Request for bus shelter roof extension to provide better shade.", "bus", "low"),
        ("Bus interior lights are slightly yellow, LED white lights would look better.", "bus", "low"),
        ("Feedback praising the polite behavior of route 115 conductor.", "bus", "low"),

        # Metro
        ("Station announcement chime sound could be slightly softer.", "metro", "low"),
        ("Request to add more charging points near the station waiting benches.", "metro", "low"),
        ("Suggestion to sell metro smart cards with different color designs.", "metro", "low"),
        ("Station background music is repetitive during afternoon hours.", "metro", "low"),
        ("Signboard font size for elevator icon could be slightly larger for seniors.", "metro", "low"),
        ("Inquiry about taking bicycles on the metro during non-rush hours.", "metro", "low"),
        ("Metro station exterior landscape garden needs some watering.", "metro", "low"),
        ("Suggestion to add Hindi subtitles to the tourist info screens.", "metro", "low"),
    ]

    return pd.DataFrame(data, columns=["description", "transit_mode", "priority"])


def extract_features(df: pd.DataFrame) -> np.ndarray:
    """
    Transforms text and tabular features into a unified numerical feature matrix.
    Feature vector = 384 (dense text embedding) + 3 (one-hot transit mode: metro, bus, train) = 387 dims.
    """
    embeddings = []
    print(f"Generating 384-dim semantic embeddings for {len(df)} samples...")
    for text in df["description"]:
        vec = generate_embedding(text)
        embeddings.append(vec)

    X_text = np.array(embeddings, dtype=np.float32)

    # One-hot encode transit_mode
    mode_one_hot = []
    for mode in df["transit_mode"]:
        m = (mode or "bus").lower().strip()
        encoded = [
            1.0 if m == "metro" else 0.0,
            1.0 if m == "bus" else 0.0,
            1.0 if m == "train" else 0.0,
        ]
        mode_one_hot.append(encoded)

    X_mode = np.array(mode_one_hot, dtype=np.float32)
    # Concatenate text features (384) + tabular mode features (3) = 387 dimensions
    X = np.hstack([X_text, X_mode])
    return X


def train_and_save_model(model_output_dir: str = "./models"):
    """
    Trains an XGBoost multi-class classifier on the synthetic transit dataset
    and persists the model artifact to disk.
    """
    os.makedirs(model_output_dir, exist_ok=True)
    df = build_synthetic_dataset()
    print(f"Dataset assembled: {len(df)} total rows across 4 balanced classes:")
    print(df["priority"].value_counts())

    X = extract_features(df)
    y = np.array([CLASS_TO_INT[p] for p in df["priority"]], dtype=np.int64)

    # Train / Test split (80% train, 20% test, stratified across classes)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print("\nTraining XGBoost Multi-Class Classifier...")
    # XGBoost Hyperparameters tuned for dense embedding features:
    # - multi:softprob outputs probability distribution over the 4 priority classes
    # - max_depth=3 prevents overfitting on small prototype datasets
    # - learning_rate=0.1 ensures steady convergence
    model = xgb.XGBClassifier(
        objective="multi:softprob",
        num_class=4,
        n_estimators=80,
        max_depth=3,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=42,
        eval_metric="mlogloss",
    )

    model.fit(X_train, y_train)

    # Evaluate on held-out test set
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"\nModel Evaluation (Held-Out Test Set Accuracy): {acc * 100:.2f}%")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=PRIORITY_CLASSES))

    # Persist model and metadata
    model_path = os.path.join(model_output_dir, "priority_xgb_model.joblib")
    artifact = {
        "model": model,
        "classes": PRIORITY_CLASSES,
        "class_to_int": CLASS_TO_INT,
        "int_to_class": INT_TO_CLASS,
        "feature_dim": X.shape[1],
    }
    joblib.dump(artifact, model_path)
    print(f"Trained model artifact saved successfully to: {model_path}")
    return model_path


if __name__ == "__main__":
    train_and_save_model()
