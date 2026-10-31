/**
 * API Service for communicating with LegalSaathi AI backend.
 */

const API_BASE = '/api';

export async function sendChatMessage(query, language = 'auto', history = []) {
  const response = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, language, history, auto_detect: language === 'auto' })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Server error: ${response.status}`);
  }
  return response.json();
}

export async function transcribeAudioRecording(audioBlob, language = 'auto') {
  const formData = new FormData();
  const extension = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
  formData.append('file', audioBlob, `voice-question.${extension}`);

  const response = await fetch(`${API_BASE}/speech/transcribe?language=${encodeURIComponent(language)}`, {
    method: 'POST',
    body: formData
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || 'Local voice recognition failed. Please try again or type your question.');
  }
  return data;
}

export async function fetchAiStatus() {
  const response = await fetch(`${API_BASE}/ai/status`);
  if (!response.ok) throw new Error('Failed to fetch AI provider status');
  return response.json();
}

export async function fetchHealth() {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error('Backend health check failed');
  return response.json();
}

export async function fetchLegalCategories() {
  const response = await fetch(`${API_BASE}/legal/categories`);
  if (!response.ok) throw new Error('Failed to fetch legal categories');
  return response.json();
}

export async function searchLegalKnowledge(query = '', category = '') {
  const params = new URLSearchParams();
  if (query) params.append('q', query);
  if (category) params.append('category', category);
  const response = await fetch(`${API_BASE}/legal/search?${params.toString()}`);
  if (!response.ok) throw new Error('Legal search failed');
  return response.json();
}

export async function fetchLegalProvision(documentId) {
  const response = await fetch(`${API_BASE}/legal/provisions/${documentId}`);
  if (!response.ok) throw new Error('Failed to fetch legal provision');
  return response.json();
}

export async function fetchEmergencyContacts() {
  const response = await fetch(`${API_BASE}/emergency/contacts`);
  if (!response.ok) throw new Error('Failed to fetch emergency contacts');
  return response.json();
}

export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    body: formData
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to upload document');
  }
  return response.json();
}

export async function askDocument(docId, question, language = 'en') {
  const response = await fetch(`${API_BASE}/documents/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc_id: docId, question, language })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to query document');
  }
  return response.json();
}

export async function summarizeDocument(docId, language = 'en') {
  const response = await fetch(`${API_BASE}/documents/summarize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ doc_id: docId, language })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to summarize document');
  }
  return response.json();
}

export async function deleteDocument(docId) {
  const response = await fetch(`${API_BASE}/documents/${docId}`, {
    method: 'DELETE'
  });
  return response.json();
}
