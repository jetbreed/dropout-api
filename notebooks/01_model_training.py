# notebooks/01_model_training.py
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report
import xgboost as xgb
import shap
import joblib
import warnings
warnings.filterwarnings('ignore')

print("=" * 60)
print("STUDENT DROPOUT PREDICTION - MODEL TRAINING")
print("=" * 60)

# ========================================
# STEP 1: LOAD DATASET
# ========================================
print("\n[1] Loading dataset...")

# If you have the Kaggle xAPI dataset
try:
    df = pd.read_csv('../data/xAPI-Edu-Data.csv')
    print("✅ Loaded xAPI dataset")
except FileNotFoundError:
    # If not, use synthetic dataset
    try:
        df = pd.read_csv('../data/synthetic_student_data.csv')
        print("✅ Loaded synthetic dataset")
    except FileNotFoundError:
        # Generate synthetic data on the fly
        print("⚠️  No dataset found. Generating synthetic data...")
        np.random.seed(42)
        n_students = 5000
        data = {
            'student_id': range(1, n_students + 1),
            'age': np.random.randint(10, 20, n_students),
            'gender': np.random.choice([0, 1], n_students),
            'NationalITy': np.random.choice(['KW', 'Lagos', 'Abuja', 'Rivers', 'Kano'], n_students),
            'PlaceofBirth': np.random.choice(['Nigeria', 'Other'], n_students),
            'StageID': np.random.choice(['Lowerlevel', 'MiddleSchool', 'HighSchool'], n_students),
            'GradeID': np.random.choice(['G-01', 'G-02', 'G-03', 'G-04'], n_students),
            'SectionID': np.random.choice(['A', 'B', 'C'], n_students),
            'Topic': np.random.choice(['Biology', 'Chemistry', 'Physics', 'Math'], n_students),
            'Semester': np.random.choice(['F', 'S'], n_students),
            'Relation': np.random.choice(['Father', 'Mother', 'Guardian'], n_students),
            'raisedhands': np.random.poisson(20, n_students),
            'VisITedResources': np.random.poisson(15, n_students),
            'AnnouncementsView': np.random.poisson(10, n_students),
            'Discussion': np.random.poisson(8, n_students),
            'ParentAnsweringSurvey': np.random.choice(['Yes', 'No'], n_students),
            'ParentschoolSatisfaction': np.random.choice(['Good', 'Bad'], n_students),
            'StudentAbsenceDays': np.random.choice(['Under-7', 'Above-7'], n_students, p=[0.7, 0.3]),
            'Class': np.random.choice(['Dropout', 'Enrolled', 'Graduate'], n_students, p=[0.3, 0.3, 0.4])
        }
        df = pd.DataFrame(data)
        print(f"✅ Generated {n_students} synthetic records")

print(f"   Dataset shape: {df.shape}")
print(f"   Columns: {df.columns.tolist()}")

# ========================================
# STEP 2: EXPLORE DATA
# ========================================
print("\n[2] Exploring data...")
print(f"\nFirst 5 rows:")
print(df.head())

print(f"\nData types:")
print(df.dtypes)

print(f"\nTarget distribution:")
print(df['Class'].value_counts())

# ========================================
# STEP 3: ENCODE CATEGORICAL VARIABLES
# ========================================
print("\n[3] Encoding categorical variables...")

# Identify categorical columns
categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
print(f"   Categorical columns: {categorical_cols}")

label_encoders = {}
for col in categorical_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    label_encoders[col] = le

print("✅ Encoding complete")

# ========================================
# STEP 4: CREATE BINARY TARGET
# ========================================
print("\n[4] Creating binary target (Dropout vs Non-Dropout)...")

# Check Class mapping
print(f"   Class values: {sorted(df['Class'].unique())}")

# Create binary target: 1 = Dropout, 0 = Non-Dropout
# If Class 0 = Dropout, 1 = Enrolled, 2 = Graduate
df['is_dropout'] = (df['Class'] == 0).astype(int)
dropout_rate = df['is_dropout'].mean() * 100
print(f"   Dropout rate: {dropout_rate:.1f}%")

