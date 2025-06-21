import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
const chromium = require("@sparticuz/chromium-min");
const puppeteer = require("puppeteer-core");
const fs = require("fs");
import * as GenericPool from 'generic-pool';
import crypto from 'crypto';


// Browser Pool Configuration
const POOL_MAX = Number(process.env.CHROME_POOL_MAX || '4');
const POOL_MIN = Number(process.env.CHROME_POOL_MIN || '2');
const ACQUIRE_TIMEOUT_MILLIS = 30000;
const MAX_USES_PER_BROWSER = 50;

interface BrowserInstance {
  browser: any;
  useCount: number;
}

const browserPool = GenericPool.createPool<BrowserInstance>({
  create: async function (): Promise<BrowserInstance> {
    console.log('Creating new browser instance');
    const browser = await puppeteer.launch({
      args: [
        ...(process.env.NODE_ENV === "production" ? chromium.args : []),
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--no-first-run",
        "--no-sandbox",
        "--disable-web-security",
        "--ignore-certificate-errors",
        "--disable-font-subpixel-positioning",
        "--font-render-hinting=none",
      ],
      defaultViewport: chromium.defaultViewport,
      executablePath: process.env.CHROME_PATH,
      headless: true,
      ignoreHTTPSErrors: true,
    });

    return {
      browser,
      useCount: 0
    };
  },

  destroy: async function (instance: BrowserInstance): Promise<void> {
    console.log(`Destroying browser instance after ${instance.useCount} uses`);
    await instance.browser.close();
  },

  validate: async function (instance: BrowserInstance): Promise<boolean> {
    const isValid = instance.browser !== null && !instance.browser.disconnected &&
      instance.useCount < MAX_USES_PER_BROWSER;

    if (!isValid) {
      console.log(`Browser instance invalid: useCount=${instance.useCount}, disconnected=${instance.browser?.disconnected}`);
    }

    return Promise.resolve(isValid);
  }
}, {
  max: POOL_MAX,
  min: POOL_MIN,
  acquireTimeoutMillis: ACQUIRE_TIMEOUT_MILLIS,
  testOnBorrow: true,
  autostart: true,
});

// Graceful shutdown
if (typeof process !== 'undefined') {
  const cleanup = async () => {
    console.log('Draining browser pool...');
    await browserPool.drain();
    await browserPool.clear();
    console.log('Browser pool drained and cleared');
  };

  process.on('SIGINT', async () => {
    await cleanup();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await cleanup();
    process.exit(0);
  });
}

async function getBrowserFromPool(): Promise<BrowserInstance> {
  const instance = await browserPool.acquire();
  instance.useCount++;
  console.log('Browser instance acquired from pool. Current use count:', instance.useCount);
  return instance;
}

async function releaseBrowserToPool(instance: BrowserInstance) {
  if (instance && instance.browser) {
    await browserPool.release(instance);
    console.log(`Browser released back to pool, useCount=${instance.useCount}`);
  }
}


export const maxDuration = 60;

// Generate MD5 hash from markdown content
function generateMD5(content: string): string {
  return crypto.createHash('md5').update(content).digest('hex');
}

// Check if cached image exists and return it
async function getCachedImage(hash: string): Promise<Buffer | null> {
  const saveDir = path.join(process.cwd(), "public", "uploads", "posters");
  const savePath = path.join(saveDir, `${hash}.png`);

  if (fs.existsSync(savePath)) {
    return fs.readFileSync(savePath);
  }
  return null;
}

