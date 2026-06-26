import { Scene } from "@babylonjs/core/scene";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { KeyboardEventTypes } from "@babylonjs/core/Events/keyboardEvents";

export class FighterController {
    private _scene: Scene;
    private _mesh: AbstractMesh;
    private _cameraTarget: TransformNode;

    // Trạng thái nút bấm
    private _inputMap: { [key: string]: boolean } = {};
    
    // Thuộc tính di chuyển
    public moveSpeed: number = 5.0;
    public rotationSpeed: number = 10.0;
    
    // Biến tạm để tránh tạo đối tượng mới trong Render Loop
    private _tempDirection = new Vector3();
    private _tempVelocity = new Vector3();

    constructor(mesh: AbstractMesh, scene: Scene) {
        this._mesh = mesh;
        this._scene = scene;
        
        // Tạo node ảo làm điểm neo bám cho camera
        this._cameraTarget = new TransformNode("cameraTarget", this._scene);
        this._cameraTarget.parent = this._mesh;
        this._cameraTarget.position.set(0, 1.5, -3); // Hơi chếch sau đầu

        this._setupInputs();
    }

    private _setupInputs(): void {
        this._scene.onKeyboardObservable.add((kbInfo) => {
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
            const rightDirection = Vector3.Cross(this._tempDirection, up);
            rightDirection.normalize();

            // Tổng hợp hướng cuối cùng
            this._tempVelocity.set(0, 0, 0);
            if (forward !== 0) {
                this._tempVelocity.addInPlace(this._tempDirection.scale(forward));
            }
            if (right !== 0) {
                this._tempVelocity.addInPlace(rightDirection.scale(right));
            }
            this._tempVelocity.normalize();

            // Quay nhân vật về hướng di chuyển mượt mà
            const targetRotationY = Math.atan2(this._tempVelocity.x, this._tempVelocity.z);
            
            // Interpolation xoay góc quay mượt mà (Lerp)
            let diff = targetRotationY - this._mesh.rotation.y;
            
            // Chuẩn hóa góc quay về khoảng [-PI, PI] để tránh bị xoay vòng lớn
            while (diff < -Math.PI) diff += Math.PI * 2;
            while (diff > Math.PI) diff -= Math.PI * 2;
            
            this._mesh.rotation.y += diff * this.rotationSpeed * deltaTime;

            // Thực hiện di chuyển nhân vật
            const displacement = this._tempVelocity.scale(this.moveSpeed * deltaTime);
            
            // Nếu dùng vật lý thực (Havok aggregate), áp dụng lực thay vì dịch vị trí trực tiếp
            const physicsBody = this._mesh.physicsBody;
            if (physicsBody) {
                // Di chuyển thông qua vận tốc vật lý
                physicsBody.setLinearVelocity(displacement.scaleInPlace(1 / deltaTime));
            } else {
                // Dịch chuyển vị trí cơ bản
                this._mesh.position.addInPlace(displacement);
            }
            
            this._triggerAnimation("run");
        } else {
            // Dừng lực vật lý khi không có phím bấm
            const physicsBody = this._mesh.physicsBody;
            if (physicsBody) {
                this._tempVelocity.set(0, 0, 0);
                physicsBody.setLinearVelocity(this._tempVelocity);
            }
            this._triggerAnimation("idle");
        }
    }

    private _triggerAnimation(animName: string): void {
        // AI kế thừa sẽ gắn AnimationController ở đây để kích hoạt blend tree hoạt ảnh tương ứng
    }

    public dispose(): void {
        this._cameraTarget.dispose();
    }
}