# ========================================
# STEP 5: DEFINE FEATURES AND TARGET
# ========================================
print("\n[5] Defining features and target...")

# Features: all columns except Class and is_dropout
X = df.drop(['Class', 'is_dropout'], axis=1)
y = df['is_dropout']

print(f"   Features shape: {X.shape}")
print(f"   Target shape: {y.shape}")

# ========================================
# STEP 6: SPLIT DATA
# ========================================
print("\n[6] Splitting data into train and test sets...")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"   Training set: {X_train.shape[0]} samples")
print(f"   Test set: {X_test.shape[0]} samples")

# ========================================
# STEP 7: SCALE FEATURES
# ========================================
print("\n[7] Scaling features...")

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Save scaler
joblib.dump(scaler, '../models/scaler.pkl')
print("   Scaler saved to ../models/scaler.pkl")

# ========================================
# STEP 8: TRAIN XGBOOST MODEL
# ========================================
print("\n[8] Training XGBoost model...")

xgb_model = xgb.XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    use_label_encoder=False,
    eval_metric='logloss'
)

xgb_model.fit(X_train_scaled, y_train)
print("✅ Model training complete")

# ========================================
# STEP 9: EVALUATE MODEL
# ========================================
print("\n[9] Evaluating model...")

y_pred = xgb_model.predict(X_test_scaled)
y_pred_proba = xgb_model.predict_proba(X_test_scaled)[:, 1]

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
auc_roc = roc_auc_score(y_test, y_pred_proba)

print("\n" + "=" * 50)
print("MODEL PERFORMANCE METRICS")
print("=" * 50)
print(f" Accuracy:  {accuracy:.4f}")
print(f" Precision: {precision:.4f}")
print(f" Recall:    {recall:.4f}")
print(f" F1-Score:  {f1:.4f}")
print(f" AUC-ROC:   {auc_roc:.4f}")
print("=" * 50)

# ========================================
# STEP 10: CONFUSION MATRIX
# ========================================
print("\n[10] Generating confusion matrix...")

cm = confusion_matrix(y_test, y_pred)
print("   Confusion Matrix:")
print(f"   [[{cm[0][0]}, {cm[0][1]}]")
print(f"    [{cm[1][0]}, {cm[1][1]}]")

# ========================================
# STEP 11: CLASSIFICATION REPORT
# ========================================
print("\n[11] Classification Report:")
print(classification_report(y_test, y_pred, target_names=['Non-Dropout', 'Dropout']))

# ========================================
# STEP 12: FEATURE IMPORTANCE
# ========================================
print("\n[12] Feature importance...")

feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': xgb_model.feature_importances_
}).sort_values('importance', ascending=False)

print("\n   Top 10 Most Important Features:")
for i, row in feature_importance.head(10).iterrows():
    print(f"   {row['feature']}: {row['importance']:.4f}")

# ========================================
# STEP 13: SHAP EXPLANATIONS
# ========================================
print("\n[13] Generating SHAP explanations...")

# Use sample for SHAP (faster)
X_test_sample = X_test_scaled[:100]
explainer = shap.TreeExplainer(xgb_model)
shap_values = explainer.shap_values(X_test_sample)

print("✅ SHAP explanations generated")

# ========================================
# STEP 14: SAVE MODEL
# ========================================
print("\n[14] Saving model and related files...")

joblib.dump(xgb_model, '../models/xgb_model.pkl')
joblib.dump(label_encoders, '../models/label_encoders.pkl')

print("   Model saved to ../models/xgb_model.pkl")
print("   Label encoders saved to ../models/label_encoders.pkl")

# ========================================
# STEP 15: TEST PREDICTION
# ========================================
print("\n[15] Testing prediction on sample student...")

sample = X_test_scaled[0].reshape(1, -1)
probability = xgb_model.predict_proba(sample)[0][1]
risk_score = probability * 100
prediction = xgb_model.predict(sample)[0]

print(f"   Sample student - Risk Score: {risk_score:.1f}%")
print(f"   Prediction: {'Dropout' if prediction == 1 else 'Non-Dropout'}")

print("\n" + "=" * 60)
print("✅ MODEL TRAINING COMPLETE")
print("=" * 60)