# 使用网易云镜像
FROM node:20-slim

# 使用国内镜像安装Chromium和相关字体
RUN apt-get update \
    && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# 安装Puppeteer所需的其他依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libglu1-mesa \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libu2f-udev \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    libxshmfence1 \
    xdg-utils \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 设置工作目录
WORKDIR /app

# 首先复制依赖相关文件
COPY package*.json ./
COPY .env* ./

# 然后再复制其他源代码
COPY ./ .

# 安装依赖并构建
RUN npm install && \
    npm run build

# 暴露端口
EXPOSE 3000

# Puppeteer设置：跳过Chromium下载并使用已安装的Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV CHROME_PATH=/usr/bin/chromium
# ENV NODE_ENV=production
# ENV NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 启动命令
CMD ["npm", "start"] 