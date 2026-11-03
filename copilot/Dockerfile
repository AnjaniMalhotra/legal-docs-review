# The Contract Copilot app. Secrets and contracts are never copied in (see .dockerignore).
FROM python:3.12-slim

WORKDIR /app

# Install requirements first, so a code change does not reinstall them.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["./scripts/run.sh"]
