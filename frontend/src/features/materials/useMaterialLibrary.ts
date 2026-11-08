import { useState } from "react";
import {
  createMaterial,
  createMaterialId,
  removeMaterial,
  updateMaterial,
  type Material,
  type MaterialDraft,
} from "../../domain/material";
import {
  loadMaterials,
  saveMaterials,
  type StorageAdapter,
} from "../../infrastructure/materialStorage";

export interface MaterialLibraryState {
  materials: Material[];
  storageWarning?: string;
  addMaterial(draft: MaterialDraft): void;
  editMaterial(materialId: string, draft: MaterialDraft): void;
  deleteMaterial(materialId: string, usageCount?: number): "REMOVED" | "MATERIAL_IN_USE" | "MATERIAL_NOT_FOUND";
  replaceMaterials(materials: readonly Material[]): void;
}

export function useMaterialLibrary(
  storage: StorageAdapter = window.localStorage,
): MaterialLibraryState {
  const [initialLoad] = useState(() => loadMaterials(storage));
  const [materials, setMaterials] = useState<Material[]>(initialLoad.materials);
  const [storageWarning, setStorageWarning] = useState<string | undefined>(initialLoad.warning);

  function commit(nextMaterials: Material[]): void {
    setMaterials(nextMaterials);
    const saveResult = saveMaterials(storage, nextMaterials);
    setStorageWarning(saveResult.saved ? undefined : saveResult.warning);
  }

  function addMaterial(draft: MaterialDraft): void {
    const id = createMaterialId(new Set(materials.map((material) => material.id)));
    commit([...materials, createMaterial(draft, id)]);
  }

  function editMaterial(materialId: string, draft: MaterialDraft): void {
    const existing = materials.find((material) => material.id === materialId);
    if (!existing) {
      return;
    }
    commit(
      materials.map((material) =>
        material.id === materialId ? updateMaterial(material, draft) : material,
      ),
    );
  }

  function deleteMaterial(
    materialId: string,
    usageCount = 0,
  ): "REMOVED" | "MATERIAL_IN_USE" | "MATERIAL_NOT_FOUND" {
    const result = removeMaterial(materials, materialId, usageCount);
    if (!result.removed) {
      return result.reason;
    }
    commit(result.materials);
    return "REMOVED";
  }

  function replaceMaterials(nextMaterials: readonly Material[]): void {
    commit(nextMaterials.map((material) => ({ ...material })));
  }

  return { materials, storageWarning, addMaterial, editMaterial, deleteMaterial, replaceMaterials };
}

