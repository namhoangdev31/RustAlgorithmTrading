"use client";

import React, { useState, useEffect, useRef } from "react";
import { MarketSnapshot, TradingPlan } from "@/lib/server/quant/types";
import {
  calculatePositionMetrics,
  evaluatePositionWarnings,
  calculateRealizedPnL,
  MarginTier,
} from "@/lib/server/quant/user-position-math";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
  Zap,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface UserPositionTrackerProps {
  snapshot?: MarketSnapshot | null;
  plan?: TradingPlan | null;
}

interface TrackedPosition {
  side: "LONG" | "SHORT";
  matchedPrice: number;
  matchedVolume: number;
  marginRate: MarginTier;
  status: "ACTIVE" | "CLOSED";
  createdAt: string;
}

interface ClosedResult {
  side: "LONG" | "SHORT";
  matchedPrice: number;
  exitPrice: number;
  volume: number;
  pnlPoints: number;
  pnlMoney: number;
  roiPercent: number;
  closedAt: string;
}

const LOCAL_STORAGE_KEY = "lepos_user_tracked_position";

export const UserPositionTracker: React.FC<UserPositionTrackerProps> = ({
  snapshot,
  plan,
}) => {
  const [position, setPosition] = useState<TrackedPosition | null>(null);

  // Form input state
  const [inputSide, setInputSide] = useState<"LONG" | "SHORT">("LONG");
  const [inputPrice, setInputPrice] = useState<string>("");
  const [inputVolume, setInputVolume] = useState<string>("1");
  const [inputMargin, setInputMargin] = useState<MarginTier>(0.18);

  // Close position modal & result state
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [exitPriceInput, setExitPriceInput] = useState<string>("");
  const [closedResult, setClosedResult] = useState<ClosedResult | null>(null);

  // PWA Notification permission state
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(false);
  const lastNotifiedKeyRef = useRef<string | null>(null);

  // 1. Register PWA Service Worker on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Service Worker registered successfully
        })
        .catch(() => {
          // SW registration ignored in non-supported environments
        });

      if ("Notification" in window) {
        setHasNotificationPermission(Notification.permission === "granted");
      }
    }
  }, []);

  // 2. Load position from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.status === "ACTIVE") {
          setPosition(parsed);
        }
      }
    } catch (e) {
      // Ignore parse errors
    }
  }, []);

  // 3. Set default input price from live market snapshot
  useEffect(() => {
    if (!inputPrice && snapshot?.current) {
      setInputPrice(snapshot.current.toFixed(1));
    }
  }, [snapshot?.current, inputPrice]);

  // Request PWA / Desktop Notification permission
  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        setHasNotificationPermission(permission === "granted");
        if (permission === "granted") {
          toast.success("Đã kích hoạt thông báo PWA & Desktop!", {
            description: "Hệ thống sẽ gửi cảnh báo ngay cả khi bạn chuyển tab hoặc khóa màn hình điện thoại.",
          });
        }
      } catch (e) {
        // Fallback for older browsers
      }
    }
  };

  // Dispatch Notification (Toast + PWA Service Worker showNotification + Fallback Notification)
  const dispatchAlertNotification = async (
    title: string,
    body: string,
    type: "warning" | "error" | "success" | "info"
  ) => {
    // A. In-app interactive Toast
    if (type === "error") {
      toast.error(title, { description: body, duration: 6000 });
    } else if (type === "warning") {
      toast.warning(title, { description: body, duration: 6000 });
    } else {
      toast.success(title, { description: body, duration: 6000 });
    }

    // B. PWA Service Worker Push / System Notification (Required for iOS PWA & Android lockscreen)
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        if ("serviceWorker" in navigator) {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            await reg.showNotification(title, {
              body,
              icon: "/logo_nonbg.png",
              badge: "/logo_nonbg.png",
              tag: "lepos-position-alert",
              renotify: true,
              data: { url: "/bot" },
            } as NotificationOptions);
            return;
          }
        }
        // Fallback to Window Notification API if SW not available
        new Notification(title, {
          body,
          icon: "/logo_nonbg.png",
        });
      } catch (err) {
        // Fallback gracefully
      }
    }
  };

  // Handle position tracking submission
  const handleSavePosition = (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(inputPrice);
    const volume = parseInt(inputVolume, 10);

    if (isNaN(price) || price <= 0) {
      toast.error("Giá khớp không hợp lệ!", { description: "Vui lòng nhập giá khớp > 0" });
      return;
    }
    if (isNaN(volume) || volume <= 0) {
      toast.error("Khối lượng không hợp lệ!", { description: "Vui lòng nhập số hợp đồng > 0" });
      return;
    }

    const newPos: TrackedPosition = {
      side: inputSide,
      matchedPrice: price,
      matchedVolume: volume,
      marginRate: inputMargin,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
    };

    setPosition(newPos);
    setClosedResult(null);
    lastNotifiedKeyRef.current = null;

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newPos));
    } catch (e) {}

    requestNotificationPermission();
    toast.success("Đã kích hoạt theo dõi vị thế!", {
      description: `${inputSide} ${volume} HD tại giá ${price.toFixed(1)} (Ký quỹ ${(inputMargin * 100).toFixed(0)}%)`,
    });
  };

  // Handle position reset / clear
  const handleClearPosition = () => {
    setPosition(null);
    setClosedResult(null);
    lastNotifiedKeyRef.current = null;
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}
    toast.info("Đã xóa dữ liệu theo dõi lệnh.");
  };

  // Open Close Modal
  const handleOpenCloseModal = () => {
    if (snapshot?.current) {
      setExitPriceInput(snapshot.current.toFixed(1));
    } else if (position) {
      setExitPriceInput(position.matchedPrice.toFixed(1));
    }
    setIsCloseModalOpen(true);
  };

  // Confirm Close Position
  const handleConfirmClose = () => {
    if (!position) return;
    const exitPrice = parseFloat(exitPriceInput);
    if (isNaN(exitPrice) || exitPrice <= 0) {
      toast.error("Giá đóng vị thế không hợp lệ!");
      return;
    }

    const calc = calculateRealizedPnL(
      position.side,
      position.matchedPrice,
      exitPrice,
      position.matchedVolume,
      position.marginRate
    );

    const result: ClosedResult = {
      side: position.side,
      matchedPrice: position.matchedPrice,
      exitPrice,
      volume: position.matchedVolume,
      pnlPoints: calc.pnlPoints,
      pnlMoney: calc.pnlMoney,
      roiPercent: calc.roiPercent,
      closedAt: new Date().toLocaleTimeString("vi-VN"),
    };

    setClosedResult(result);
    setPosition(null);
    setIsCloseModalOpen(false);
    lastNotifiedKeyRef.current = null;

    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}

    const title = calc.isProfit ? "🎉 ĐÃ ĐÓNG VỊ THẾ LỜI!" : "🔴 ĐÃ ĐÓNG VỊ THẾ LỖ!";
    const body = `${position.side} ${position.matchedVolume} HD: ${calc.isProfit ? "+" : ""}${calc.pnlPoints.toFixed(1)} điểm (${calc.isProfit ? "+" : ""}${calc.pnlMoney.toLocaleString("vi-VN")} VNĐ)`;

    dispatchAlertNotification(title, body, calc.isProfit ? "success" : "error");
  };

  // Real-time calculations
  const livePrice = snapshot?.current;
  const isPositionActive = position && position.status === "ACTIVE";

  const metrics = isPositionActive && livePrice
    ? calculatePositionMetrics({
        side: position.side,
        matchedPrice: position.matchedPrice,
        matchedVolume: position.matchedVolume,
        marginRate: position.marginRate,
        currentPrice: livePrice,
      })
    : { pnlPoints: 0, pnlMoney: 0, requiredMargin: 0, roiPercent: 0, isProfit: true };

  // Smart Warnings vs System Plan
  const warnings = isPositionActive && livePrice && plan
    ? evaluatePositionWarnings({
        positionSide: position.side,
        matchedPrice: position.matchedPrice,
        currentPrice: livePrice,
        planSide: plan.side as "LONG" | "SHORT",
        planEntry: plan.entryPrice,
        planTp: plan.tpPrice,
        planSl: plan.slPrice,
      })
    : [];

  // Automated notification dispatch on warning trigger (deduplicated by warning code + price level)
  useEffect(() => {
    if (!isPositionActive || !livePrice || !warnings.length) return;

    const topWarning = warnings[0];
    const notifyKey = `${topWarning.code}-${Math.floor(livePrice)}`;
    if (lastNotifiedKeyRef.current === notifyKey) return;

    lastNotifiedKeyRef.current = notifyKey;
    dispatchAlertNotification(topWarning.title, topWarning.message, topWarning.type);
  }, [livePrice, isPositionActive, warnings]);

  return (
    <div className="rounded-lg border border-sky-500/20 bg-gradient-to-b from-[#0e1626]/90 to-[#0b0f17]/90 p-3.5 shadow-xl backdrop-blur-md">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/20 text-sky-400">
            <Zap className="h-3.5 w-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-100 flex items-center gap-1.5">
              THEO DÕI LỆNH KHỚP THỰC TẾ
              <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-300">LIVE</span>
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* PWA Notification Permission Toggle */}
          {!hasNotificationPermission && (
            <button
              type="button"
              onClick={requestNotificationPermission}
              className="flex items-center gap-1 rounded bg-amber-500/20 hover:bg-amber-500/30 px-2 py-0.5 text-[9px] font-bold text-amber-300 transition-all cursor-pointer"
              title="Bật thông báo PWA / Desktop"
            >
              <Smartphone className="h-3 w-3" />
              <span>Bật Push PWA</span>
            </button>
          )}

          {isPositionActive && (
            <button
              onClick={handleClearPosition}
              className="text-[10px] font-semibold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              Bỏ theo dõi
            </button>
          )}
        </div>
      </div>

      {/* Closed position result banner */}
      {closedResult && (
        <div className={`mb-3 rounded-lg border p-3 ${closedResult.pnlMoney >= 0 ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-200" : "border-rose-500/40 bg-rose-950/40 text-rose-200"}`}>
          <div className="flex items-center justify-between font-bold text-xs">
            <span className="flex items-center gap-1.5">
              {closedResult.pnlMoney >= 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-rose-400" />}
              KẾT QUẢ VỪA ĐÓNG LỆNH ({closedResult.closedAt})
            </span>
            <span className="font-mono text-[11px] uppercase">{closedResult.side} {closedResult.volume} HD</span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center font-mono">
            <div className="rounded bg-black/30 p-1.5">
              <div className="text-[9px] text-slate-400 font-sans">Khớp → Đóng</div>
              <div className="text-[11px] font-bold text-slate-200">{closedResult.matchedPrice.toFixed(1)} → {closedResult.exitPrice.toFixed(1)}</div>
            </div>
            <div className="rounded bg-black/30 p-1.5">
              <div className="text-[9px] text-slate-400 font-sans">Số điểm PnL</div>
              <div className={`text-[11px] font-bold ${closedResult.pnlPoints >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {closedResult.pnlPoints >= 0 ? "+" : ""}{closedResult.pnlPoints.toFixed(1)}đ
              </div>
            </div>
            <div className="rounded bg-black/30 p-1.5">
              <div className="text-[9px] text-slate-400 font-sans">Lời / Lỗ Thực Tế</div>
              <div className={`text-[11px] font-bold ${closedResult.pnlMoney >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {closedResult.pnlMoney >= 0 ? "+" : ""}{closedResult.pnlMoney.toLocaleString("vi-VN")}đ
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Position Dashboard or Entry Form */}
      {isPositionActive ? (
        <div className="space-y-3">
          {/* Main Active Position Metric Card */}
          <div className={`relative overflow-hidden rounded-lg border p-3 transition-all ${position.side === "SHORT" ? "border-rose-500/30 bg-rose-950/20" : "border-emerald-500/30 bg-emerald-950/20"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`rounded-md px-2 py-0.5 font-mono text-xs font-black uppercase tracking-wider ${position.side === "SHORT" ? "bg-rose-500/30 text-rose-300" : "bg-emerald-500/30 text-emerald-300"}`}>
                  {position.side} {position.matchedVolume} HD
                </span>
                <span className="text-[11px] font-semibold text-slate-300">
                  Giá khớp: <span className="font-mono text-white font-bold">{position.matchedPrice.toFixed(1)}</span>
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-medium">Ký quỹ ({(position.marginRate * 100).toFixed(0)}%)</span>
                <span className="font-mono text-xs font-bold text-slate-200">
                  {metrics.requiredMargin.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            {/* Live PnL Highlight */}
            <div className="mt-2.5 pt-2.5 border-t border-white/10 grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Số điểm PnL (Realtime)</span>
                <div className={`text-base font-black font-mono flex items-center gap-1 ${metrics.pnlPoints >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {metrics.pnlPoints >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {metrics.pnlPoints >= 0 ? "+" : ""}{metrics.pnlPoints.toFixed(1)} điểm
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-medium block">Tiền PnL (VNĐ)</span>
                <div className={`text-base font-black font-mono ${metrics.pnlMoney >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {metrics.pnlMoney >= 0 ? "+" : ""}{metrics.pnlMoney.toLocaleString("vi-VN")}đ
                  <span className="text-[10px] font-semibold ml-1 opacity-80">({metrics.roiPercent >= 0 ? "+" : ""}{metrics.roiPercent.toFixed(1)}%)</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleOpenCloseModal}
                className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 px-3 py-1.5 text-xs font-bold text-white shadow-md transition-all cursor-pointer active:scale-95"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>ĐÓNG LỆNH NGAY</span>
              </button>
            </div>
          </div>

          {/* Smart Warning Alerts vs System Signal */}
          {warnings.length > 0 && (
            <div className="space-y-1.5">
              {warnings.map((w, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 rounded-md border p-2.5 text-[11px] font-medium leading-relaxed ${
                    w.type === "error"
                      ? "border-rose-500/50 bg-rose-950/40 text-rose-200"
                      : w.type === "warning"
                      ? "border-amber-500/50 bg-amber-950/40 text-amber-200"
                      : "border-sky-500/50 bg-sky-950/40 text-sky-200"
                  }`}
                >
                  <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${w.type === "error" ? "text-rose-400 animate-pulse" : w.type === "warning" ? "text-amber-400" : "text-sky-400"}`} />
                  <div>
                    <span className="font-bold block text-[11px] mb-0.5">{w.title}</span>
                    <span>{w.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Form input to track new matched order */
        <form onSubmit={handleSavePosition} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {/* Side selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1">Vị thế khớp</label>
              <div className="grid grid-cols-2 gap-1 rounded-md bg-black/40 p-1 border border-white/10">
                <button
                  type="button"
                  onClick={() => setInputSide("LONG")}
                  className={`rounded py-1 text-xs font-black uppercase transition-all cursor-pointer ${
                    inputSide === "LONG"
                      ? "bg-emerald-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  LONG
                </button>
                <button
                  type="button"
                  onClick={() => setInputSide("SHORT")}
                  className={`rounded py-1 text-xs font-black uppercase transition-all cursor-pointer ${
                    inputSide === "SHORT"
                      ? "bg-rose-500 text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  SHORT
                </button>
              </div>
            </div>

            {/* Matched volume */}
            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1">KL khớp (HD)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={inputVolume}
                onChange={(e) => setInputVolume(e.target.value)}
                placeholder="1"
                className="w-full rounded-md border border-white/10 bg-black/50 px-2.5 py-1 text-xs font-bold font-mono text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Matched price */}
            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1">Giá khớp trên sàn</label>
              <input
                type="number"
                step="0.1"
                value={inputPrice}
                onChange={(e) => setInputPrice(e.target.value)}
                placeholder="Ví dụ: 1285.5"
                className="w-full rounded-md border border-white/10 bg-black/50 px-2.5 py-1 text-xs font-bold font-mono text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
              />
            </div>

            {/* Margin Rate Tiers */}
            <div>
              <label className="text-[10px] font-bold text-slate-300 uppercase block mb-1">Tỷ lệ ký quỹ</label>
              <div className="grid grid-cols-3 gap-1">
                {([0.03, 0.05, 0.18] as const).map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setInputMargin(rate)}
                    className={`rounded border py-1 text-[10px] font-bold transition-all cursor-pointer ${
                      inputMargin === rate
                        ? "border-sky-500 bg-sky-500/20 text-sky-300"
                        : "border-white/10 bg-black/30 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {(rate * 100).toFixed(0)}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-gradient-to-r from-sky-600 via-indigo-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 py-2 text-xs font-bold text-white shadow-lg transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-1.5"
          >
            <Bell className="h-3.5 w-3.5" />
            <span>KÍCH HOẠT THEO DÕI & CẢNH BÁO PNL</span>
          </button>
        </form>
      )}

      {/* Modal Dialog for Closing Position */}
      <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
        <DialogContent className="border-white/10 bg-[#0f172a] text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-black uppercase text-white flex items-center gap-2">
              <XCircle className="h-4 w-4 text-rose-400" />
              ĐÓNG VỊ THẾ GIAO DỊCH THỰC TẾ
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Nhập giá đóng thực tế trên tài khoản chứng khoán để tính toán số tiền Lời/Lỗ chính xác.
            </DialogDescription>
          </DialogHeader>

          {position && (
            <div className="space-y-3 py-2">
              <div className="rounded-md bg-slate-900/80 p-3 border border-white/10 grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">Vị thế & Số lượng</span>
                  <span className="font-bold text-sky-400">{position.side} {position.matchedVolume} HD</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-sans">Giá mở vị thế</span>
                  <span className="font-bold text-slate-200">{position.matchedPrice.toFixed(1)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-200 block mb-1">Giá đóng vị thế (Exit Price)</label>
                <input
                  type="number"
                  step="0.1"
                  value={exitPriceInput}
                  onChange={(e) => setExitPriceInput(e.target.value)}
                  placeholder="Nhập giá đóng..."
                  className="w-full rounded-md border border-white/20 bg-black/60 px-3 py-2 text-sm font-bold font-mono text-white focus:border-sky-500 focus:outline-none"
                />
                {snapshot?.current && (
                  <button
                    type="button"
                    onClick={() => setExitPriceInput(snapshot.current.toFixed(1))}
                    className="mt-1 text-[10px] text-sky-400 hover:underline cursor-pointer font-medium"
                  >
                    Dùng giá thị trường hiện tại ({snapshot.current.toFixed(1)})
                  </button>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setIsCloseModalOpen(false)}
              className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleConfirmClose}
              className="rounded-md bg-rose-600 hover:bg-rose-500 px-4 py-1.5 text-xs font-bold text-white shadow-md"
            >
              Xác Nhận Đóng Lệnh
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
