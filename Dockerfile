FROM node:20-slim AS builder

WORKDIR /app

# パッケージファイルをコピーして依存インストール
COPY package.json package-lock.json ./
RUN npm ci

# ソースコードをコピー
COPY . .

# Next.jsビルド（standalone出力）
RUN npm run build

# ---- 本番用イメージ ----
FROM node:20-slim

# Puppeteer用のChromium依存パッケージをインストール
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-noto-cjk \
    fonts-noto-cjk-extra \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Puppeteerにシステムの Chromium を使わせる
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

WORKDIR /app

# standaloneビルド成果物をコピー
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 起動スクリプトをコピー
COPY start.sh ./
RUN chmod +x start.sh

# データディレクトリを作成
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["./start.sh"]
