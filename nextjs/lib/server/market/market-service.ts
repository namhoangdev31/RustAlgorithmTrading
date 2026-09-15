import { MarketSnapshot } from "../quant/types";

export interface DailyMarketMetrics {
  refDate: string;
  refPrice: number;        
  atr5d: number;           
  swingLow5d: number;      
  swingHigh5d: number;     
  ema5: number;            
  ema10: number;           
  isFallback?: boolean;    
}

export interface IntradayBar {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface Raw1mData {
  t: number[];
  o: number[];
  h: number[];
  l: number[];
  c: number[];
  v: number[];
  fetchedAt: number;
}

let cachedSnapshot: MarketSnapshot | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 5000; 

let cachedDailyMetrics: DailyMarketMetrics | null = null;
let lastDailyFetchTime = 0;
const DAILY_CACHE_TTL_MS = 60000; 

let cachedRaw1m: Raw1mData | null = null;
let lastRaw1mFetch = 0;
const RAW_1M_TTL_MS = 5000;

function vnDateFromEpochSec(epochSec: number): string {
  return new Date((epochSec + 7 * 3600) * 1000).toISOString().slice(0, 10);
}

function vnTodayStr(nowMs: number): string {
  return new Date(nowMs + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

function vnTimeFromEpochSec(epochSec: number): string {
  return new Date((epochSec + 7 * 3600) * 1000).toISOString().slice(11, 19);
}

async function fetchRaw1mData(force = false): Promise<Raw1mData | null> {
  const now = Date.now();
  if (!force && cachedRaw1m && now - lastRaw1mFetch < RAW_1M_TTL_MS) {
    return cachedRaw1m;
  }

  try {
    const nowSec = Math.floor(now / 1000);
    const fromSec = nowSec - 86400 * 2; 
    const res = await fetch(
      `https://services.entrade.com.vn/chart-api/chart?resolution=1&symbol=VN30F1M&from=${fromSec}&to=${nowSec}`,
      {
        headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0" },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.c) && data.c.length > 0) {
        const raw: Raw1mData = {
          t: data.t,
          o: data.o,
          h: data.h,
          l: data.l,
          c: data.c,
          v: data.v ?? [],
          fetchedAt: now,
        };
        cachedRaw1m = raw;
        lastRaw1mFetch = now;
        return raw;
      }
    }
  } catch (err) {
    console.warn("[market] Lỗi lấy nến 1m từ Entrade:", (err as Error)?.message);
  }
  return cachedRaw1m; // stale cache (có thể null)
}

/**
 * Chuỗi nến 1m CHỈ thuộc phiên hôm nay (giờ VN), dùng để replay execution.
 * Trả [] nếu chưa có nến hôm nay (ngoài giờ / mạng lỗi) — caller tự xử lý.
 */
export async function getIntradayBars(force = false): Promise<IntradayBar[]> {
  const raw = await fetchRaw1mData(force);
  if (!raw) {
    console.warn("[market] getIntradayBars: không có dữ liệu nến 1m (mạng lỗi hoặc ngoài phiên)");
    return [];
  }
  const todayStr = vnTodayStr(raw.fetchedAt);
  const bars: IntradayBar[] = [];
  for (let i = 0; i < raw.t.length; i++) {
    if (vnDateFromEpochSec(raw.t[i]) !== todayStr) continue;
    bars.push({
      time: vnTimeFromEpochSec(raw.t[i]),
      open: Number(raw.o[i]),
      high: Number(raw.h[i]),
      low: Number(raw.l[i]),
      close: Number(raw.c[i]),
    });
  }
  return bars;
}

/** Snapshot có phải dữ liệu dự phòng hardcode (không phải giá thật từ sàn) hay không */
export function isSnapshotFallback(s: MarketSnapshot | null | undefined): boolean {
  return s?.source === "FALLBACK_LIVE_ESTIMATE";
}

/**
 * Tính toán các tham số thị trường định lượng từ chuỗi nến ngày thật của sàn
 */
export async function getDailyMarketMetrics(force = false): Promise<DailyMarketMetrics> {
  const now = Date.now();
  if (!force && cachedDailyMetrics && now - lastDailyFetchTime < DAILY_CACHE_TTL_MS) {
    return cachedDailyMetrics;
  }

  try {
    const nowSec = Math.floor(now / 1000);
    const fromSec = nowSec - 86400 * 45; // 45 ngày để đủ dữ liệu EMA10 & ATR5

    const res = await fetch(
      `https:
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "Mozilla/5.0",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      }
    );

    if (res.ok) {
      const d = await res.json();
      if (d && Array.isArray(d.c) && d.c.length >= 10) {
        const len = d.t.length;
        const todayStr = new Date(now + 7 * 3600 * 1000).toISOString().slice(0, 10);
        const lastBarDate = new Date((d.t[len - 1] + 7 * 3600) * 1000).toISOString().slice(0, 10);

        const prevIdx = lastBarDate === todayStr ? len - 2 : len - 1;
        const refDate = new Date((d.t[prevIdx] + 7 * 3600) * 1000).toISOString().slice(0, 10);
        const refPrice = Number(d.c[prevIdx]);

        let trSum = 0;
        const lows: number[] = [];
        const highs: number[] = [];
        for (let i = prevIdx - 4; i <= prevIdx; i++) {
          const h = Number(d.h[i]);
          const l = Number(d.l[i]);
          const prevC = Number(d.c[i - 1]);
          const tr = Math.max(h - l, Math.abs(h - prevC), Math.abs(l - prevC));
          trSum += tr;
          lows.push(l);
          highs.push(h);
        }
        const atr5d = Number((trSum / 5).toFixed(1));
        const swingLow5d = Math.min(...lows);
        const swingHigh5d = Math.max(...highs);

        function calcEMA(arr: number[], period: number) {
          const k = 2 / (period + 1);
          let ema = arr[0];
          for (let i = 1; i < arr.length; i++) {
            ema = arr[i] * k + ema * (1 - k);
          }
          return ema;
        }

        const closesUpToPrev = d.c.slice(0, prevIdx + 1).map(Number);
        const ema5 = Number(calcEMA(closesUpToPrev, 5).toFixed(1));
        const ema10 = Number(calcEMA(closesUpToPrev, 10).toFixed(1));

        const metrics: DailyMarketMetrics = {
          refDate,
          refPrice,
          atr5d,
          swingLow5d,
          swingHigh5d,
          ema5,
          ema10,
          isFallback: false,
        };

        cachedDailyMetrics = metrics;
        lastDailyFetchTime = now;
        return metrics;
      }
    }
  } catch (err) {
    console.warn("[market] Lỗi lấy DailyMarketMetrics từ sàn:", (err as Error)?.message);
  }

  const reusedCache = cachedDailyMetrics;
  const fallbackMetrics: DailyMarketMetrics = reusedCache
    ? { ...reusedCache, isFallback: true }
    : {
        refDate: "2026-09-11",
        refPrice: 1940.0,
        atr5d: 26.4,
        swingLow5d: 1940.0,
        swingHigh5d: 1995.6,
        ema5: 1968.8,
        ema10: 1961.0,
        isFallback: true,
      };
  if (!reusedCache) {
    console.warn(
      "[market] DailyMarketMetrics dùng số liệu dự phòng hardcode (mạng lỗi, không có cache) — kèo có thể lệch thực tế"
    );
  } else {
    console.warn("[market] DailyMarketMetrics tái dùng cache cũ (mạng lỗi) — freshness AMBER");
  }
  cachedDailyMetrics = fallbackMetrics;
  lastDailyFetchTime = now;
  return fallbackMetrics;
}

export async function getLatestMarketSnapshot(force = false): Promise<MarketSnapshot> {
  const now = Date.now();
  if (!force && cachedSnapshot && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedSnapshot;
  }

  try {
    
    const raw = await fetchRaw1mData(force);

    if (raw && raw.c.length > 0) {
      const todayStr = vnTodayStr(raw.fetchedAt);

      const todayIndices: number[] = [];
      for (let i = 0; i < raw.t.length; i++) {
        if (vnDateFromEpochSec(raw.t[i]) === todayStr) {
          todayIndices.push(i);
        }
      }

      let open: number;
      let high: number;
      let low: number;
      let current: number;
      let volume: number;
      let lastTimestamp: string;

      if (todayIndices.length > 0) {
        open = Number(raw.o[todayIndices[0]]);
        high = Math.max(...todayIndices.map((i) => Number(raw.h[i])));
        low = Math.min(...todayIndices.map((i) => Number(raw.l[i])));
        current = Number(raw.c[todayIndices[todayIndices.length - 1]]);
        volume = todayIndices.reduce((s, i) => s + Number(raw.v?.[i] || 0), 0);
        lastTimestamp = new Date(raw.t[todayIndices[todayIndices.length - 1]] * 1000).toISOString();
      } else {
        
        const lastIdx = raw.c.length - 1;
        current = Number(raw.c[lastIdx]);
        open = current;
        high = current;
        low = current;
        volume = 0;
        lastTimestamp = new Date(raw.t[lastIdx] * 1000).toISOString();
      }

      let basis = -0.5;
      let oi = 30378.0;

      try {
        const nowSec = Math.floor(raw.fetchedAt / 1000);
        const [vn30Res, oiRes] = await Promise.allSettled([
          fetch(
            `https://dchart-api.vndirect.com.vn/dchart/history?resolution=1&symbol=VN30&from=${nowSec - 600}&to=${nowSec}`,
            {
              headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
              cache: "no-store",
              signal: AbortSignal.timeout(3000),
            }
          ),
          fetch(
            `https:
            {
              headers: { "User-Agent": "Mozilla/5.0" },
              cache: "no-store",
              signal: AbortSignal.timeout(3000),
            }
          ),
        ]);

        if (vn30Res.status === "fulfilled" && vn30Res.value.ok) {
          const vn30Data = await vn30Res.value.json();
          if (vn30Data?.c?.length > 0) {
            const latestVn30 = Number(vn30Data.c[vn30Data.c.length - 1]);
            basis = Number((current - latestVn30).toFixed(1));
          }
        }

        if (oiRes.status === "fulfilled" && oiRes.value.ok) {
          const oiData = await oiRes.value.json();
          if (oiData?.data?.[0]?.openInterest) {
            oi = Number(oiData.data[0].openInterest);
          }
        }
      } catch {
        
      }

      const snapshot: MarketSnapshot = {
        open,
        high,
        low,
        current,
        volume,
        oi,
        basis,
        foreignBuy: 0,
        foreignSell: 0,
        foreignNet: 0,
        timestamp: lastTimestamp,
        source: "https://services.entrade.com.vn/chart-api/chart?symbol=VN30F1M",
      };

      cachedSnapshot = snapshot;
      lastFetchTime = now;
      return snapshot;
    }
  } catch (error) {
    console.warn("[market] Lỗi dựng snapshot từ nến 1m:", (error as Error)?.message);
  }

  const reused = cachedSnapshot;
  const fallbackSnapshot: MarketSnapshot = reused || {
    open: 1936.0,
    high: 1944.7,
    low: 1931.2,
    current: 1936.7,
    volume: 91594.0,
    oi: 30378.0,
    basis: -0.5,
    foreignBuy: 0,
    foreignSell: 0,
    foreignNet: 0,
    timestamp: new Date().toISOString(),
    source: "FALLBACK_LIVE_ESTIMATE",
  };
  console.warn(
    reused
      ? "[market] Snapshot tái dùng cache cũ (mạng lỗi / ngoài phiên)"
      : "[market] Snapshot dùng số liệu dự phòng hardcode — giá có thể lệch thực tế"
  );

  cachedSnapshot = fallbackSnapshot;
  lastFetchTime = now;
  return fallbackSnapshot;
}
