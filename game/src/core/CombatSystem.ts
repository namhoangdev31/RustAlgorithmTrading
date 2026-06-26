import { CombatMove, FighterState } from "@/types/game";
import { Scene } from "@babylonjs/core/scene";

export type CombatStateType = 'IDLE' | 'ATTACKING' | 'DODGING' | 'COUNTERING' | 'STUNNED' | 'DOWN';

export class CombatSystem {
    private _scene: Scene;
    private _fighter: FighterState;
    private _currentState: CombatStateType = 'IDLE';
    private _stateTimer: number | null = null;

    // Quản lý cửa sổ phản đòn (Counter Window)
    private _counterWindowActive: boolean = false;
    private _incomingMoveId: string | null = null;

    // Sự kiện callback khi có thay đổi trạng thái combat hoặc gây sát thương
    public onStateChange: (state: CombatStateType) => void = () => { };
    public onDamageDealt: (damage: number, moveName: string) => void = () => { };
    public onCounterSuccess: (moveName: string) => void = () => { };
    public onHitTaken: (damage: number) => void = () => { };

    constructor(fighter: FighterState, scene: Scene) {
        this._fighter = fighter;
        this._scene = scene;
    }

    public get currentState(): CombatStateType {
        return this._currentState;
    }

    public changeState(newState: CombatStateType, durationMs: number = 0): void {
        this._currentState = newState;
        this.onStateChange(newState);

        // Xóa timer cũ nếu có
        if (this._stateTimer) {
            window.clearTimeout(this._stateTimer);
            this._stateTimer = null;
        }

        // Tự động chuyển về trạng thái IDLE sau khi hết thời gian thực hiện chiêu thức/bị stun
        if (durationMs > 0) {
            this._stateTimer = window.setTimeout(() => {
                this.changeState('IDLE');
            }, durationMs);
        }
    }

    /**
     * Thực hiện một đòn đánh/chiêu thức võ thuật.
     */
    public executeMove(moveId: string): void {
        if (this._currentState !== 'IDLE' && this._currentState !== 'COUNTERING') {
            console.log("Không thể tung đòn khi đang ở trạng thái:", this._currentState);
            return;
        }

        const move = this._fighter.activeMoves.find((m: CombatMove) => m.id === moveId);
        if (!move) return;

        if (this._fighter.currentStamina < move.staminaCost) {
            console.log("Không đủ thể lực!");
            return;
        }

        // Tiêu hao thể lực
        this._fighter.currentStamina = Math.max(0, this._fighter.currentStamina - move.staminaCost);

        if (move.type === 'Strike') {
            this.changeState('ATTACKING', move.cooldownMs);

            // Giả lập kích hoạt hitbox đánh trúng (AI thực tế sẽ gọi va chạm của Mesh)
            window.setTimeout(() => {
                const damage = move.damage * (1 + this._fighter.stats.strength * 0.01);
                this.onDamageDealt(damage, move.name);
            }, move.cooldownMs * 0.5); // Gây sát thương ở giữa hoạt ảnh (Impact frame)

        } else if (move.type === 'Dodge') {
            this.changeState('DODGING', move.cooldownMs);

        } else if (move.type === 'Counter') {
            // Kiểm tra xem đối thủ có đang tung đòn đánh khắc chế được không
            if (this._counterWindowActive && this._incomingMoveId && move.counterableMoveIds?.includes(this._incomingMoveId)) {
                this.changeState('ATTACKING', move.cooldownMs);
                this.onCounterSuccess(move.name);

                const counterDamage = move.damage * 1.5; // Đòn counter gây thêm 150% sát thương
                this.onDamageDealt(counterDamage, move.name);

                this.deactivateCounterWindow();
            } else {
                // Hụt counter -> Rơi vào trạng thái sơ hở, dễ bị dính đòn
                this.changeState('COUNTERING', 300); // 300ms đứng yên sơ hở
            }
        }
    }

    /**
     * Nhận đòn đánh từ đối thủ.
     */
    public takeDamage(damage: number, moveId: string): void {
        if (this._currentState === 'DODGING') {
            console.log("Né đòn thành công!");
            return;
        }

        // Giảm sát thương dựa trên chỉ số chịu đựng (Toughness)
        const reducedDamage = Math.max(1, damage - this._fighter.stats.toughness * 0.5);
        this._fighter.currentHp = Math.max(0, this._fighter.currentHp - reducedDamage);

        this.onHitTaken(reducedDamage);

        if (this._fighter.currentHp <= 0) {
            this.changeState('DOWN');
        } else {
            // Choáng nhẹ khi trúng đòn
            this.changeState('STUNNED', 400);
        }
    }

    /**
     * Kích hoạt cửa sổ cảnh báo đòn đánh của đối thủ để người chơi chuẩn bị Counter.
     */
    public activateCounterWindow(incomingMoveId: string, durationMs: number): void {
        this._counterWindowActive = true;
        this._incomingMoveId = incomingMoveId;

        window.setTimeout(() => {
            this.deactivateCounterWindow();
        }, durationMs);
    }

    public deactivateCounterWindow(): void {
        this._counterWindowActive = false;
        this._incomingMoveId = null;
    }

    public dispose(): void {
        if (this._stateTimer) {
            window.clearTimeout(this._stateTimer);
        }
    }
}
