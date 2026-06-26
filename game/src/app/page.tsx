"use client";

import { useEffect, useRef, useState } from "react";

import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { SceneLoaderFlags } from "@babylonjs/core/Loading/sceneLoaderFlags";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";

import HavokPhysics from "@babylonjs/havok";

import "@babylonjs/core/Loading/loadingScreen";
import "@babylonjs/core/Loading/Plugins/babylonFileLoader";
import "@babylonjs/core/Cameras/universalCamera";
import "@babylonjs/core/Meshes/groundMesh";
import "@babylonjs/core/Lights/directionalLight";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Materials/PBR/pbrMaterial";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/XR/features/WebXRDepthSensing";
import "@babylonjs/core/Rendering/depthRendererSceneComponent";
import "@babylonjs/core/Rendering/prePassRendererSceneComponent";
import "@babylonjs/core/Materials/Textures/Loaders/envTextureLoader";
import "@babylonjs/core/Physics";
import "@babylonjs/materials/sky";

import { loadScene } from "babylonjs-editor-tools";
import { scriptsMap } from "@/scripts";

// Import các Module game lõi vừa dựng
import { FighterController } from "../core/Controller";
import { CombatSystem, CombatStateType } from "../core/CombatSystem";
import { StreamOverlay } from "../components/StreamOverlay";
import { FighterState, StreamState } from "@/types/game";

