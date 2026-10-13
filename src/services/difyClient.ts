export type DifyChatRequest = {
  message: string
  conversationId?: string
}

// The server answers 503 when DIFY_API_URL / DIFY_API_KEY are not set.
export class DifyNotConfiguredError extends Error {
  constructor() {
    super('Dify is not configured on the server')
    this.name = 'DifyNotConfiguredError'
  }
}

// Calls the backend proxy instead of Dify directly, so the Dify API key
// stays on the server and never reaches the browser.
export const sendMessageToDify = async (request: DifyChatRequest): Promise<unknown> => {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: request.message,
      conversationId: request.conversationId,
    }),
  })

  if (response.status === 503) {
    throw new DifyNotConfiguredError()
  }

  if (!response.ok) {
    throw new Error(`Dify request failed: ${response.status}`)
  }

  return response.json()
}
