
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { createOpenAI } from '@ai-sdk/openai'
import { LanguageModel } from 'ai'

// Types
interface ModelConfig {
	apiKey: string
	modelId: string
}


// Constants
const DEFAULT_MODELS = {
	GOOGLE: 'gemini-1.5-flash',
	OPENAI: 'gpt-4o'
} as const

const MODEL_PREFIXES = {
	OPENAI: 'sk',
	GOOGLE: 'AI'
} as const

// Model Creation Functions
export const getAiModel = (apiKey: string, modelId: string = DEFAULT_MODELS.GOOGLE): LanguageModel | null => {
	if (!apiKey) {
		return null
	}

	if (isOpenAIKey(apiKey)) {
		return createOpenAIModel({ apiKey, modelId })
	}

	if (isGoogleKey(apiKey)) {
		return createGoogleModel({ apiKey, modelId })
	}

	return null
}

const isOpenAIKey = (apiKey: string): boolean => {
	return apiKey.startsWith(MODEL_PREFIXES.OPENAI)
}

const isGoogleKey = (apiKey: string): boolean => {
	return apiKey.startsWith(MODEL_PREFIXES.GOOGLE)
}

const createOpenAIModel = ({ apiKey, modelId }: ModelConfig): LanguageModel => {
	const openai = createOpenAI({ apiKey })
	return openai(modelId)
}

const createGoogleModel = ({ apiKey, modelId }: ModelConfig): LanguageModel => {
	const google = createGoogleGenerativeAI({ apiKey })
	return google(modelId)
}