// Save image to cache
async function saveImageToCache(hash: string, imageBuffer: Buffer): Promise<void> {
  const saveDir = path.join(process.cwd(), "public", "uploads", "posters");
  const savePath = path.join(saveDir, `${hash}.png`);

  // Ensure directory exists
  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
  }

  fs.writeFileSync(savePath, imageBuffer);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "只支持 POST 请求" });
  }

  // Check for shangan token in headers
  const token = req.headers["shangan"];
  const expectedToken = "12fa2d9f-86f0-4125-b8b0-f2fbf3a14f6c";

  if (!token || token !== expectedToken) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token" });
  }

  const { markdown, header = "", footer = "", theme = "SpringGradientWave" } = req.body;

  console.log("markdown==========>\\n", markdown);
  console.log("theme============>\\n", theme);

  // Generate MD5 hash from all content that affects the poster
  const fullContent = JSON.stringify({ markdown, header, footer, theme });
  const contentHash = generateMD5(fullContent);

  // Check if cached image exists
  const cachedImage = await getCachedImage(contentHash);
  if (cachedImage) {
    console.log(`Cache hit for content hash: ${contentHash}`);
    const base64Image = cachedImage.toString('base64');
    return res.status(200).json({
      base64: `data:image/png;base64,${base64Image}`,
      source: 'cache',
      hash: contentHash
    });
  }

  console.log(`Cache miss for content hash: ${contentHash}, generating new image`);

  let browserInstance: BrowserInstance | null = null;
  let page: any | null = null;
  try {
    // 修改字体加载部分, windows下不需要开启，linux服务器下需要开启
    // try {
    //   await chromium.font(path.join(process.cwd(), 'public', 'fonts', 'SimSun.ttf'));
    // } catch (error: any) {
    //   if (error.code !== 'EEXIST') {
    //     throw error;
    //   }
    // }

    browserInstance = await getBrowserFromPool();
    const browser = browserInstance.browser;

    page = await browser.newPage();

    // 设置字体和编码
    await page.setExtraHTTPHeaders({
      "Accept-Language": "zh-CN,zh;q=0.9",
    });

    await page.evaluateOnNewDocument(() => {
      document.documentElement.lang = "zh-CN";
      const meta = document.createElement("meta");
      meta.setAttribute("charset", "UTF-8");
      document.head.insertBefore(meta, document.head.firstChild);
    });

    // 修改字体注入方式
    await page.evaluateOnNewDocument(() => {
      const style = document.createElement("style");
      style.textContent = `
        @font-face {
          font-family: 'Noto Sans SC';
          font-style: normal;
          font-weight: 400;
          src: url('https://fonts.gstatic.com/s/notosanssc/v36/k3kXo84MPvpLmixcA63oeALhLOCT-xWNm8Hqd37g1OkDRZe7lR4sg1IzSy-MNbE9VH8V.103.woff2') format('woff2');
          unicode-range: U+4E00-9FFF;
        }
        * {
         font-family: 'SimSun', sans-serif !important;
        }
        body {
         font-family: 'SimSun' !important;
        }
      `;
      document.head.appendChild(style);
    });

    // 设置视口大小
    await page.setViewport({ width: 1200, height: 1600 });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `/poster?content=${encodeURIComponent(
      markdown
    )}&header=${encodeURIComponent(header)}&footer=${encodeURIComponent(
      footer
    )}&theme=${encodeURIComponent(theme)}`;
    const fullUrl = `${baseUrl}${url}`;
    // console.log("fullUrl==========>", fullUrl);

    // 设置页面编码和等待时间
    await page.goto(fullUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // 在截图前确保字体已加载
    await page.waitForFunction(() => document.fonts.ready);
    await new Promise((resolve) => setTimeout(resolve, 1000)); // 额外等待以确保字体完全加载

    // 等待海报元素渲染完成
    await page.waitForSelector(".poster-content", { timeout: 15000 });

    // 获取元素
    const element = await page.$(".poster-content");

    if (!element) {
      throw new Error("Poster element not found");
    }

    // 获取元素的边界框
    const box = await element.boundingBox();
    if (!box) {
      throw new Error("Could not get element bounds");
    }

    // 直接获取格式的截图
    const posterBuffer = await page.screenshot({
      clip: {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      },
      type: "png",
      omitBackground: false,
    });

    // Save image to cache
    await saveImageToCache(contentHash, posterBuffer);

    // Convert buffer to base64 and return as JSON
    let actualBufferForResponse: Buffer;
    if (Buffer.isBuffer(posterBuffer)) {
      actualBufferForResponse = posterBuffer;
    } else {
      // Handles Uint8Array, Array<number>, or other array-like structures
      // that Buffer.from() can process.
      actualBufferForResponse = Buffer.from(posterBuffer as any);
    }
    const base64Image = actualBufferForResponse.toString('base64');

    res.status(200).json({
      base64: `data:image/png;base64,${base64Image}`,
      source: 'generated',
      hash: contentHash
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to generate poster" });
  } finally {
    if (page && !page.isClosed()) {
      try {
        await page.close();
      } catch (e) {
        console.error("Error closing page in finally block:", e);
      }
    }
    if (browserInstance) {
      await releaseBrowserToPool(browserInstance);
    }
  }
}
