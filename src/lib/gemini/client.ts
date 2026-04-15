import { GoogleGenerativeAI } from '@google/generative-ai'

// 실제 모델명은 Google AI Studio에서 확인 후 교체
const MODEL_NAME = 'gemini-2.5-flash-preview-04-17'

export function getGeminiModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
  return genAI.getGenerativeModel({ model: MODEL_NAME })
}
