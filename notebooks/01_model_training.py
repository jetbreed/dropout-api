# notebooks/01_model_training.py
import pandas as pd
import numpy as np
import os
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
import xgboost as xgb
import joblib
import warnings
warnings.filterwarnings('ignore')

# Create models folder in the current directory
models_dir = os.path.join(os.getcwd(), 'models')
os.makedirs(models_dir, exist_ok=True)

print("=" * 60)
print("STUDENT DROPOUT PREDICTION - MODEL TRAINING")
print("=" * 60)

# Generate synthetic data
print("\n[1] Generating dataset...")
np.random.seed(42)
n_students = 5000

data = {
    'student_id': range(1, n_students + 1),
    'age': np.random.randint(10, 20, n_students),
    'gender': np.random.choice([0, 1], n_students),
    'previous_grade': np.random.normal(65, 15, n_students).clip(0, 100),
    'attendance_rate': np.random.normal(75, 20, n_students).clip(0, 100),
    'assignments_completed': np.random.normal(70, 25, n_students).clip(0, 100),
    'test_scores_avg': np.random.normal(65, 15, n_students).clip(0, 100),
    'days_absent_last_term': np.random.poisson(5, n_students),
    'late_arrivals': np.random.poisson(3, n_students),
    'disciplinary_incidents': np.random.poisson(1, n_students),
    'parent_education_level': np.random.choice([1,2,3,4,5], n_students, p=[0.2,0.3,0.25,0.15,0.1]),
    'family_income_level': np.random.choice([1,2,3,4,5], n_students, p=[0.2,0.3,0.25,0.15,0.1]),
    'has_internet_access': np.random.choice([0,1], n_students, p=[0.4,0.6]),
}

df = pd.DataFrame(data)

# Calculate risk score
risk_score = (
    (100 - df['attendance_rate']) * 0.5 +
    (100 - df['assignments_completed']) * 0.3 +
    (100 - df['test_scores_avg']) * 0.2 +
    df['days_absent_last_term'] * 2 +
    df['disciplinary_incidents'] * 5 +
    (6 - df['parent_education_level']) * 5 +
    (6 - df['family_income_level']) * 3
)

# Normalize risk to 0-100
risk_score = (risk_score - risk_score.min()) / (risk_score.max() - risk_score.min()) * 100
df['is_dropout'] = (risk_score > 70).astype(int)
df['Class'] = df['is_dropout'].map({0: 'Non-Dropout', 1: 'Dropout'})

print(f"   Dataset shape: {df.shape}")
print(f"   Dropout rate: {df['is_dropout'].mean() * 100:.1f}%")

# Drop student_id (not a feature)
df = df.drop('student_id', axis=1)

print("\n[2] Defining features and target...")
X = df.drop(['Class', 'is_dropout'], axis=1)
y = df['is_dropout']
print(f"   Features: {X.shape[1]}")
print(f"   Features: {', '.join(X.columns)}")

print("\n[3] Splitting data...")
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
print(f"   Training set: {X_train.shape[0]} samples")
print(f"   Test set: {X_test.shape[0]} samples")

print("\n[4] Scaling features...")
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Save scaler
scaler_path = os.path.join(models_dir, 'scaler.pkl')
joblib.dump(scaler, scaler_path)
print(f"   Scaler saved to {scaler_path}")

print("\n[5] Training XGBoost model...")
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

print("\n[6] Evaluating model...")
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

print("\n[7] Feature importance...")
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': xgb_model.feature_importances_
}).sort_values('importance', ascending=False)
print("\n   Top 10 Most Important Features:")
for i, row in feature_importance.head(10).iterrows():
    print(f"   {row['feature']}: {row['importance']:.4f}")

print("\n[8] Saving model...")
model_path = os.path.join(models_dir, 'xgb_model.pkl')
joblib.dump(xgb_model, model_path)
print(f"   Model saved to {model_path}")

print("\n[9] Testing prediction on sample student...")
sample = X_test_scaled[0].reshape(1, -1)
probability = xgb_model.predict_proba(sample)[0][1]
risk_score = probability * 100
prediction = xgb_model.predict(sample)[0]
print(f"   Sample student - Risk Score: {risk_score:.1f}%")
print(f"   Prediction: {'Dropout' if prediction == 1 else 'Non-Dropout'}")

print("\n" + "=" * 60)
print("✅ MODEL TRAINING COMPLETE")
print("=" * 60)

# Verify files were created
print("\n[10] Verifying saved files...")
print(f"   Scal er exists: {os.path.exists(scaler_path)}")
print(f"   Model exists: {os.path.exists(model_path)}")