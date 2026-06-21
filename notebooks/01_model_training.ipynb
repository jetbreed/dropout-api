# notebooks/01_model_training.ipynb

# Cell 1: Import libraries
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix, classification_report
import xgboost as xgb
import shap
import joblib
import warnings
warnings.filterwarnings('ignore')

# Cell 2: Load dataset
# If using Kaggle xAPI dataset
df = pd.read_csv('../data/xAPI-Edu-Data.csv')

# If using synthetic data (run the synthetic data generator in Step 2.5 first)
# df = pd.read_csv('../data/synthetic_student_data.csv')

print(f"Dataset shape: {df.shape}")
print(f"Columns: {df.columns.tolist()}")

# Cell 3: Explore data
df.head()
df.info()
df.describe()

# Cell 4: Check target distribution
print(df['Class'].value_counts())
print(df['Class'].value_counts(normalize=True) * 100)

# Visualize target distribution
plt.figure(figsize=(6,4))
df['Class'].value_counts().plot(kind='bar')
plt.title('Distribution of Student Outcomes')
plt.xlabel('Class')
plt.ylabel('Count')
plt.savefig('../models/target_distribution.png')
plt.show()

# Cell 5: Handle categorical variables
# Identify categorical columns
categorical_cols = df.select_dtypes(include=['object']).columns.tolist()
print(f"Categorical columns: {categorical_cols}")

# Encode categorical variables
label_encoders = {}
for col in categorical_cols:
    le = LabelEncoder()
    df[col] = le.fit_transform(df[col])
    label_encoders[col] = le
    print(f"{col}: {dict(zip(le.classes_, le.transform(le.classes_)))}")

# Cell 6: Define features and target
# Target is 'Class' (encoded: 0=Dropout, 1=Enrolled, 2=Graduate)
# For binary classification, we focus on Dropout vs Non-Dropout

# Create binary target: 1 = Dropout, 0 = Non-Dropout
df['is_dropout'] = (df['Class'] == 0).astype(int)  # Assuming 0 is Dropout
print(f"Dropout rate: {df['is_dropout'].mean() * 100:.1f}%")

# Define features (exclude Class and is_dropout)
X = df.drop(['Class', 'is_dropout'], axis=1)
y = df['is_dropout']

print(f"Features shape: {X.shape}")
print(f"Target shape: {y.shape}")

# Cell 7: Split data
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"Training set: {X_train.shape}")
print(f"Test set: {X_test.shape}")

# Cell 8: Scale features (optional for tree-based models, but good practice)
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# Save scaler
joblib.dump(scaler, '../models/scaler.pkl')
print("Scaler saved to ../models/scaler.pkl")

# Cell 9: Train XGBoost Classifier
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

# Train with early stopping
eval_set = [(X_test_scaled, y_test)]
xgb_model.fit(
    X_train_scaled, y_train,
    eval_set=eval_set,
    verbose=False
)

print("Model training complete!")

# Cell 10: Make predictions
y_pred = xgb_model.predict(X_test_scaled)
y_pred_proba = xgb_model.predict_proba(X_test_scaled)[:, 1]

# Cell 11: Evaluate model
accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
auc_roc = roc_auc_score(y_test, y_pred_proba)

print("=" * 50)
print("MODEL PERFORMANCE METRICS")
print("=" * 50)
print(f"Accuracy:  {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall:    {recall:.4f}")
print(f"F1-Score:  {f1:.4f}")
print(f"AUC-ROC:  {auc_roc:.4f}")
print("=" * 50)

# Cell 12: Confusion Matrix
cm = confusion_matrix(y_test, y_pred)
plt.figure(figsize=(5,4))
sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
plt.title('Confusion Matrix')
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.savefig('../models/confusion_matrix.png')
plt.show()

# Cell 13: Classification Report
print("\nClassification Report:")
print(classification_report(y_test, y_pred, target_names=['Non-Dropout', 'Dropout']))

# Cell 14: Feature importance
feature_importance = pd.DataFrame({
    'feature': X.columns,
    'importance': xgb_model.feature_importances_
}).sort_values('importance', ascending=False)

print("\nTop 10 Most Important Features:")
print(feature_importance.head(10))

# Visualize feature importance
plt.figure(figsize=(10,6))
sns.barplot(data=feature_importance.head(10), x='importance', y='feature')
plt.title('Top 10 Feature Importances (XGBoost)')
plt.tight_layout()
plt.savefig('../models/feature_importance.png')
plt.show()

# Cell 15: SHAP Explanations
# Use a smaller subset for SHAP (faster computation)
X_test_sample = X_test_scaled[:100]

# Create SHAP explainer
explainer = shap.TreeExplainer(xgb_model)
shap_values = explainer.shap_values(X_test_sample)

# Summary plot
plt.figure(figsize=(10,6))
shap.summary_plot(shap_values, X_test_sample, feature_names=X.columns.tolist(), show=False)
plt.tight_layout()
plt.savefig('../models/shap_summary.png')
plt.show()

# Cell 16: Save model and related files
joblib.dump(xgb_model, '../models/xgb_model.pkl')
joblib.dump(label_encoders, '../models/label_encoders.pkl')

print("Model saved to ../models/xgb_model.pkl")
print("Label encoders saved to ../models/label_encoders.pkl")
print("Scaler saved to ../models/scaler.pkl")

# Cell 17: Create a sample prediction function
def predict_dropout(student_features):
    """
    Predict dropout risk for a single student.
    
    Args:
        student_features: numpy array of feature values
    
    Returns:
        risk_score (0-100), prediction (0/1), shap_values
    """
    # Scale features
    features_scaled = scaler.transform(student_features.reshape(1, -1))
    
    # Get prediction and probability
    prediction = xgb_model.predict(features_scaled)[0]
    probability = xgb_model.predict_proba(features_scaled)[0][1]
    
    # Convert to risk score (0-100)
    risk_score = probability * 100
    
    return risk_score, prediction

# Test with a sample student
sample = X_test_scaled[0].reshape(1, -1)
risk, pred = predict_dropout(sample)
print(f"Sample student - Risk Score: {risk:.1f}%, Prediction: {'Dropout' if pred == 1 else 'Non-Dropout'}")