"use client";

import { useEffect, useRef, useState } from "react";

import { Scene } from "@babylonjs/core/scene";
import { Engine } from "@babylonjs/core/Engines/engine";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { HavokPlugin } from "@babylonjs/core/Physics/v2/Plugins/havokPlugin";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { Observer } from "@babylonjs/core/Misc/observable";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";

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

// Import các Module game lõi vừa dựng
import { GameAssetManager, GameAnimationSet } from "@/assets/GameAssetManager";
import { applyToonStyle, ToonStyleHandle } from "@/engine/render/ToonStyle";
import { FighterController } from "../core/Controller";
import { CombatSystem, CombatStateType } from "../core/CombatSystem";
import { StreamOverlay } from "../components/StreamOverlay";
import { FighterState, StreamState } from "@/types/game";

interface VerticalSliceAssets {
	playerRoot: TransformNode;
	meshes: AbstractMesh[];
	animationSet: GameAnimationSet;
	animationGroups: AnimationGroup[];
}

export default function Home() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	
	// Lưu tham chiếu không thuộc React State để chạy trong Render Loop (tránh re-render 60fps)
	const controllerRef = useRef<FighterController | null>(null);
	const combatSystemRef = useRef<CombatSystem | null>(null);
	const assetManagerRef = useRef<GameAssetManager | null>(null);
	const toonStyleRef = useRef<ToonStyleHandle | null>(null);
	const staminaObserverRef = useRef<Observer<Scene> | null>(null);

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

		handleLoad(engine, scene).catch((error) => {
			console.error("[Render] Failed to initialize scene", error);
		});

		let listener: () => void;
		window.addEventListener("resize", listener = () => {
			engine.resize();
		});

		return () => {
			if (controllerRef.current) controllerRef.current.dispose();
			if (combatSystemRef.current) combatSystemRef.current.dispose();
			if (staminaObserverRef.current) {
				scene.onBeforeRenderObservable.remove(staminaObserverRef.current);
				staminaObserverRef.current = null;
			}
			if (toonStyleRef.current) toonStyleRef.current.dispose();
			if (assetManagerRef.current) assetManagerRef.current.dispose();
			
			scene.dispose();
			engine.dispose();

			window.removeEventListener("resize", listener);
		};
	}, [canvasRef]);

	async function handleLoad(engine: Engine, scene: Scene) {
		// Khởi tạo vật lý Havok
		const havok = await HavokPhysics();
		scene.enablePhysics(new Vector3(0, -981, 0), new HavokPlugin(true, havok));
		scene.clearColor = new Color4(0.03, 0.035, 0.045, 1);

		const assetManager = new GameAssetManager(scene);
		assetManagerRef.current = assetManager;
		setupLights(scene);

		const slice = await loadVerticalSlice(scene, assetManager);
		setupCamera(scene, slice.playerRoot);
		toonStyleRef.current = applyToonStyle(scene, slice.meshes);
		setupPlayerSystems(engine, scene, slice.playerRoot, slice.animationSet);

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

	async function loadVerticalSlice(scene: Scene, assetManager: GameAssetManager): Promise<VerticalSliceAssets> {
		try {
			await assetManager.loadManifest();
			const environment = await assetManager.loadEnvironment("school-alley");
			const character = await assetManager.loadCharacter("hobin-v1");
			const animationSet = await assetManager.loadAnimationSet("combat-v1");

			return {
				playerRoot: character.root,
				meshes: [...environment.meshes, ...character.meshes],
				animationSet,
				animationGroups: character.animationGroups,
			};
		} catch (error) {
			console.warn("[Assets] Seed asset load failed, using fallback arena.", error);
			return createFallbackSlice(scene);
		}
	}

	function setupPlayerSystems(
		engine: Engine,
		scene: Scene,
		playerRoot: TransformNode,
		animationSet: GameAnimationSet,
	): void {
		const hobinData = createHobinData();
		const controller = new FighterController(playerRoot, scene, playerRoot);
		controller.setAnimationDurations(toAnimationDurations(animationSet));
		controller.setAnimationGroups(toCombatAnimationMap(animationSet, playerRoot, scene));

		controllerRef.current = controller;
		combatSystemRef.current = new CombatSystem(hobinData, scene);
		combatSystemRef.current.onStateChange = (state) => setCombatState(state);
		combatSystemRef.current.onMoveExecuted = (animationName, durationMs) => {
			controller.playActionAnimation(animationName, durationMs);
			setPlayerStamina(hobinData.currentStamina);
		};
		combatSystemRef.current.onHitTaken = () => {
			setPlayerHp(hobinData.currentHp);
			controller.playActionAnimation("hit_react", 420);
		};

		let staminaUiTimer = 0;
		staminaObserverRef.current = scene.onBeforeRenderObservable.add(() => {
			const deltaTime = engine.getDeltaTime() / 1000;
			staminaUiTimer += deltaTime;

			if (hobinData.currentHp > 0 && hobinData.currentStamina < hobinData.stats.maxStamina) {
				hobinData.currentStamina = Math.min(
					hobinData.stats.maxStamina,
					hobinData.currentStamina + 15 * deltaTime,
				);
			}

			if (staminaUiTimer >= 0.1) {
				setPlayerStamina(hobinData.currentStamina);
				staminaUiTimer = 0;
			}
		});
	}

	function createHobinData(): FighterState {
		return {
			id: "hobin",
			name: "Yoo Hobin",
			style: "SamdakStyle",
			stats: { strength: 12, speed: 15, toughness: 8, maxHp: 100, maxStamina: 100 },
			currentHp: 100,
			currentStamina: 100,
			activeMoves: [
				{ id: "kick", name: "Đá Bắp Chân (Calf Kick)", description: "Đòn đá nhanh vào bắp chân đối thủ", type: "Strike", damage: 15, staminaCost: 20, cooldownMs: 800, animationName: "calf_kick" },
				{ id: "dodge", name: "Né Trượt (Dodge)", description: "Lách người né đòn thẳng", type: "Dodge", damage: 0, staminaCost: 10, cooldownMs: 500, animationName: "dodge" },
				{ id: "counter", name: "Counter Sprawl", description: "Đè hông vật ngã đối phương", type: "Counter", damage: 30, staminaCost: 30, cooldownMs: 1200, animationName: "sprawl_counter", counterableMoveIds: ["pakgo_tackle", "taehoon_high_kick"] },
			],
			isNpc: false,
		};
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

function setupLights(scene: Scene): void {
	const sun = new DirectionalLight("schoolAlleySun", new Vector3(-0.45, -0.85, -0.3), scene);
	sun.position.set(6, 9, 4);
	sun.intensity = 1.25;

	const fill = new HemisphericLight("schoolAlleyFill", new Vector3(0, 1, 0), scene);
	fill.intensity = 0.45;
	fill.groundColor.set(0.08, 0.08, 0.1);
}

function setupCamera(scene: Scene, target: TransformNode): void {
	const camera = new ArcRotateCamera(
		"streetFightCamera",
		-Math.PI / 2.35,
		Math.PI / 3.05,
		8.5,
		new Vector3(0, 1.35, 0),
		scene,
	);

	camera.lockedTarget = target;
	camera.lowerRadiusLimit = 5.5;
	camera.upperRadiusLimit = 11;
	camera.wheelPrecision = 40;
	camera.panningSensibility = 0;
	scene.activeCamera = camera;
}

function createFallbackSlice(scene: Scene): VerticalSliceAssets {
	const playerRoot = new TransformNode("hobin_player", scene);
	const ground = MeshBuilder.CreateGround("fallback_school_alley", { width: 24, height: 18 }, scene);
	const player = MeshBuilder.CreateBox("fallback_student", { height: 1.8, width: 0.7, depth: 0.45 }, scene);
	const wallA = MeshBuilder.CreateBox("fallback_school_wall", { width: 1, height: 4, depth: 12 }, scene);
	const wallB = MeshBuilder.CreateBox("fallback_alley_wall", { width: 16, height: 3, depth: 0.3 }, scene);

	player.parent = playerRoot;
	player.position.set(0, 0.9, 0);
	wallA.position.set(-6, 2, 0);
	wallB.position.set(1, 1.5, -6);

	return {
		playerRoot,
		meshes: [ground, player, wallA, wallB],
		animationSet: { id: "fallback-combat", clips: {} },
		animationGroups: [],
	};
}

function toAnimationDurations(animationSet: GameAnimationSet): Record<string, number> {
	return Object.entries(animationSet.clips).reduce<Record<string, number>>((durations, [name, clip]) => {
		durations[name] = clip.durationMs;
		return durations;
	}, {});
}

function toCombatAnimationMap(
	animationSet: GameAnimationSet,
	playerRoot: TransformNode,
	scene: Scene,
): Record<string, AnimationGroup> {
	const groups = scene.animationGroups.filter((group) => {
		return group.targetedAnimations.some((targetedAnimation) => {
			let node = targetedAnimation.target as TransformNode | null;

			while (node) {
				if (node === playerRoot) {
					return true;
				}

				node = node.parent as TransformNode | null;
			}

			return false;
		});
	});
	const byName = new Map(groups.map((group) => [group.name, group]));

	return {
		idle: byName.get("idle") ?? byName.get("static")!,
		run: byName.get("sprint") ?? byName.get("walk")!,
		calf_kick: byName.get("attack-kick-right") ?? byName.get("attack-kick-left")!,
		dodge: byName.get("emote-no") ?? byName.get("walk")!,
		sprawl_counter: byName.get("attack-melee-right") ?? byName.get("attack-melee-left")!,
		hit_react: byName.get("emote-no") ?? byName.get("idle")!,
		...Object.fromEntries(
			Object.keys(animationSet.clips)
				.map((name) => [name, byName.get(name)])
				.filter((entry): entry is [string, AnimationGroup] => Boolean(entry[1])),
		),
	};
}
