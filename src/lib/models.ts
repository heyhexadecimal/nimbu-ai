import { APIKeys } from './api-keys'

export interface ModelConfig {
  id: string
  name: string
  provider: keyof APIKeys
  disabled?: boolean
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    provider: "gemini"
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini"
  },

  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai"
  },
  {
    id: "gpt-5",
    name: "GPT-5",
    provider: "openai"
  },

]

export function getModelsForKeys(keys: APIKeys): ModelConfig[] {
  console.log('getModelsForKeys called with keys:', keys)
  const result = AVAILABLE_MODELS.map(model => ({
    ...model,
    disabled: !keys[model.provider]?.key
  }))
  console.log('getModelsForKeys result:', result)
  return result
}

export function getProviderForModel(modelId: string): keyof APIKeys | null {
  const model = AVAILABLE_MODELS.find(m => m.id === modelId)
  return model?.provider || null
} 