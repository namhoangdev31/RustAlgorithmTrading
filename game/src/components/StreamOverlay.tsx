"use client";

import React, { useEffect, useState, useRef } from "react";
import { ChatMessage, StreamState } from "@/types/game";

interface StreamOverlayProps {
    streamState: StreamState;
    playerHp: number;
    playerMaxHp: number;
    playerStamina: number;
    playerMaxStamina: number;
    combatState: string;
    onExecuteAction?: (actionId: string) => void;
}

const SHIFT_MESSAGES = [
    "Kinh vãi nồi!",
    "Đầu gà dạy đỉnh thực sự!!!",
    "Pakgo quả này vỡ mồm rồi.",
    "Lật kèo kìa anh em ơi!!!",
    "Gõ mạnh lên Hobin!",
    "Ủng hộ 500 bóng bóng cho Hobin nhé.",
    "Taehoon nhìn quả này chắc cay lắm.",
    "Đánh chuẩn đét Samdak dạy luôn.",
    "Múa đẹp đấy em zai.",
    "Có ai thấy nãy né ảo diệu vcl không???"
];

const DONATOR_NAMES = ["Pakgo_Anti_Fan", "Samdak_De_Tu", "Bomi_Love", "Mr_Chicken", "Gyeoul_Cam"];

export const StreamOverlay: React.FC<StreamOverlayProps> = ({
    streamState,
    playerHp,
    playerMaxHp,
    playerStamina,
    playerMaxStamina,
    combatState,
    onExecuteAction
}) => {
    const [chats, setChats] = useState<ChatMessage[]>(streamState.chatHistory);
    const [viewers, setViewers] = useState(streamState.viewerCount);
    const [likes, setLikes] = useState(streamState.totalLikes);
    const [coins, setCoins] = useState(streamState.coinsEarned);
    const [donationAlert, setDonationAlert] = useState<{ username: string; amount: number; message: string } | null>(null);
    
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chats]);

    // Giả lập luồng chat & người xem chạy liên tục
    useEffect(() => {
        const interval = setInterval(() => {
            // Tăng ngẫu nhiên lượng người xem và like
            setViewers((prev: number) => prev + Math.floor(Math.random() * 5) - 2);
            setLikes((prev: number) => prev + Math.floor(Math.random() * 10));

            // Thêm chat ngẫu nhiên
            const isDonation = Math.random() < 0.15;
            const donationAmount = isDonation ? [50, 100, 200, 500][Math.floor(Math.random() * 4)] : undefined;
            
            const newChat: ChatMessage = {
                id: Math.random().toString(),
                username: isDonation 
                    ? DONATOR_NAMES[Math.floor(Math.random() * DONATOR_NAMES.length)]
                    : `Viewer_${Math.floor(Math.random() * 9000 + 1000)}`,
                message: isDonation 
                    ? `Đã donate ${donationAmount} Coins! Thách bạn KO bằng đòn counter đó!` 
                    : SHIFT_MESSAGES[Math.floor(Math.random() * SHIFT_MESSAGES.length)],
                isDonation,
                donationAmount,
                timestamp: Date.now()
            };

            setChats((prev: ChatMessage[]) => [...prev.slice(-30), newChat]); // Giới hạn tối đa 30 tin nhắn

            if (isDonation && donationAmount) {
                setCoins((prev: number) => prev + donationAmount);
                setDonationAlert({
                    username: newChat.username,
                    amount: donationAmount,
                    message: newChat.message
                });
                // Ẩn alert sau 3.5 giây
                setTimeout(() => setDonationAlert(null), 3500);
            }
        }, 1500);

        return () => clearInterval(interval);
    }, []);

    // Màu sắc trạng thái chiến đấu (Combat State Status)
    const getCombatStateColor = () => {
        switch (combatState) {
            case "ATTACKING": return "bg-red-500 text-white shadow-[0_0_10px_#ef4444]";
            case "DODGING": return "bg-green-500 text-white shadow-[0_0_10px_#22c55e]";
            case "COUNTERING": return "bg-yellow-500 text-black shadow-[0_0_10px_#eab308]";
            case "STUNNED": return "bg-purple-600 text-white animate-pulse shadow-[0_0_10px_#9333ea]";
            case "DOWN": return "bg-gray-800 text-gray-400";
            default: return "bg-black/60 text-white border border-white/20";
        }
    };

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none flex flex-col justify-between p-6 select-none font-sans">
            {/* Top Bar: Live Status & Stream Metrics */}
            <div className="w-full flex justify-between items-start pointer-events-auto">
                {/* Live Badge */}
                <div className="flex items-center space-x-3 bg-black/50 backdrop-blur-md rounded-full px-4 py-2 border border-white/10">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                    </span>
                    <span className="text-white font-bold text-sm tracking-wider uppercase">LIVE</span>
                    <span className="text-gray-300 text-xs border-l border-white/20 pl-2">
                        {viewers.toLocaleString()} người xem
                    </span>
                </div>

                {/* Earnings & Likes */}
                <div className="flex space-x-3">
                    <div className="bg-gradient-to-r from-amber-500 to-yellow-400 rounded-lg px-4 py-2 shadow-lg flex items-center space-x-2 border border-yellow-300/30">
                        <span className="text-black font-extrabold text-sm">💰 {coins.toLocaleString()} Coins</span>
                    </div>
                    <div className="bg-black/50 backdrop-blur-md rounded-lg px-4 py-2 border border-white/10 text-white font-semibold text-sm flex items-center space-x-1">
                        <span>❤️</span>
                        <span>{likes.toLocaleString()}</span>
                    </div>
                </div>
            </div>

            {/* Middle Alert: Donation Notification */}
            {donationAlert && (
                <div className="self-center transform translate-y-[-50px] transition-all duration-500 ease-out bg-gradient-to-r from-purple-900/90 to-indigo-900/90 backdrop-blur-lg border border-purple-500/50 rounded-2xl p-5 shadow-2xl flex flex-col items-center max-w-sm pointer-events-auto animate-bounce">
                    <div className="text-yellow-400 font-extrabold text-lg flex items-center space-x-2">
                        <span>⚡ HYPERCHAT ⚡</span>
                    </div>
                    <p className="text-white font-bold text-sm text-center mt-2">
                        <span className="text-pink-400">{donationAlert.username}</span> đã tặng <span className="text-yellow-300 font-extrabold">{donationAlert.amount} Coins</span>!
                    </p>
                    <p className="text-gray-200 text-xs italic text-center mt-2 border-t border-white/10 pt-2 w-full">
                        "{donationAlert.message}"
                    </p>
                </div>
            )}

            {/* Bottom Row: Controls & Chat Overlay */}
            <div className="w-full flex justify-between items-end">
                {/* Left Side: Character Vitals & Active Combat State */}
                <div className="flex flex-col space-y-4 max-w-xs pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4">
                    {/* Character Name & Status Badge */}
                    <div className="flex items-center justify-between">
                        <span className="text-white font-black tracking-wider text-base uppercase">YOO HOBIN</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-widest uppercase transition-all duration-300 ${getCombatStateColor()}`}>
                            {combatState}
                        </span>
                    </div>

                    {/* HP Bar */}
                    <div className="flex flex-col space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-red-300">
                            <span>Máu (HP)</span>
                            <span>{Math.round(playerHp)} / {playerMaxHp}</span>
                        </div>
                        <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-red-500/20">
                            <div 
                                className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-300"
                                style={{ width: `${(playerHp / playerMaxHp) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Stamina Bar */}
                    <div className="flex flex-col space-y-1">
                        <div className="flex justify-between text-[11px] font-bold text-emerald-300">
                            <span>Thể lực (STAMINA)</span>
                            <span>{Math.round(playerStamina)} / {playerMaxStamina}</span>
                        </div>
                        <div className="w-full h-3 bg-black/60 rounded-full overflow-hidden border border-emerald-500/20">
                            <div 
                                className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-300"
                                style={{ width: `${(playerStamina / playerMaxStamina) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Quick Combat Moves Button (Hỗ trợ nhấp chuột test đòn) */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
                        <button 
                            onClick={() => onExecuteAction?.("kick")}
                            className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-xs py-2 rounded-lg transition-colors border border-white/5"
                        >
                            Đá (Kick)
                        </button>
                        <button 
                            onClick={() => onExecuteAction?.("dodge")}
                            className="bg-white/10 hover:bg-white/20 active:bg-white/30 text-white font-bold text-xs py-2 rounded-lg transition-colors border border-white/5"
                        >
                            Né (Dodge)
                        </button>
                        <button 
                            onClick={() => onExecuteAction?.("counter")}
                            className="bg-gradient-to-r from-pink-600 to-red-600 hover:from-pink-500 hover:to-red-500 text-white font-black text-xs py-2 rounded-lg shadow-lg border border-pink-400/20 transition-all"
                        >
                            Counter
                        </button>
                    </div>
                </div>

                {/* Right Side: Chat Window */}
                <div className="w-80 h-72 pointer-events-auto bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="bg-white/5 border-b border-white/10 px-4 py-2 flex items-center justify-between">
                        <span className="text-gray-300 font-bold text-xs tracking-wide">Trò chuyện trực tiếp (Newtube Chat)</span>
                        <span className="text-[10px] text-green-400 font-semibold flex items-center space-x-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse"></span>
                            <span>Đang đồng bộ</span>
                        </span>
                    </div>

                    {/* Chat Content */}
                    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                        {chats.map(chat => (
                            <div 
                                key={chat.id} 
                                className={`text-xs p-2 rounded-lg transition-all duration-300 ${
                                    chat.isDonation 
                                        ? "bg-purple-950/80 border border-purple-500/40 text-purple-200" 
                                        : "bg-white/5 text-gray-200"
                                }`}
                            >
                                <span className={`font-black mr-2 ${
                                    chat.isDonation ? "text-pink-400" : "text-yellow-500"
                                }`}>
                                    {chat.username}
                                </span>
                                <span>{chat.message}</span>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>
                </div>
            </div>
        </div>
    );
};
