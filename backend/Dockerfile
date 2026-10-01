FROM python:3.11-slim

WORKDIR /app


# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY . .

# Expose the FastAPI port
EXPOSE 8000

# Start FastAPI server via uvicorn, but run the seed script first to ensure tables exist
CMD ["sh", "-c", "python seed_users.py && uvicorn main:app --host 0.0.0.0 --port 8000"]
