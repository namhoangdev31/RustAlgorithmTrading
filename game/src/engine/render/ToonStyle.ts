import { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { Material } from "@babylonjs/core/Materials/material";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Scene } from "@babylonjs/core/scene";

import "@babylonjs/core/Rendering/edgesRenderer";

const EDGE_COLOR = new Color4(0.02, 0.02, 0.025, 1);
const DEFAULT_DIFFUSE = new Color3(0.82, 0.78, 0.68);
const NO_SPECULAR = new Color3(0, 0, 0);

export interface ToonStyleHandle {
  dispose(): void;
}

export function applyToonStyle(
  scene: Scene,
  meshes: AbstractMesh[],
  edgeWidth = 2.1,
): ToonStyleHandle {
  const createdMaterials: Material[] = [];

  meshes.forEach((mesh) => {
    if (mesh.getTotalVertices() === 0) {
      return;
    }

    prepareMaterial(scene, mesh, createdMaterials);
    mesh.enableEdgesRendering(0.65, false);
    mesh.edgesWidth = edgeWidth;
    mesh.edgesColor = EDGE_COLOR;
  });

  return {
    dispose() {
      meshes.forEach((mesh) => mesh.disableEdgesRendering());
      createdMaterials.forEach((material) => material.dispose(true, true));
    },
  };
}

function prepareMaterial(scene: Scene, mesh: AbstractMesh, createdMaterials: Material[]): void {
  if (mesh.material instanceof StandardMaterial) {
    mesh.material.specularColor.copyFrom(NO_SPECULAR);
    mesh.material.emissiveColor = mesh.material.diffuseColor.scale(0.06);
    return;
  }

  if (mesh.material) {
    return;
  }

  const material = new StandardMaterial(`${mesh.name}-toon`, scene);
  material.diffuseColor.copyFrom(DEFAULT_DIFFUSE);
  material.specularColor.copyFrom(NO_SPECULAR);
  material.emissiveColor = DEFAULT_DIFFUSE.scale(0.06);
  mesh.material = material;
  createdMaterials.push(material);
}
