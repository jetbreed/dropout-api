# Windows
python -m venv venv
venv\Scripts\activate

# Mac/Linux
python3 -m venv venv
source venv/bin/activate

# You should see (venv) appear at the beginning of your terminal prompt.




pip install -r requirements.txt



# In your terminal (with venv activated), from the dropout-api folder:

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


# You should see:
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.



# Open your browser and go to:

http://localhost:8000 → Should show {"message":"Student Dropout Risk Prediction API","status":"running","docs":"/docs"}

http://localhost:8000/docs → Interactive Swagger UI (you can test the API here)

http://localhost:8000/redoc → ReDoc documentation