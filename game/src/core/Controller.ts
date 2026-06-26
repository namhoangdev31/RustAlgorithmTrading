import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { KeyboardEventTypes, KeyboardInfo } from "@babylonjs/core/Events/keyboardEvents";
import { Observer } from "@babylonjs/core/Misc/observable";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";

import "@babylonjs/core/Culling/ray";

export class FighterController {
    private _scene: Scene;
    private _node: TransformNode;
    private _visualRoot: TransformNode | null;
    private _cameraTarget: TransformNode;
    private _keyboardObserver: Observer<KeyboardInfo> | null = null;

    // Trạng thái nút bấm
    private _inputMap: { [key: string]: boolean } = {};
    
    // Thuộc tính di chuyển
    public moveSpeed: number = 5.0;
    public rotationSpeed: number = 10.0;
    
    // Biến tạm để tránh tạo đối tượng mới trong Render Loop
    private _tempDirection = new Vector3();
    private _tempRightDirection = new Vector3();
    private _tempVelocity = new Vector3();
    private _tempDisplacement = new Vector3();
    private _tempPhysicsVelocity = new Vector3();

    private _animationDurations: Record<string, number> = {};
    private _animationGroups: Record<string, AnimationGroup> = {};
    private _activeAction: string | null = null;
    private _actionElapsed = 0;
    private _actionDuration = 0;
    private _visualBaseY = 0;
    private _currentLoopAnimation: string | null = null;

    constructor(node: TransformNode, scene: Scene, visualRoot: TransformNode | null = null) {
        this._node = node;
        this._scene = scene;
        this._visualRoot = visualRoot;
        this._visualBaseY = visualRoot?.position.y ?? 0;
        
        // Tạo node ảo làm điểm neo bám cho camera
        this._cameraTarget = new TransformNode("cameraTarget", this._scene);
        this._cameraTarget.parent = this._node;
        this._cameraTarget.position.set(0, 1.5, -3); // Hơi chếch sau đầu

        this._setupInputs();
    }

