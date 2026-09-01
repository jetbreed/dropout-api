# notebooks/synthetic_data_generator.py
import pandas as pd
import numpy as np
import os

# Create data directory if it doesn't exist
os.makedirs('./data', exist_ok=True)

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

risk_score = (
    (100 - df['attendance_rate']) * 0.5 +
    (100 - df['assignments_completed']) * 0.3 +
    (100 - df['test_scores_avg']) * 0.2 +
    df['days_absent_last_term'] * 2 +
    df['disciplinary_incidents'] * 5 +
    (6 - df['parent_education_level']) * 5 +
    (6 - df['family_income_level']) * 3
)
risk_score = (risk_score - risk_score.min()) / (risk_score.max() - risk_score.min()) * 100
df['is_dropout'] = (risk_score > 70).astype(int)
df['Class'] = df['is_dropout'].map({0: 'Non-Dropout', 1: 'Dropout'})

df.to_csv('./data/synthetic_student_data.csv', index=False)
print(f"✅ Saved {n_students} synthetic student records to ./data/synthetic_student_data.csv")
print(f"📊 Dropout rate: {df['is_dropout'].mean() * 100:.1f}%")