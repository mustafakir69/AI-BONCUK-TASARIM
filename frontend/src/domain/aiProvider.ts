import type { AiDesignPlan, AiDesignRequest } from "./aiDesign";
import type { Material } from "./material";
import type { Placement } from "./placement";

export type AiProviderId = "openai" | "9router";
export type AiProviderState = "ready" | "disabled" | "unconfigured" | "unavailable" | "unverified";

export interface AiProviderStatus {
  id?: AiProviderId;
  state: AiProviderState;
  providerName: string;
  message: string;
  backendReachable?: boolean;
  modelId?: string;
  reachable?: boolean;
  modelAvailable?: boolean;
  compatibilityVerified?: boolean;
  textSupported?: boolean;
  visionSupported?: boolean;
  structuredOutput?: "native-schema" | "validated-json";
  apiMode?: "responses" | "chat-completions";
}

export interface AiProviderUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface AiProviderResult {
  requestId: string;
  plan: unknown;
  usage?: AiProviderUsage;
}

export interface AiDesignProvider {
  readonly id: string;
  getStatus(signal?: AbortSignal): Promise<AiProviderStatus>;
  getStatuses?(signal?: AbortSignal): Promise<readonly AiProviderStatus[]>;
  requestPlan(
    request: AiDesignRequest,
    catalog: readonly Material[],
    referenceImage?: Blob,
    signal?: AbortSignal,
    providerId?: AiProviderId,
  ): Promise<AiProviderResult>;
}

export interface AiPlanPlacementGenerator {
  generate(
    plan: AiDesignPlan,
    request: AiDesignRequest,
    catalog: readonly Material[],
  ): Promise<readonly Placement[]>;
}

export const UNCONFIGURED_AI_STATUS = {
  id: "openai",
  state: "unconfigured",
  providerName: "AI sağlayıcısı",
  message: "AI bağlantısı henüz yapılandırılmadı.",
} satisfies AiProviderStatus;
