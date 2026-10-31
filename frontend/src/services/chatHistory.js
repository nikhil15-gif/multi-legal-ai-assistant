const STORAGE_KEY = 'legalsaathi_chat_history_v1';
const MAX_CONVERSATIONS = 50;
const MAX_MESSAGES_PER_CONVERSATION = 100;

export function createChatId() {
  return globalThis.crypto?.randomUUID?.()
    || `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function loadChatHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const conversations = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(conversations)) return [];
    return conversations
      .filter((conversation) => (
        conversation
        && typeof conversation.id === 'string'
        && Array.isArray(conversation.messages)
        && conversation.messages.every((message) => (
          message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string'
        ))
      ))
      .map((conversation) => ({
        ...conversation,
        messages: conversation.messages.filter((message) => (
          !(message.role === 'assistant' && message.modelUsed === 'Error Handler')
        ))
      }))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, MAX_CONVERSATIONS);
  } catch {
    return [];
  }
}

export function saveChatHistory(conversations) {
  const bounded = conversations.slice(0, MAX_CONVERSATIONS).map((conversation) => ({
    ...conversation,
    messages: conversation.messages.slice(-MAX_MESSAGES_PER_CONVERSATION)
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bounded));
}
