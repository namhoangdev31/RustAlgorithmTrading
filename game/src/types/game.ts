export type CombatStyle = 'Taekwondo' | 'Kickboxing' | 'Judo' | 'Boxing' | 'StreetFight' | 'SamdakStyle';

export type MoveType = 'Strike' | 'Grab' | 'Counter' | 'Dodge' | 'Block';

export interface CombatMove {
    id: string;
    name: string;
    description: string;
    type: MoveType;
    damage: number;
    staminaCost: number;
    cooldownMs: number;
    animationName: string;
    // Danh sách các đòn đánh/kiểu tấn công mà chiêu thức này có thể khắc chế (chỉ dùng cho Counter/Dodge)
    counterableMoveIds?: string[];
}

export interface FighterStats {
    strength: number;    // Tăng sát thương đòn đánh vật lý
    speed: number;       // Tăng tốc độ xuất chiêu và né tránh
    toughness: number;   // Giảm sát thương nhận vào
    maxHp: number;
    maxStamina: number;
}

export interface FighterState {
    id: string;
    name: string;
    style: CombatStyle;
    stats: FighterStats;
    currentHp: number;
    currentStamina: number;
    activeMoves: CombatMove[];
    isNpc: boolean;
}

export interface ChatMessage {
    id: string;
    username: string;
    message: string;
    isDonation: boolean;
    donationAmount?: number;
    timestamp: number;
}

export interface StreamState {
    viewerCount: number;
    totalLikes: number;
    coinsEarned: number;
    chatHistory: ChatMessage[];
}
