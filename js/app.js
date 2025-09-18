/**
 * Main application controller for WhatsApp Admin Panel
 * Orchestrates all modules and handles application flow
 */

class WhatsAppAdminApp {
  constructor() {
    this.config = window.CONFIG;
    this.stateManager = new StateManager();
    this.apiService = new ApiService(this.config);
    this.socketService = null;
    this.uiManager = null;
    
    this.init();
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Initialize UI Manager
      this.uiManager = new UIManager(this.config, this.stateManager);
      
      // Setup state subscriptions
      this.setupStateSubscriptions();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Initialize Socket.IO
      this.initializeSocket();
      
      // Load initial data
      await this.loadConversations();
      
      console.log('WhatsApp Admin Panel initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      this.uiManager?.showToast('Failed to initialize application');
    }
  }

  /**
   * Setup state change subscriptions
   */
  setupStateSubscriptions() {
    this.stateManager.subscribe((state) => {
      this.uiManager.renderConversationList();
      this.uiManager.renderConversationHeader();
      this.uiManager.renderConversationThread();
    });
  }

  /**
   * Setup custom event listeners
   */
  setupEventListeners() {
    // Refresh conversations
    document.addEventListener('refresh', () => {
      this.loadConversations();
      this.uiManager.showToast('Refreshing conversations...');
    });

    // Select conversation
    document.addEventListener('selectConversation', (e) => {
      this.stateManager.setActiveConversation(e.detail);
    });

    // Toggle manual mode
    document.addEventListener('toggleManualMode', () => {
      const currentMode = this.stateManager.getState().isManualMode;
      this.stateManager.setManualMode(!currentMode);
      this.uiManager.showToast(currentMode ? 'Bot reactivated' : 'You have control');
    });

    // Send message
    document.addEventListener('sendMessage', async (e) => {
      await this.sendMessage(e.detail);
    });

    // Save note
    document.addEventListener('saveNote', () => {
      this.uiManager.showToast('Note saved');
    });
  }

  /**
   * Initialize Socket.IO service
   */
  initializeSocket() {
    this.socketService = new SocketService(this.config, {
      onConnect: () => {
        this.uiManager.updateConnectionStatus(true);
        this.uiManager.showToast('Connected to real-time updates');
      },
      
      onDisconnect: () => {
        this.uiManager.updateConnectionStatus(false);
        this.uiManager.showToast('Disconnected from real-time updates');
      },
      
      onNewMessage: (data) => {
        this.handleNewMessage(data);
      },
      
      onAIMessage: (data) => {
        this.handleNewMessage(data);
      },
      
      onMessageSent: (data) => {
        this.uiManager.showToast('Message sent successfully');
      },
      
      onConversationUpdated: (data) => {
        this.loadConversations();
      },
      
      onUserTyping: (data) => {
        console.log('User typing:', data);
        const conversation = this.stateManager.findConversationByNumber(data.number);
        if (conversation && conversation.id === this.stateManager.getState().activeConversationId) {
          this.uiManager.showTypingIndicator(conversation.name);
          // Hide typing indicator after 3 seconds of inactivity
          clearTimeout(this.typingTimeout);
          this.typingTimeout = setTimeout(() => {
            this.uiManager.hideTypingIndicator();
          }, 3000);
        }
      },
      
      onError: (error) => {
        console.error('Socket error:', error);
        this.uiManager.showToast('Connection error occurred');
      }
    });

    this.socketService.init();
  }

  /**
   * Load conversations from API
   */
  async loadConversations() {
    console.log('Loading conversations...');
    this.stateManager.setLoading(true);
    
    try {
      const result = await this.apiService.fetchConversations();
      console.log('API result:', result);
      
      if (result.success) {
        console.log('Setting conversations:', result.data);
        this.stateManager.setConversations(result.data);
        
        // Set first conversation as active if none selected
        if (result.data.length > 0 && !this.stateManager.getState().activeConversationId) {
          this.stateManager.setActiveConversation(result.data[0].id);
        }
      } else {
        console.error('API error:', result.error);
        this.uiManager.showToast(result.error);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      this.uiManager.showToast('Failed to load conversations');
    } finally {
      this.stateManager.setLoading(false);
    }
  }

  /**
   * Handle new message from Socket.IO
   * @param {Object} data - Message data
   */
  async handleNewMessage(data) {
    const { number, message, typo } = data;
    
    // Find conversation by phone number
    // let conversation = this.stateManager.findConversationByNumber(number);
    
    let conversation = null;
    // console.log('conversation', conversation);
    if (!conversation) {
      // If conversation doesn't exist, fetch it from API
      // console.log(`Conversation not found for number ${number}, fetching from API...`);
      const result = await this.apiService.fetchConversationInfo(number);
      
      if (result.success) {
        // Map the conversation data and add it to state
        const conversationData = this.apiService.mapConversationData2(result.data, this.stateManager.getState().conversations.length);
        console.log('conversationData::::::::::::::::', conversationData);
        this.stateManager.updateConversation(conversationData);
        conversation = conversationData;
        console.log(`New conversation added: ${conversation.name}`);
      } else {
        console.error('Failed to fetch conversation info:', result.error);
        this.uiManager.showToast('Failed to load conversation info');
        return;
      }
    }
    
    if (conversation) {
      // Map the message data properly
      const messageData = this.apiService.mapMessageData({
        id: Date.now(), // Temporary ID
        typo: typo,
        message: message
      });
      
      // Add message to conversation
      this.stateManager.addMessage(conversation.id, messageData);
      this.uiManager.showToast(`New message from ${conversation.name}`);
      
      // If this is the active conversation, add message with animation
      if (conversation.id === this.stateManager.getState().activeConversationId) {
        this.uiManager.addMessageWithAnimation(messageData);
      }
    }
  }

  /**
   * Send message to a conversation
   * @param {string} message - Message text
   */
  async sendMessage(message) {
    const conversation = this.stateManager.getActiveConversation();
    if (!conversation) return;

    try {
      const result = await this.apiService.sendIntervention(conversation.number, message);
      
      if (result.success) {
        // Add message to local state
        const messageData = this.apiService.mapMessageData({
          id: Date.now(),
          typo: 4, // Admin intervention
          message: message
        });
        
        this.stateManager.addMessage(conversation.id, messageData);
        
        // Add message with animation if it's the active conversation
        if (conversation.id === this.stateManager.getState().activeConversationId) {
          this.uiManager.addMessageWithAnimation(messageData);
        }
      } else {
        this.uiManager.showToast(result.error);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.uiManager.showToast('Failed to send message');
    }
  }

  /**
   * Get application state (for debugging)
   * @returns {Object} Current state
   */
  getState() {
    return this.stateManager.getState();
  }

  /**
   * Cleanup and destroy the application
   */
  destroy() {
    if (this.socketService) {
      this.socketService.disconnect();
    }
    
    this.stateManager.reset();
    console.log('Application destroyed');
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new WhatsAppAdminApp();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WhatsAppAdminApp;
} else {
  window.WhatsAppAdminApp = WhatsAppAdminApp;
}
