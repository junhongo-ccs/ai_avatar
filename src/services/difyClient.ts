import type { DifyConfig } from '../types/config'

export type DifyChatRequest = {
  message: string
  conversationId?: string
}

export const sendMessageToDify = async (
  request: DifyChatRequest,
  config: DifyConfig,
): Promise<unknown> => {
  const response = await fetch(`${config.apiUrl.replace(/\/$/, '')}/chat-messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      inputs: {},
      query: request.message,
      response_mode: 'blocking',
      conversation_id: request.conversationId,
      user: config.userId,
    }),
  })

  if (!response.ok) {
    throw new Error(`Dify request failed: ${response.status}`)
  }

  return response.json()
}
