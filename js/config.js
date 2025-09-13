/**
 * Configuration module for WhatsApp Admin Panel
 * Contains all constants, API endpoints, and configuration settings
 */

const CONFIG = {
  // API Configuration
  API_BASE: 'https://broadcast-system-d7ca773e62c8.herokuapp.com',
  
  // API Endpoints
  ENDPOINTS: {
    GET_ALL_CONVERSATIONS: '/m/get/all',
    GET_CONVERSATION_INFO: '/m/get/info',
    SEND_INTERVENTION: '/m/send/to/single/number'
  },
  
  // Message Types Mapping
  MESSAGE_TYPES: {
    1: { from: 'bot', label: '🤖 Bot', color: 'out' },      // Generated template message
    2: { from: 'them', label: '👤 Client', color: 'in' },   // Client answers
    3: { from: 'bot', label: '🤖 AI', color: 'out' },       // AI responses
    4: { from: 'admin', label: '👨‍💼 Admin', color: 'out' }  // Admin intervention
  },
  
  // Socket.IO Events
  SOCKET_EVENTS: {
    CONNECT: 'connect',
    DISCONNECT: 'disconnect',
    NEW_MESSAGE: 'recibedMessage',
    AI_MESSAGE: 'IAsendMessage',
    MESSAGE_SENT: 'sendMessage',
    CONVERSATION_UPDATED: 'conversation_updated',
    USER_TYPING: 'user_typing'
  },
  
  // UI Configuration
  UI: {
    MESSAGE_MAX_WIDTH: '70%',
    TOAST_DURATION: 1600,
    REFRESH_INTERVAL: 30000, // 30 seconds
    CONNECTION_RETRY_DELAY: 5000 // 5 seconds
  },
  
  // Default Tags
  DEFAULT_TAGS: ['lead', 'fx'],
  
  // Quick Reply Templates
  QUICK_REPLIES: [
    "Hey, it's Hans from TradeTab. Please keep this number private. All good with your trading?",
    "Glad you replied — join the Telegram for neutral market commentary: https://t.me/tradetabofficial",
    "Got it. If you prefer no more messages, reply STOP and we'll unsubscribe you."
  ]
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
} else {
  window.CONFIG = CONFIG;
}
