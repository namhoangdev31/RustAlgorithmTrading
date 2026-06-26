import { Scene } from "@babylonjs/core/scene";
import { SceneLoader } from "@babylonjs/core/Loading/sceneLoader";
import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Material } from "@babylonjs/core/Materials/material";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { AnimationGroup } from "@babylonjs/core/Animations/animationGroup";

import "@babylonjs/loaders/glTF";

export type GameAssetKind = "environment" | "character" | "animation" | "vfx" | "prop";

export interface GameAssetEntry {
  id: string;
  kind: GameAssetKind;
  url: string;
  license: "CC0";
  sourceUrl: string;
  tags: string[];
  scale: number;
  position?: Vec3;
  rotation?: Vec3;
}

export interface GameAssetManifest {
  version: number;
  assets: GameAssetEntry[];
}

export interface LoadedGameAsset {
  entry: GameAssetEntry;
  root: TransformNode;
  meshes: AbstractMesh[];
  animationGroups: AnimationGroup[];
}

export interface GameAnimationClip {
  durationMs: number;
  motion: string;
}

export interface GameAnimationSet {
  id: string;
  clips: Record<string, GameAnimationClip>;
}

type Vec3 = [number, number, number];
type PrefabShape = "box" | "cylinder";

interface PrefabPrimitive {
  name: string;
  shape: PrefabShape;
  material: string;
  position: Vec3;
  scaling: Vec3;
  rotation?: Vec3;
}

interface PrefabModel {
  name: string;
  url: string;
  position?: Vec3;
  scaling?: Vec3;
  rotation?: Vec3;
}

interface PrefabFile {
  name: string;
  kind: GameAssetKind;
  materials?: Record<string, Vec3>;
  models?: PrefabModel[];
  primitives?: PrefabPrimitive[];
  clips?: Record<string, GameAnimationClip>;
}

export class GameAssetManager {
  private manifest: GameAssetManifest | null = null;
  private roots: TransformNode[] = [];
  private materials: Material[] = [];

  constructor(private readonly scene: Scene) {}

  public async loadManifest(url = "/game-assets/assets.manifest.json"): Promise<GameAssetManifest> {
    if (this.manifest) {
      return this.manifest;
    }

    const manifest = await this.loadJson<GameAssetManifest>(url);
    manifest.assets.forEach((entry) => this.assertCc0(entry));
    this.manifest = manifest;
    return manifest;
  }

  public async loadEnvironment(id: string): Promise<LoadedGameAsset> {
    const entry = await this.getEntry(id, "environment");
    return this.loadSceneAsset(entry, id);
  }

  public async loadCharacter(id: string): Promise<LoadedGameAsset> {
    const entry = await this.getEntry(id, "character");
    return this.loadSceneAsset(entry, "hobin_player");
  }

  public async loadAnimationSet(id: string): Promise<GameAnimationSet> {
    const entry = await this.getEntry(id, "animation");
    const prefab = await this.loadJson<PrefabFile>(entry.url);
    return { id: entry.id, clips: prefab.clips ?? {} };
  }

  public dispose(): void {
    this.roots.forEach((root) => root.dispose(false, true));
    this.materials.forEach((material) => material.dispose(true, true));
    this.roots = [];
    this.materials = [];
    this.manifest = null;
  }

  private async getEntry(id: string, kind: GameAssetKind): Promise<GameAssetEntry> {
    const manifest = await this.loadManifest();
    const entry = manifest.assets.find((item) => item.id === id && item.kind === kind);

    if (!entry) {
      throw new Error(`Missing ${kind} asset "${id}" in assets manifest.`);
    }

    this.assertCc0(entry);
    return entry;
  }

  private async loadSceneAsset(entry: GameAssetEntry, rootName: string): Promise<LoadedGameAsset> {
    if (entry.url.endsWith(".json")) {
      return this.loadPrefab(entry, rootName);
    }

    return this.loadImportedAsset(entry, rootName);
  }

  private async loadPrefab(entry: GameAssetEntry, rootName: string): Promise<LoadedGameAsset> {
    const prefab = await this.loadJson<PrefabFile>(entry.url);
    const root = new TransformNode(rootName, this.scene);
    const materialMap = this.createMaterials(entry.id, prefab.materials ?? {});
    const modelMeshes = await this.loadPrefabModels(root, prefab.models ?? []);
    const meshes = (prefab.primitives ?? []).map((primitive) => {
      const mesh = this.createPrimitive(entry.id, primitive);
      mesh.material = materialMap.get(primitive.material) ?? null;
      mesh.parent = root;
      this.applyTransform(mesh, primitive);
      return mesh;
    });

    this.applyEntryTransform(root, entry);
    this.roots.push(root);
    return { entry, root, meshes: [...modelMeshes, ...meshes], animationGroups: [] };
  }

