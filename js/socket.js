/**
 * Socket.IO module for WhatsApp Admin Panel
 * Handles real-time communication
 */

class SocketService {
  constructor(config, callbacks = {}) {
    this.config = config;
    this.socket = null;
    this.callbacks = {
      onConnect: callbacks.onConnect || (() => {}),
      onDisconnect: callbacks.onDisconnect || (() => {}),
      onNewMessage: callbacks.onNewMessage || (() => {}),
      onAIMessage: callbacks.onAIMessage || (() => {}),
      onMessageSent: callbacks.onMessageSent || (() => {}),
      onConversationUpdated: callbacks.onConversationUpdated || (() => {}),
      onUserTyping: callbacks.onUserTyping || (() => {}),
      onError: callbacks.onError || (() => {})
    };
    this.retryCount = 0;
    this.maxRetries = 5;
  }

  /**
   * Initialize Socket.IO connection
   */
  init() {
    try {
      this.socket = io(this.config.API_BASE);
      this.setupEventListeners();
    } catch (error) {
      console.error('Socket connection error:', error);
      this.callbacks.onError(error);
    }
  }

  /**
   * Setup all Socket.IO event listeners
   */
  setupEventListeners() {
    if (!this.socket) return;

    this.socket.on(this.config.SOCKET_EVENTS.CONNECT, () => {
      console.log('Connected to server');
      this.retryCount = 0;
      this.callbacks.onConnect();
    });

    this.socket.on(this.config.SOCKET_EVENTS.DISCONNECT, () => {
      console.log('Disconnected from server');
      this.callbacks.onDisconnect();
      this.handleReconnection();
    });

    this.socket.on(this.config.SOCKET_EVENTS.NEW_MESSAGE, (data) => {
      console.log('New message received:', data);
      this.callbacks.onNewMessage(data);
    });

    this.socket.on(this.config.SOCKET_EVENTS.AI_MESSAGE, (data) => {
      console.log('New message sent by AI:', data);
      this.callbacks.onAIMessage(data);
    });

    this.socket.on(this.config.SOCKET_EVENTS.MESSAGE_SENT, (data) => {
      console.log('Message sent successfully:', data);
      this.callbacks.onMessageSent(data);
    });

    this.socket.on(this.config.SOCKET_EVENTS.CONVERSATION_UPDATED, (data) => {
      console.log('Conversation updated:', data);
      this.callbacks.onConversationUpdated(data);
    });

    this.socket.on(this.config.SOCKET_EVENTS.USER_TYPING, (data) => {
      console.log('User typing:', data);
      this.callbacks.onUserTyping(data);
    });
  }

  /**
   * Handle reconnection logic
   */
  handleReconnection() {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`Attempting to reconnect... (${this.retryCount}/${this.maxRetries})`);
      
      setTimeout(() => {
        this.init();
      }, this.config.UI.CONNECTION_RETRY_DELAY);
    } else {
      console.error('Max reconnection attempts reached');
      this.callbacks.onError(new Error('Max reconnection attempts reached'));
    }
  }

  /**
   * Emit a message to the server
   * @param {string} event - Event name
   * @param {Object} data - Data to send
   */
  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, cannot emit event:', event);
    }
  }

  /**
   * Check if socket is connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.socket && this.socket.connected;
  }

  /**
   * Disconnect the socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Update callbacks
   * @param {Object} newCallbacks - New callback functions
   */
  updateCallbacks(newCallbacks) {
    this.callbacks = { ...this.callbacks, ...newCallbacks };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SocketService;
} else {
  window.SocketService = SocketService;
}
