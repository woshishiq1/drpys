# 构建阶段
FROM node:22-alpine AS builder

WORKDIR /app
COPY . /app
RUN rm -rf drpy-node-admin drpy-node-bundle drpy-node-mcp drpy2-quickjs && \
    rm -rf examples install soft .nomedia .vercelignore package-bundle.js package.js package.py vercel.json && \
    sed -i 's|const shell = os.platform() === '"'"'win32'"'"' ? '"'"'powershell.exe'"'"' : '"'"'bash'"'"'|const shell = os.platform() === '"'"'win32'"'"' ? '"'"'powershell.exe'"'"' : '"'"'sh'"'"'|' controllers/admin/terminalController.js && \
    cp /app/.plugins.example.js /app/.plugins.js && \
    rm -f /app/.plugins.example.js && \
    mkdir plugins && \
    cp /app/.env.development /app/.env && \
    rm -f /app/.env.development && \
    sed -i 's|^VIRTUAL_ENV[[:space:]]*=[[:space:]]*$|VIRTUAL_ENV=/app/.venv|' /app/.env && \
    sed -i 's|^ENABLE_TERMINAL=0|ENABLE_TERMINAL=1|' /app/.env && \
    echo '{"ali_token":"","ali_refresh_token":"","quark_cookie":"","uc_cookie":"","bili_cookie":"","thread":"10","enable_dr2":"1","enable_py":"2"}' > /app/config/env.json

RUN apk add --no-cache make python3 py3-pip build-base

# =================【修复 1：跳过浏览器下载，防止 Buildx 132 报错】=================
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN corepack enable && yarn && yarn add puppeteer@25.0.4
# =============================================================================

RUN mkdir -p /tmp/drpys && \
    cp -r /app/. /tmp/drpys/


# 运行器阶段
FROM alpine:latest AS runner

WORKDIR /app
COPY --from=builder /tmp/drpys/. /app
ENV TZ=Asia/Shanghai

# =================【修复 2：指定 Puppeteer 寻找系统 Chromium 的路径】=================
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# 安装 nodejs，并安装 Alpine 原生 Chromium 及其所需的字体依赖
RUN apk add --no-cache \
    nodejs \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont
# =============================================================================

# 安装php8
RUN apk add --no-cache \
    php83 \
    php83-cli \
    php83-curl \
    php83-mbstring \
    php83-xml \
    php83-pdo \
    php83-pdo_mysql \
    php83-pdo_sqlite \
    php83-openssl \
    php83-sqlite3 \
    php83-json
RUN ln -sf /usr/bin/php83 /usr/bin/php

# 安装python3
RUN apk add --no-cache python3 \
    py3-pip \
    py3-setuptools \
    py3-wheel
RUN python3 -m venv /app/.venv && \
    . /app/.venv/bin/activate && \
    pip3 install -r /app/spider/py/base/requirements.txt

EXPOSE 5757
CMD ["node", "index.js"]
