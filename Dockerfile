# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the Python backend
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the backend application and ML files
COPY app/ ./app/
COPY ml/ ./ml/
COPY models/ ./models/
COPY dataset.csv ./
COPY dataset_processed.csv ./

# Copy the built frontend from Stage 1
COPY --from=frontend-builder /frontend/dist ./frontend/dist

# Expose the FastAPI port
EXPOSE 8008

# Command to run the application using dynamic PORT for PaaS compatibility
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8008}"]
