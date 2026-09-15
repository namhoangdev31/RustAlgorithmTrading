"use client";

import React, { useState, useEffect, useRef } from "react";
import { MarketSnapshot, TradingPlan } from "@/lib/server/quant/types";
import {
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
  Clock,
  DollarSign,
  PieChart,
  ArrowRight,
  Zap,
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
  marginRate: 0.03 | 0.05 | 0.18;
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
const CONTRACT_MULTIPLIER = 100000; // 100,000 VND / point for VN30F1M

export const UserPositionTracker: React.FC<UserPositionTrackerProps> = ({
  snapshot,
  plan,
}) => {
  const [position, setPosition] = useState<TrackedPosition | null>(null);
  
  // Input form state
  const [inputSide, setInputSide] = useState<"LONG" | "SHORT">("LONG");
  const [inputPrice, setInputPrice] = useState<string>("");
  const [inputVolume, setInputVolume] = useState<string>("1");
  const [inputMargin, setInputMargin] = useState<0.03 | 0.05 | 0.18>(0.18);

  // Close position modal & result state
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [exitPriceInput, setExitPriceInput] = useState<string>("");
  const [closedResult, setClosedResult] = useState<ClosedResult | null>(null);

  // Notification deduplication ref
  const lastNotifiedPriceRef = useRef<number | null>(null);

  // Load from localStorage on mount
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

  // Update default input price if snapshot is available and form is empty
  useEffect(() => {
    if (!inputPrice && snapshot?.current) {
      setInputPrice(snapshot.current.toFixed(1));
    }
  }, [snapshot?.current, inputPrice]);

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
    }
  };

  const sendAlertNotification = (title: string, body: string, type: "warning" | "error" | "success") => {
    // 1. Toast notification
    if (type === "error") {
      toast.error(title, { description: body, duration: 6000 });
    } else if (type === "warning") {
      toast.warning(title, { description: body, duration: 6000 });
    } else {
      toast.success(title, { description: body, duration: 6000 });
    }

    // 2. Browser Desktop Push Notification
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
        });
      } catch (e) {}
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

    const isLong = position.side === "LONG";
    const pnlPoints = isLong
      ? exitPrice - position.matchedPrice
      : position.matchedPrice - exitPrice;
    
    const pnlMoney = pnlPoints * CONTRACT_MULTIPLIER * position.matchedVolume;
    const requiredMargin = position.matchedPrice * CONTRACT_MULTIPLIER * position.matchedVolume * position.marginRate;
    const roiPercent = (pnlMoney / requiredMargin) * 100;

    const result: ClosedResult = {
      side: position.side,
      matchedPrice: position.matchedPrice,
      exitPrice,
      volume: position.matchedVolume,
      pnlPoints,
      pnlMoney,
      roiPercent,
      closedAt: new Date().toLocaleTimeString("vi-VN"),
    };

    setClosedResult(result);
    setPosition(null);
    setIsCloseModalOpen(false);

    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (e) {}

    const isProfit = pnlMoney >= 0;
    const title = isProfit ? "🎉 ĐÃ ĐÓNG VỊ THẾ LỜI!" : "🔴 ĐÃ ĐÓNG VỊ THẾ LỖ!";
    const body = `${position.side} ${position.matchedVolume} HD: ${isProfit ? "+" : ""}${pnlPoints.toFixed(1)} điểm (${isProfit ? "+" : ""}${pnlMoney.toLocaleString("vi-VN")} VNĐ)`;

    sendAlertNotification(title, body, isProfit ? "success" : "error");
  };

  // Real-time calculations
  const livePrice = snapshot?.current;
  const isPositionActive = position && position.status === "ACTIVE";

  let pnlPoints = 0;
  let pnlMoney = 0;
  let requiredMargin = 0;
  let roiPercent = 0;

  if (isPositionActive && livePrice) {
    const isLong = position.side === "LONG";
    pnlPoints = isLong
      ? livePrice - position.matchedPrice
      : position.matchedPrice - livePrice;

    pnlMoney = pnlPoints * CONTRACT_MULTIPLIER * position.matchedVolume;
    requiredMargin = position.matchedPrice * CONTRACT_MULTIPLIER * position.matchedVolume * position.marginRate;
    roiPercent = requiredMargin > 0 ? (pnlMoney / requiredMargin) * 100 : 0;
  }

  // System warning comparison logic
  const warnings: { message: string; type: "error" | "warning" | "info" }[] = [];
  
  if (isPositionActive && plan) {
    // 1. Direction mismatch check
    if (position.side !== plan.side) {
      warnings.push({
        message: `⚠️ CẢNH BÁO LỆCH HƯỚNG: Lệnh của bạn là [${position.side}], trong khi Kèo hệ thống đang khuyến nghị [${plan.side}] tại giá ${plan.entryPrice?.toFixed(1) || "--"}. Rủi ro cao!`,
        type: "error",
      });
    } else {
      // 2. Slippage check
      if (plan.entryPrice != null) {
        const diff = position.side === "LONG"
          ? position.matchedPrice - plan.entryPrice
          : plan.entryPrice - position.matchedPrice;
        
        if (diff > 0.5) {
          warnings.push({
            message: `⚠️ Trượt giá +${diff.toFixed(1)} điểm so với Kèo hệ thống (Entry: ${plan.entryPrice.toFixed(1)}). Điểm vào lệnh kém tối ưu hơn!`,
            type: "warning",
          });
        }
      }
    }

    // 3. SL Warning
    if (plan.slPrice != null && livePrice != null) {
      const distanceToSL = Math.abs(livePrice - plan.slPrice);
      if (distanceToSL <= 2.0) {
        warnings.push({
          message: `🚨 GIÁ ĐANG CHẠM VÙNG CẮT LỖ: Giá hiện tại (${livePrice.toFixed(1)}) gần sát mức SL hệ thống (${plan.slPrice.toFixed(1)}). Cân nhắc quản trị rủi ro!`,
          type: "warning",
        });
      }
    }

    // 4. TP Warning
    if (plan.tpPrice != null && livePrice != null) {
      const isTpReached = position.side === "LONG" ? livePrice >= plan.tpPrice : livePrice <= plan.tpPrice;
      if (isTpReached) {
        warnings.push({
          message: `🎉 ĐẠT CHỈ TIÊU KÈO HỆ THỐNG: Giá đã chạm/vượt TP1 hệ thống (${plan.tpPrice.toFixed(1)}). Khuyến nghị chốt lời hoặc dời SL về hòa vốn (BE)!`,
          type: "info",
        });
      }
    }
  }

  // Trigger automated Toast notifications when price changes significantly
  useEffect(() => {
    if (!isPositionActive || !livePrice || !warnings.length) return;
    if (lastNotifiedPriceRef.current === livePrice) return;
    
    lastNotifiedPriceRef.current = livePrice;
    const topWarning = warnings[0];
    
    if (topWarning.type === "error") {
      toast.error("Cảnh báo rủi ro vị thế", { description: topWarning.message, id: "position-risk-alert" });
    } else if (topWarning.type === "warning") {
      toast.warning("Cảnh báo biến động vị thế", { description: topWarning.message, id: "position-risk-alert" });
    }
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
        {isPositionActive && (
          <button
            onClick={handleClearPosition}
            className="text-[10px] font-semibold text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            Bỏ theo dõi
          </button>
        )}
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
                  {requiredMargin.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            {/* Live PnL Highlight */}
            <div className="mt-2.5 pt-2.5 border-t border-white/10 grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-slate-400 font-medium block">Số điểm PnL (Realtime)</span>
                <div className={`text-base font-black font-mono flex items-center gap-1 ${pnlPoints >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {pnlPoints >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {pnlPoints >= 0 ? "+" : ""}{pnlPoints.toFixed(1)} điểm
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-medium block">Tiền PnL (VNĐ)</span>
                <div className={`text-base font-black font-mono ${pnlMoney >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {pnlMoney >= 0 ? "+" : ""}{pnlMoney.toLocaleString("vi-VN")}đ
                  <span className="text-[10px] font-semibold ml-1 opacity-80">({roiPercent >= 0 ? "+" : ""}{roiPercent.toFixed(1)}%)</span>
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
                  <span>{w.message}</span>
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
