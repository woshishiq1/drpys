# 构建器阶段
# 修改为 node:22-alpine 以兼容新版 puppeteer
FROM node:22-alpine AS builder

# 安装git等编译工具
RUN apk add --no-cache make python3 py3-pip build-base

# 创建一个工作目录
WORKDIR /app

# 克隆GitHub仓库到工作目录
COPY . /app
RUN sed -i 's|const shell = os.platform() === '"'"'win32'"'"' ? '"'"'powershell.exe'"'"' : '"'"'bash'"'"'|const shell = os.platform() === '"'"'win32'"'"' ? '"'"'powershell.exe'"'"' : '"'"'sh'"'"'|' controllers/admin/terminalController.js
RUN rm -rf drpy-node-admin drpy-node-bundle drpy-node-mcp drpy2-quickjs

# 告诉 puppeteer 不要下载内置的 Chromium 浏览器（防止打包卡死或过大）
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# 安装项目依赖项和puppeteer
RUN yarn && yarn add puppeteer

# 复制工作目录中的所有文件到一个临时目录中
# 以便在运行器阶段中使用
RUN mkdir -p /tmp/drpys && \
    cp -r /app/. /tmp/drpys/


# 运行器阶段
# 使用 alpine:latest 作为基础镜像
FROM alpine:latest AS runner

# 创建一个工作目录
WORKDIR /app

# 复制构建器阶段中准备好的文件和依赖项到运行器阶段的工作目录中
COPY --from=builder /tmp/drpys/. /app
RUN cp /app/.env.development /app/.env && \
    rm -f /app/.env.development && \
    sed -i 's|^VIRTUAL_ENV[[:space:]]*=[[:space:]]*$|VIRTUAL_ENV=/app/.venv|' /app/.env && \
    sed -i 's|^ENABLE_TERMINAL=0|ENABLE_TERMINAL=1|' /app/.env && \
    echo '{"ali_token":"","ali_refresh_token":"","quark_cookie":"","uc_cookie":"","bili_cookie":"","thread":"10","enable_dr2":"1","enable_py":"2"}' > /app/config/env.json

# 【关键修改】从 edge 仓库安装 Node.js 22 版本，确保与构建阶段以及 puppeteer 要求的版本一致
RUN apk add --no-cache nodejs --repository=http://dl-cdn.alpinelinux.org/alpine/edge/main

# 安装php8.3及其扩展
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

# 安装python3依赖
RUN apk add --no-cache python3 \
    py3-pip \
    py3-setuptools \
    py3-wheel

# 激活python3虚拟环境并安装requirements依赖
RUN python3 -m venv /app/.venv && \
    . /app/.venv/bin/activate && \
    pip3 install -r /app/spider/py/base/requirements.txt

# 暴露应用程序端口
EXPOSE 5757

# 指定容器启动时执行的命令
CMD ["node", "index.js"]