  private async loadImportedAsset(entry: GameAssetEntry, rootName: string): Promise<LoadedGameAsset> {
    const { rootUrl, fileName } = this.splitAssetUrl(entry.url);
    const result = await SceneLoader.ImportMeshAsync("", rootUrl, fileName, this.scene);
    const root = new TransformNode(rootName, this.scene);

    result.transformNodes.forEach((node) => {
      if (!node.parent) {
        node.parent = root;
      }
    });

    result.meshes.forEach((mesh) => {
      if (!mesh.parent) {
        mesh.parent = root;
      }
    });

    this.applyEntryTransform(root, entry);
    this.roots.push(root);
    return { entry, root, meshes: result.meshes, animationGroups: result.animationGroups };
  }

  private async loadPrefabModels(root: TransformNode, models: PrefabModel[]): Promise<AbstractMesh[]> {
    const imported = await Promise.all(models.map(async (model) => {
      const { rootUrl, fileName } = this.splitAssetUrl(model.url);
      const result = await SceneLoader.ImportMeshAsync("", rootUrl, fileName, this.scene);
      const modelRoot = new TransformNode(model.name, this.scene);
      modelRoot.parent = root;

      this.applyOptionalTransform(modelRoot, model.position, model.scaling, model.rotation);

      result.transformNodes.forEach((node) => {
        if (!node.parent) {
          node.parent = modelRoot;
        }
      });

      result.meshes.forEach((mesh) => {
        if (!mesh.parent) {
          mesh.parent = modelRoot;
        }
      });

      return result.meshes;
    }));

    return imported.flat();
  }

  private createMaterials(scope: string, materials: Record<string, Vec3>): Map<string, Material> {
    const materialMap = new Map<string, Material>();

    Object.entries(materials).forEach(([name, color]) => {
      const material = new StandardMaterial(`${scope}-${name}`, this.scene);
      material.diffuseColor = Color3.FromArray(color);
      material.specularColor.set(0, 0, 0);
      material.emissiveColor = material.diffuseColor.scale(0.08);
      this.materials.push(material);
      materialMap.set(name, material);
    });

    return materialMap;
  }

  private createPrimitive(scope: string, primitive: PrefabPrimitive): AbstractMesh {
    if (primitive.shape === "cylinder") {
      return MeshBuilder.CreateCylinder(`${scope}-${primitive.name}`, {
        diameter: 1,
        height: 1,
        tessellation: 8,
      }, this.scene);
    }

    return MeshBuilder.CreateBox(`${scope}-${primitive.name}`, { size: 1 }, this.scene);
  }

  private applyTransform(mesh: AbstractMesh, primitive: PrefabPrimitive): void {
    mesh.position.set(primitive.position[0], primitive.position[1], primitive.position[2]);
    mesh.scaling.set(primitive.scaling[0], primitive.scaling[1], primitive.scaling[2]);

    if (primitive.rotation) {
      mesh.rotation.set(primitive.rotation[0], primitive.rotation[1], primitive.rotation[2]);
    }
  }

  private applyEntryTransform(root: TransformNode, entry: GameAssetEntry): void {
    root.scaling.setAll(entry.scale);

    if (entry.position) {
      root.position.set(entry.position[0], entry.position[1], entry.position[2]);
    }

    if (entry.rotation) {
      root.rotation.set(entry.rotation[0], entry.rotation[1], entry.rotation[2]);
    }
  }

  private async loadJson<T>(url: string): Promise<T> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Unable to load ${url}: ${response.status}`);
    }

    return response.json() as Promise<T>;
  }

  private assertCc0(entry: GameAssetEntry): void {
    if (entry.license !== "CC0") {
      throw new Error(`Asset "${entry.id}" is not allowed because its license is ${entry.license}.`);
    }
  }

  private splitAssetUrl(url: string): { rootUrl: string; fileName: string } {
    const slashIndex = url.lastIndexOf("/") + 1;
    return {
      rootUrl: url.slice(0, slashIndex),
      fileName: url.slice(slashIndex),
    };
  }

  private applyOptionalTransform(root: TransformNode, position?: Vec3, scaling?: Vec3, rotation?: Vec3): void {
    if (position) {
      root.position.set(position[0], position[1], position[2]);
    }

    if (scaling) {
      root.scaling.set(scaling[0], scaling[1], scaling[2]);
    }

    if (rotation) {
      root.rotation.set(rotation[0], rotation[1], rotation[2]);
    }
  }
}
