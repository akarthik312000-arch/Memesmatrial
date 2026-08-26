FROM node:22-bookworm-slim

# ffmpeg for rendering; fontconfig deps for drawtext
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Hugging Face expects 7860; Render/cloud hosts inject PORT dynamically
ENV PORT=7860
ENV HOSTNAME=0.0.0.0
EXPOSE 7860

CMD ["sh", "-c", "npm run start -- -p ${PORT:-7860}"]