    private _setupInputs(): void {
        this._keyboardObserver = this._scene.onKeyboardObservable.add((kbInfo) => {
            const key = kbInfo.event.key.toLowerCase();
            if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
                this._inputMap[key] = true;
            } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
                this._inputMap[key] = false;
            }
        });
    }

    /**
     * Hàm tick chạy liên tục 60 FPS, được gọi từ Render Loop chính.
     * @param deltaTime Thời gian giãn cách giữa các khung hình (s).
     */
    public update(deltaTime: number): void {
        if (!this._scene.activeCamera) return;

        let forward = 0;
        let right = 0;

        if (this._inputMap["w"] || this._inputMap["arrowup"]) forward = 1;
        if (this._inputMap["s"] || this._inputMap["arrowdown"]) forward = -1;
        if (this._inputMap["a"] || this._inputMap["arrowleft"]) right = -1;
        if (this._inputMap["d"] || this._inputMap["arrowright"]) right = 1;

        if (forward !== 0 || right !== 0) {
            // Lấy hướng tiến lên dựa vào góc nhìn của Camera
            const cameraDirection = this._scene.activeCamera.getForwardRay().direction;
            
            // Chiếu hướng camera xuống mặt phẳng ngang (X-Z)
            this._tempDirection.set(cameraDirection.x, 0, cameraDirection.z);
            this._tempDirection.normalize();

            // Tính toán hướng di chuyển ngang (Right = Forward x Up)
            const up = Vector3.UpReadOnly;
            Vector3.CrossToRef(this._tempDirection, up, this._tempRightDirection);
            this._tempRightDirection.normalize();

            // Tổng hợp hướng cuối cùng
            this._tempVelocity.set(0, 0, 0);
            if (forward !== 0) {
                this._tempVelocity.x += this._tempDirection.x * forward;
                this._tempVelocity.z += this._tempDirection.z * forward;
            }
            if (right !== 0) {
                this._tempVelocity.x += this._tempRightDirection.x * right;
                this._tempVelocity.z += this._tempRightDirection.z * right;
            }
            this._tempVelocity.normalize();

            // Quay nhân vật về hướng di chuyển mượt mà
            const targetRotationY = Math.atan2(this._tempVelocity.x, this._tempVelocity.z);
            
            // Interpolation xoay góc quay mượt mà (Lerp)
            let diff = targetRotationY - this._node.rotation.y;
            
            // Chuẩn hóa góc quay về khoảng [-PI, PI] để tránh bị xoay vòng lớn
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            
            this._node.rotation.y += diff * this.rotationSpeed * deltaTime;

            // Thực hiện di chuyển nhân vật
            this._tempDisplacement.copyFrom(this._tempVelocity).scaleInPlace(this.moveSpeed * deltaTime);
            
            // Nếu dùng vật lý thực (Havok aggregate), áp dụng lực thay vì dịch vị trí trực tiếp
            const physicsBody = (this._node as AbstractMesh).physicsBody;
            if (physicsBody) {
                // Di chuyển thông qua vận tốc vật lý
                this._tempPhysicsVelocity.copyFrom(this._tempVelocity).scaleInPlace(this.moveSpeed);
                physicsBody.setLinearVelocity(this._tempPhysicsVelocity);
            } else {
                // Dịch chuyển vị trí cơ bản
                this._node.position.addInPlace(this._tempDisplacement);
            }
            
            this._triggerAnimation("run");
        } else {
            // Dừng lực vật lý khi không có phím bấm
            const physicsBody = (this._node as AbstractMesh).physicsBody;
            if (physicsBody) {
                this._tempVelocity.set(0, 0, 0);
                physicsBody.setLinearVelocity(this._tempVelocity);
            }
            this._triggerAnimation("idle");
        }

        this._updateActionAnimation(deltaTime);
    }

    public setAnimationDurations(durations: Record<string, number>): void {
        this._animationDurations = durations;
    }

    public setAnimationGroups(groups: Record<string, AnimationGroup | undefined>): void {
        this._animationGroups = Object.entries(groups).reduce<Record<string, AnimationGroup>>((animationGroups, [name, group]) => {
            if (group) {
                animationGroups[name] = group;
            }

            return animationGroups;
        }, {});
    }

    public playActionAnimation(animName: string, fallbackDurationMs = 600): void {
        const group = this._animationGroups[animName];

        if (group) {
            this._stopAllAnimations();
            group.start(false, 1, group.from, group.to, false);
        }

        this._activeAction = animName;
        this._actionElapsed = 0;
        this._actionDuration = (this._animationDurations[animName] ?? fallbackDurationMs) / 1000;
    }

    private _triggerAnimation(animName: string): void {
        if (this._activeAction || this._currentLoopAnimation === animName) {
            return;
        }

        const group = this._animationGroups[animName];

        if (!group) {
            return;
        }

        this._stopAllAnimations();
        group.start(true, 1, group.from, group.to, false);
        this._currentLoopAnimation = animName;
    }

    private _updateActionAnimation(deltaTime: number): void {
        if (!this._visualRoot || !this._activeAction) return;

        this._actionElapsed += deltaTime;
        const progress = Math.min(1, this._actionElapsed / this._actionDuration);
        const pulse = Math.sin(progress * Math.PI);

        this._visualRoot.position.y = this._visualBaseY;
        this._visualRoot.rotation.x = 0;
        this._visualRoot.rotation.z = 0;

        if (this._activeAction === "calf_kick") {
            this._visualRoot.rotation.x = -0.24 * pulse;
            this._visualRoot.position.y = this._visualBaseY + 0.08 * pulse;
        } else if (this._activeAction === "dodge") {
            this._visualRoot.rotation.z = 0.28 * pulse;
        } else if (this._activeAction === "sprawl_counter") {
            this._visualRoot.rotation.x = 0.34 * pulse;
            this._visualRoot.position.y = this._visualBaseY - 0.12 * pulse;
        } else if (this._activeAction === "hit_react") {
            this._visualRoot.rotation.x = -0.18 * pulse;
        }

        if (progress >= 1) {
            this._activeAction = null;
            this._currentLoopAnimation = null;
            this._visualRoot.position.y = this._visualBaseY;
            this._visualRoot.rotation.x = 0;
            this._visualRoot.rotation.z = 0;
        }
    }

    private _stopAllAnimations(): void {
        Object.values(this._animationGroups).forEach((group) => {
            if (group.isPlaying) {
                group.stop();
            }
        });
    }

    public dispose(): void {
        this._stopAllAnimations();

        if (this._keyboardObserver) {
            this._scene.onKeyboardObservable.remove(this._keyboardObserver);
            this._keyboardObserver = null;
        }

        this._cameraTarget.dispose();
    }
}
