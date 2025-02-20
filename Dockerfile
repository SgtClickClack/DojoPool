# Use an official lightweight Python image.
FROM python:3.10-slim

# Environment variables to prevent Python from writing pyc files and buffering output.
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Set the working directory inside the container.
WORKDIR /app

# Copy dependency definitions.
COPY requirements.txt .

# Install dependencies.
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the rest of the application code.
COPY . .

# Expose the port that the app runs on.
EXPOSE 5000

# Run the application using Waitress.
CMD ["python", "-m", "waitress", "--listen=0.0.0.0:5000", "src/dojopool/main/routes.py"]
