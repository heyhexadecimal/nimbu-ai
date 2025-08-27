export interface APIKeys {
  openai?: {
    key: string
  }
  gemini?: {
    key: string
  }
}

const API_KEYS_STORAGE_KEY = 'nimbu-ai-api-keyss'

export function getAPIKeys(): APIKeys {
  if (typeof window === 'undefined') return {}

  try {
    const stored = localStorage.getItem(API_KEYS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('Error reading API keys from localStorage:', error)
    return {}
  }
}

export function setAPIKeys(keys: APIKeys): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys))
  } catch (error) {
    console.error('Error saving API keys to localStorage:', error)
  }
}

export function hasValidAPIKey(): boolean {
  const keys = getAPIKeys()
  return !!(keys.openai?.key || keys.gemini?.key)
}

export function getOpenAIKey(): string | undefined {
  return getAPIKeys().openai?.key
}

export function getGeminiKey(): string | undefined {
  return getAPIKeys().gemini?.key
}

// These functions are no longer needed since we don't store models
// The application will automatically use the best available models
export function getOpenAIModel(): string {
  return 'gpt-4o' // Default to best available model
}

export function getGeminiModel(): string {
  return 'gemini-1.5-flash' // Default to best available model
} 