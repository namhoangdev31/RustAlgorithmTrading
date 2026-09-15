"use client";

import { useEffect, useRef, useState } from "react";

export interface VpsTickData {
  symbol: string;
  price: number;
  change?: number;
  volume?: number;
  time: number; 
}

export interface UseVpsTicksOptions {
  symbol?: string;
  enabled?: boolean;
  onTick?: (tick: VpsTickData) => void;
}

export interface UseVpsTicksReturn {
  isConnected: boolean;
  lastTick: VpsTickData | null;
  error: string | null;
}

export function useVpsTicks(options: UseVpsTicksOptions = {}): UseVpsTicksReturn {
  const { symbol = "VN30F1M", enabled = true, onTick } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [lastTick, setLastTick] = useState<VpsTickData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onTickRef = useRef(onTick);
  onTickRef.current = onTick;

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled || typeof window === "undefined") {
      return;
    }

    const connect = () => {
      
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {}
        socketRef.current = null;
      }

      try {
        const wsUrl = "wss://bgapidatafeed.vps.com.vn/socket.io/?EIO=3&transport=websocket";
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          reconnectAttemptsRef.current = 0;
          setError(null);
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          const msg = typeof event.data === "string" ? event.data : "";

          if (msg.startsWith("0")) {
            ws.send("2probe");
          } else if (msg === "3probe") {
            ws.send("5");
            ws.send("40"); 
          } else if (msg.startsWith("40")) {
            
            setIsConnected(true);
            try {
              ws.send(`42["join","${symbol}"]`);
              ws.send('42["join","derivative"]');
              ws.send('42["join","VN30F1M"]');
            } catch (err) {
              console.warn("[VPS-WS] Gửi lệnh join thất bại:", err);
            }
          } else if (msg === "2") {
            
            try {
              ws.send("3");
            } catch {}
          } else if (msg.startsWith("42")) {
            
            try {
              const payloadStr = msg.slice(2);
              const payload = JSON.parse(payloadStr);
              const eventName = payload[0];
              const eventBody = payload[1];

              let extractedPrice: number | null = null;
              let extractedChange: number | undefined = undefined;
              let extractedVol: number | undefined = undefined;
              let epochSec = Math.floor(Date.now() / 1000);

              if (eventName === "stockps" && eventBody?.data) {
                const d = eventBody.data;
                if (typeof d.index === "number" && d.index > 0) {
                  extractedPrice = d.index;
                } else if (typeof d.lastPrice === "number" && d.lastPrice > 0) {
                  extractedPrice = d.lastPrice;
                }
                extractedChange = typeof d.change === "number" ? d.change : undefined;

                if (typeof d.date === "string") {
                  
                  const parts = d.date.split(" ");
                  if (parts.length === 2) {
                    const [day, month, year] = parts[0].split("/").map(Number);
                    const [hour, min, sec] = parts[1].split(":").map(Number);
                    if (year && month && day) {
                      const dt = new Date(year, month - 1, day, hour, min, sec);
                      epochSec = Math.floor(dt.getTime() / 1000);
                    }
                  }
                }
              } else if (eventName === "stock" || eventName === "derivative") {
                
                const d = eventBody?.data || eventBody;
                if (typeof d?.lastPrice === "number") extractedPrice = d.lastPrice;
                else if (typeof d?.price === "number") extractedPrice = d.price;
                if (typeof d?.vol === "number") extractedVol = d.vol;
              }

              if (extractedPrice !== null && !isNaN(extractedPrice)) {
                const tick: VpsTickData = {
                  symbol,
                  price: extractedPrice,
                  change: extractedChange,
                  volume: extractedVol,
                  time: epochSec,
                };

                setLastTick(tick);
                if (onTickRef.current) {
                  onTickRef.current(tick);
                }
              }
            } catch {
              
            }
          }
        };

        ws.onerror = () => {
          if (!isMountedRef.current) return;
          setError("Lỗi kết nối WebSocket Bảng giá");
        };

        ws.onclose = () => {
          if (!isMountedRef.current) return;
          setIsConnected(false);

          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttemptsRef.current), 10000);
          reconnectAttemptsRef.current += 1;

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current && enabled) {
              connect();
            }
          }, delay);
        };
      } catch (err: any) {
        if (!isMountedRef.current) return;
        setError(err?.message || "Không thể khởi tạo WebSocket");
      }
    };

    connect();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch {}
        socketRef.current = null;
      }
    };
  }, [symbol, enabled]);

  return { isConnected, lastTick, error };
}
