import { cloneInitialMaterials, isMaterial, type Material } from "../domain/material";

export const MATERIAL_STORAGE_KEY = "ai-boncuk-tasarim.materials.v1";
export const MATERIAL_STORAGE_SCHEMA_VERSION = "1.0";

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface MaterialStoragePayload {
  schemaVersion: typeof MATERIAL_STORAGE_SCHEMA_VERSION;
  materials: Material[];
}

export interface MaterialLoadResult {
  materials: Material[];
  warning?: string;
}

export type MaterialSaveResult =
  | { saved: true }
  | { saved: false; warning: string };

function fallbackWithWarning(warning: string): MaterialLoadResult {
  return { materials: cloneInitialMaterials(), warning };
}

export function loadMaterials(storage: StorageAdapter): MaterialLoadResult {
  let raw: string | null;
  try {
    raw = storage.getItem(MATERIAL_STORAGE_KEY);
  } catch {
    return fallbackWithWarning("Yerel malzeme kaydına erişilemedi; başlangıç kataloğu kullanılıyor.");
  }

  if (raw === null) {
    return { materials: cloneInitialMaterials() };
  }

  try {
    const payload = JSON.parse(raw) as Partial<MaterialStoragePayload>;
    if (payload.schemaVersion !== MATERIAL_STORAGE_SCHEMA_VERSION || !Array.isArray(payload.materials)) {
      return fallbackWithWarning("Yerel malzeme kaydı tanınmadı; başlangıç kataloğu kullanılıyor.");
    }

    const seenIds = new Set<string>();
    const validMaterials = payload.materials.filter((material): material is Material => {
      if (!isMaterial(material) || seenIds.has(material.id)) {
        return false;
      }
      seenIds.add(material.id);
      return true;
    });

    if (validMaterials.length !== payload.materials.length) {
      if (validMaterials.length === 0 && payload.materials.length > 0) {
        return fallbackWithWarning("Geçersiz yerel kayıtlar atlandı; başlangıç kataloğu kullanılıyor.");
      }
      return {
        materials: validMaterials.map((material) => ({ ...material })),
        warning: "Geçersiz veya yinelenen yerel malzeme kayıtları güvenli biçimde atlandı.",
      };
    }

    return { materials: validMaterials.map((material) => ({ ...material })) };
  } catch {
    return fallbackWithWarning("Bozuk yerel malzeme kaydı açılamadı; başlangıç kataloğu kullanılıyor.");
  }
}

export function saveMaterials(storage: StorageAdapter, materials: readonly Material[]): MaterialSaveResult {
  const ids = new Set<string>();
  for (const material of materials) {
    if (!isMaterial(material) || ids.has(material.id)) {
      return { saved: false, warning: "Geçersiz malzeme kataloğu yerel kayda yazılmadı." };
    }
    ids.add(material.id);
  }

  const payload: MaterialStoragePayload = {
    schemaVersion: MATERIAL_STORAGE_SCHEMA_VERSION,
    materials: materials.map((material) => ({ ...material })),
  };

  try {
    storage.setItem(MATERIAL_STORAGE_KEY, JSON.stringify(payload));
    return { saved: true };
  } catch {
    return {
      saved: false,
      warning: "Malzemeler tarayıcıya kaydedilemedi; değişiklikler yalnız bu oturumda korunacak.",
    };
  }
}