export default function Home() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	
	// Lưu tham chiếu không thuộc React State để chạy trong Render Loop (tránh re-render 60fps)
	const controllerRef = useRef<FighterController | null>(null);
	const combatSystemRef = useRef<CombatSystem | null>(null);

	// React States để đồng bộ sang UI Overlay tần suất thấp
	const [playerHp, setPlayerHp] = useState(100);
	const [playerStamina, setPlayerStamina] = useState(100);
	const [combatState, setCombatState] = useState<CombatStateType>("IDLE");

	// Khởi tạo trạng thái Stream Newtube giả lập ban đầu
	const initialStreamState: StreamState = {
		viewerCount: 1420,
		totalLikes: 3500,
		coinsEarned: 150,
		chatHistory: [
			{ id: "1", username: "Viewer_01", message: "Kênh mới này chất đấy!", isDonation: false, timestamp: Date.now() },
			{ id: "2", username: "Chicken_Fan", message: "Đầu gà vạn tuế!", isDonation: false, timestamp: Date.now() }
		]
	};

	useEffect(() => {
		if (!canvasRef.current) {
			return;
		}

		const engine = new Engine(canvasRef.current, true, {
			stencil: true,
			antialias: true,
			audioEngine: true,
			adaptToDeviceRatio: true,
			disableWebGL2Support: false,
			useHighPrecisionFloats: true,
			powerPreference: "high-performance",
			failIfMajorPerformanceCaveat: false,
		});

		const scene = new Scene(engine);

		handleLoad(engine, scene);

		let listener: () => void;
		window.addEventListener("resize", listener = () => {
			engine.resize();
		});

		return () => {
			if (controllerRef.current) controllerRef.current.dispose();
			if (combatSystemRef.current) combatSystemRef.current.dispose();
			
			scene.dispose();
			engine.dispose();

			window.removeEventListener("resize", listener);
		};
	}, [canvasRef]);

	async function handleLoad(engine: Engine, scene: Scene) {
		// Khởi tạo vật lý Havok
		const havok = await HavokPhysics();
		scene.enablePhysics(new Vector3(0, -981, 0), new HavokPlugin(true, havok));

		SceneLoaderFlags.ForceFullSceneLoadingForIncremental = true;
		
		try {
			// Thử load scene từ Editor, nếu chưa có sẽ dùng fallback mesh
			await loadScene("/scene/", "example.babylon", scene, scriptsMap, {
				quality: "high",
			});
		} catch (e) {
			console.warn("Không tìm thấy file scene của Editor, tự động dựng Mock Mesh sàn đấu.");
			
			// Tạo sàn đấu tạm
			const ground = MeshBuilder.CreateGround("ground", { width: 30, height: 30 }, scene);
			
			// Tạo nhân vật đại diện Hobin (hình hộp tạm thời)
			const playerMesh = MeshBuilder.CreateBox("hobin_player", { size: 1.8 }, scene);
			playerMesh.position.set(0, 0.9, 0);

			// Setup Camera
			const camera = scene.activeCamera || new (await import("@babylonjs/core/Cameras/universalCamera")).UniversalCamera("UniversalCamera", new Vector3(0, 5, -10), scene);
			camera.position.set(0, 5, -10);
			if ('setTarget' in camera) {
				(camera as any).setTarget(playerMesh.position);
			}
			scene.activeCamera = camera;

			// Setup Ánh sáng
			const light = new (await import("@babylonjs/core/Lights/directionalLight")).DirectionalLight("dirLight", new Vector3(-1, -2, -1), scene);
			light.intensity = 1.0;
		}

		// Lấy mesh người chơi để gán Controller & Combat
		const playerMesh = scene.getMeshByName("hobin_player") || scene.getMeshByName("player");
		
		if (playerMesh) {
			// Khởi tạo Trạng thái dữ liệu nhân vật
			const hobinData: FighterState = {
				id: "hobin",
				name: "Yoo Hobin",
				style: "SamdakStyle",
				stats: { strength: 12, speed: 15, toughness: 8, maxHp: 100, maxStamina: 100 },
				currentHp: 100,
				currentStamina: 100,
				activeMoves: [
					{ id: "kick", name: "Đá Bắp Chân (Calf Kick)", description: "Đòn đá nhanh vào bắp chân đối thủ", type: "Strike", damage: 15, staminaCost: 20, cooldownMs: 800, animationName: "calf_kick" },
					{ id: "dodge", name: "Né Trượt (Dodge)", description: "Lách người né đòn thẳng", type: "Dodge", damage: 0, staminaCost: 10, cooldownMs: 500, animationName: "dodge" },
					{ id: "counter", name: "Counter Sprawl", description: "Đè hông vật ngã đối phương", type: "Counter", damage: 30, staminaCost: 30, cooldownMs: 1200, animationName: "sprawl_counter", counterableMoveIds: ["pakgo_tackle", "taehoon_high_kick"] }
				],
				isNpc: false
			};

			// Gán Controller và Combat System vào refs
			controllerRef.current = new FighterController(playerMesh, scene);
			combatSystemRef.current = new CombatSystem(hobinData, scene);

			// Lắng nghe sự kiện từ combat system để cập nhật lên React UI
			combatSystemRef.current.onStateChange = (state) => {
				setCombatState(state);
			};

			combatSystemRef.current.onHitTaken = (reducedDamage) => {
				setPlayerHp(hobinData.currentHp);
			};

			// Hồi phục thể lực tự động trong render loop
			scene.onBeforeRenderObservable.add(() => {
				if (hobinData.currentHp > 0 && hobinData.currentStamina < hobinData.stats.maxStamina) {
					hobinData.currentStamina = Math.min(
						hobinData.stats.maxStamina, 
						hobinData.currentStamina + 15 * engine.getDeltaTime() / 1000
					);
					setPlayerStamina(hobinData.currentStamina);
				}
			});
		}

		if (scene.activeCamera) {
			scene.activeCamera.attachControl();
		}

		// Vòng lặp render chính
		engine.runRenderLoop(() => {
			const deltaTime = engine.getDeltaTime() / 1000;
			
			// Cập nhật di chuyển nhân vật
			if (controllerRef.current) {
				controllerRef.current.update(deltaTime);
			}

			scene.render();
		});
	}

	// Trigger đòn đánh khi click trên Stream UI Overlay
	const handleOverlayAction = (actionId: string) => {
		if (combatSystemRef.current) {
			combatSystemRef.current.executeMove(actionId);
		}
	};

	return (
		<main className="relative flex w-screen h-screen flex-col items-center justify-between overflow-hidden bg-black">
			{/* Canvas chứa luồng render Babylon.js 3D */}
			<canvas
				ref={canvasRef}
				className="w-full h-full outline-none select-none z-0"
			/>
			
			{/* Giao diện Overlay mô phỏng Newtube */}
			<StreamOverlay
				streamState={initialStreamState}
				playerHp={playerHp}
				playerMaxHp={100}
				playerStamina={playerStamina}
				playerMaxStamina={100}
				combatState={combatState}
				onExecuteAction={handleOverlayAction}
			/>
		</main>
	);
}
