// api.js — Sutradhar API client for React Native
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://sutradhar-api-production.up.railway.app';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

export const askQuestion = async ({ question, scripture = 'ramayana', storyteller = 'valmiki', language = 'English' }) => {
  const res = await api.post('/ask', { question, scripture, storyteller, language });
  return res.data;
};

export const askByVoice = async ({ audioUri, scripture = 'ramayana', storyteller = 'valmiki', language = 'English' }) => {
  const formData = new FormData();
  formData.append('audio', {
    uri:  audioUri,
    name: 'audio.wav',
    type: 'audio/wav',
  });
  formData.append('scripture',   scripture);
  formData.append('storyteller', storyteller);
  formData.append('language',    language);

  const res = await api.post('/ask/voice', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const textToSpeech = async ({ text, language = 'English' }) => {
  const res = await api.post('/tts', { text, language });
  return res.data; // { audio_base64, format }
};

export const getHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export default api;