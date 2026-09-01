# dashboard/streamlit_app.py
import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import os

st.set_page_config(
    page_title="Student Dropout Data Explorer",
    page_icon="📊",
    layout="wide"
)

st.title("📊 Student Dropout Data Explorer")
st.markdown("---")

# Load data
@st.cache_data
def load_data():
    try:
        df = pd.read_csv('../data/synthetic_student_data.csv')
        return df
    except FileNotFoundError:
        # If file not found, generate data on the fly
        np.random.seed(42)
        n = 5000
        data = {
            'student_id': range(1, n + 1),
            'age': np.random.randint(10, 20, n),
            'gender': np.random.choice([0, 1], n),
            'previous_grade': np.random.normal(65, 15, n).clip(0, 100),
            'attendance_rate': np.random.normal(75, 20, n).clip(0, 100),
            'assignments_completed': np.random.normal(70, 25, n).clip(0, 100),
            'test_scores_avg': np.random.normal(65, 15, n).clip(0, 100),
            'days_absent_last_term': np.random.poisson(5, n),
            'late_arrivals': np.random.poisson(3, n),
            'disciplinary_incidents': np.random.poisson(1, n),
            'parent_education_level': np.random.choice([1,2,3,4,5], n, p=[0.2,0.3,0.25,0.15,0.1]),
            'family_income_level': np.random.choice([1,2,3,4,5], n, p=[0.2,0.3,0.25,0.15,0.1]),
            'has_internet_access': np.random.choice([0,1], n, p=[0.4,0.6]),
        }
        df = pd.DataFrame(data)
        risk = (
            (100 - df['attendance_rate']) * 0.5 +
            (100 - df['assignments_completed']) * 0.3 +
            (100 - df['test_scores_avg']) * 0.2 +
            df['days_absent_last_term'] * 2 +
            df['disciplinary_incidents'] * 5 +
            (6 - df['parent_education_level']) * 5 +
            (6 - df['family_income_level']) * 3
        )
        risk = (risk - risk.min()) / (risk.max() - risk.min()) * 100
        df['is_dropout'] = (risk > 70).astype(int)
        df['Class'] = df['is_dropout'].map({0: 'Non-Dropout', 1: 'Dropout'})
        return df

df = load_data()

st.sidebar.header("📊 Dashboard Controls")

# Sidebar filters
st.sidebar.subheader("Filters")
show_dropout_only = st.sidebar.checkbox("Show only Dropout students", False)

# Filter data
if show_dropout_only:
    df_filtered = df[df['is_dropout'] == 1]
else:
    df_filtered = df

st.sidebar.markdown(f"**Total Records:** {len(df_filtered):,}")
st.sidebar.markdown(f"**Dropout Rate:** {df['is_dropout'].mean() * 100:.1f}%")

# ============================================
# MAIN DASHBOARD
# ============================================

# Row 1: Key Metrics
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric("Total Students", f"{len(df):,}")
with col2:
    st.metric("Dropout Students", f"{df['is_dropout'].sum():,}")
with col3:
    st.metric("Dropout Rate", f"{df['is_dropout'].mean() * 100:.1f}%")
with col4:
    st.metric("Features", f"{len(df.columns) - 2}")

st.markdown("---")

# Row 2: Charts
col1, col2 = st.columns(2)

with col1:
    st.subheader("🎯 Dropout Distribution")
    fig, ax = plt.subplots(figsize=(8, 6))
    colors = ['#4CAF50', '#FF5722']
    df['Class'].value_counts().plot(kind='pie', autopct='%1.1f%%', colors=colors, ax=ax, startangle=90)
    ax.set_ylabel('')
    st.pyplot(fig)

with col2:
    st.subheader("📈 Dropout by Attendance Rate")
    fig, ax = plt.subplots(figsize=(8, 6))
    bins = [0, 60, 70, 80, 90, 100]
    labels = ['<60%', '60-70%', '70-80%', '80-90%', '90-100%']
    df['attendance_group'] = pd.cut(df['attendance_rate'], bins=bins, labels=labels)
    attendance_dropout = df.groupby('attendance_group')['is_dropout'].mean() * 100
    attendance_dropout.plot(kind='bar', color='skyblue', ax=ax)
    ax.set_xlabel('Attendance Group')
    ax.set_ylabel('Dropout Rate (%)')
    ax.set_title('Dropout Rate by Attendance Group')
    st.pyplot(fig)

st.markdown("---")

# Row 3: More Charts
col1, col2 = st.columns(2)

with col1:
    st.subheader("📊 Feature Distribution")
    feature = st.selectbox("Select Feature to Visualize", 
                           ['age', 'previous_grade', 'attendance_rate', 'assignments_completed', 
                            'test_scores_avg', 'days_absent_last_term', 'parent_education_level', 
                            'family_income_level'])
    fig, ax = plt.subplots(figsize=(8, 5))
    for cls in ['Non-Dropout', 'Dropout']:
        subset = df[df['Class'] == cls]
        ax.hist(subset[feature], alpha=0.6, label=cls, bins=30)
    ax.set_xlabel(feature.replace('_', ' ').title())
    ax.set_ylabel('Frequency')
    ax.legend()
    st.pyplot(fig)

with col2:
    st.subheader("🔍 Correlation Matrix")
    numeric_cols = ['age', 'previous_grade', 'attendance_rate', 'assignments_completed', 
                    'test_scores_avg', 'days_absent_last_term', 'late_arrivals', 
                    'disciplinary_incidents', 'parent_education_level', 'family_income_level']
    fig, ax = plt.subplots(figsize=(10, 8))
    corr = df[numeric_cols].corr()
    sns.heatmap(corr, annot=True, cmap='coolwarm', fmt='.2f', ax=ax)
    st.pyplot(fig)

st.markdown("---")

# Row 4: Scatter Plot
st.subheader("📈 Scatter Plot: Feature Relationships")
col1, col2 = st.columns(2)
with col1:
    x_axis = st.selectbox("X-Axis", numeric_cols, index=0)
with col2:
    y_axis = st.selectbox("Y-Axis", numeric_cols, index=2)

fig, ax = plt.subplots(figsize=(10, 6))
for cls in ['Non-Dropout', 'Dropout']:
    subset = df[df['Class'] == cls]
    ax.scatter(subset[x_axis], subset[y_axis], alpha=0.5, label=cls)
ax.set_xlabel(x_axis.replace('_', ' ').title())
ax.set_ylabel(y_axis.replace('_', ' ').title())
ax.legend()
st.pyplot(fig)

st.markdown("---")

# Row 5: Data Table
st.subheader("📋 Sample Data")
st.dataframe(df.head(100))