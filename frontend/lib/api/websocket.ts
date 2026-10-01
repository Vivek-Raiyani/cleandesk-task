export const getWsUrl = (endpoint: string): string => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return `${process.env.NEXT_PUBLIC_WS_URL}${endpoint}`;
  }
  
  // If no explicit WS URL, try to derive it from the API URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
  const wsUrl = apiUrl.replace(/^http/, 'ws');
  return `${wsUrl}${endpoint}`;
};

export const createWebSocket = (endpoint: string): WebSocket => {
  return new WebSocket(getWsUrl(endpoint));
};
