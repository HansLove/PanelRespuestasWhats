/**
 * State management module for WhatsApp Admin Panel
 * Handles application state and data management
 */

class StateManager {
  constructor() {
    this.state = {
      conversations: [],
      activeConversationId: null,
      isManualMode: false,
      isLoading: false,
      searchQuery: '',
      selectedFilter: 'all'
    };
    
    this.subscribers = [];
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback function to call on state changes
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of state changes
   */
  notify() {
    this.subscribers.forEach(callback => {
      try {
        callback(this.state);
      } catch (error) {
        console.error('Error in state subscriber:', error);
      }
    });
  }

  /**
   * Update state and notify subscribers
   * @param {Object} updates - State updates
   */
  setState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  /**
   * Get current state
   * @returns {Object} Current state
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Set conversations list
   * @param {Array} conversations - Array of conversations
   */
  setConversations(conversations) {
    this.setState({ conversations });
  }

  /**
   * Add or update a conversation
   * @param {Object} conversation - Conversation data
   */
  updateConversation(conversation) {
    const conversations = [...this.state.conversations];
    const index = conversations.findIndex(c => c.id === conversation.id);
    
    if (index > -1) {
      conversations[index] = { ...conversations[index], ...conversation };
    } else {
      conversations.push(conversation);
    }
    
    this.setState({ conversations });
  }

  /**
   * Add a message to a conversation
   * @param {string} conversationId - ID of the conversation
   * @param {Object} message - Message data
   */
  addMessage(conversationId, message) {
    const conversations = [...this.state.conversations];
    const conversation = conversations.find(c => c.id === conversationId);
    
    if (conversation) {
      conversation.messages = [...conversation.messages, message];
      this.setState({ conversations });
    }
  }

  /**
   * Set active conversation
   * @param {string} conversationId - ID of the conversation
   */
  setActiveConversation(conversationId) {
    this.setState({ activeConversationId: conversationId });
  }

  /**
   * Get active conversation
   * @returns {Object|null} Active conversation or null
   */
  getActiveConversation() {
    return this.state.conversations.find(c => c.id === this.state.activeConversationId) || null;
  }

  /**
   * Set manual mode
   * @param {boolean} isManual - Whether manual mode is enabled
   */
  setManualMode(isManual) {
    this.setState({ isManualMode: isManual });
  }

  /**
   * Set loading state
   * @param {boolean} isLoading - Whether loading
   */
  setLoading(isLoading) {
    this.setState({ isLoading });
  }

  /**
   * Set search query
   * @param {string} query - Search query
   */
  setSearchQuery(query) {
    this.setState({ searchQuery: query });
  }

  /**
   * Set selected filter
   * @param {string} filter - Filter type
   */
  setFilter(filter) {
    this.setState({ selectedFilter: filter });
  }

  /**
   * Get filtered conversations based on current search and filter
   * @returns {Array} Filtered conversations
   */
  getFilteredConversations() {
    let filtered = [...this.state.conversations];
    
    // Apply search filter
    if (this.state.searchQuery) {
      const query = this.state.searchQuery.toLowerCase();
      filtered = filtered.filter(conversation => {
        const matchesName = conversation.name.toLowerCase().includes(query);
        const matchesTags = conversation.tags.some(tag => tag.toLowerCase().includes(query));
        const matchesNumber = conversation.number && conversation.number.includes(query);
        return matchesName || matchesTags || matchesNumber;
      });
    }
    
    // Apply type filter
    switch (this.state.selectedFilter) {
      case 'unread':
        filtered = filtered.filter(conversation => conversation.unread > 0);
        break;
      case 'attention':
        filtered = filtered.filter(conversation => conversation.needsAttention);
        break;
      case 'all':
      default:
        // No additional filtering
        break;
    }
    
    return filtered;
  }

  /**
   * Find conversation by phone number
   * @param {string} phoneNumber - Phone number to search for
   * @returns {Object|null} Conversation or null
   */
  findConversationByNumber(phoneNumber) {
    return this.state.conversations.find(c => c.number === phoneNumber) || null;
  }

  /**
   * Reset state to initial values
   */
  reset() {
    this.state = {
      conversations: [],
      activeConversationId: null,
      isManualMode: false,
      isLoading: false,
      searchQuery: '',
      selectedFilter: 'all'
    };
    this.notify();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StateManager;
} else {
  window.StateManager = StateManager;
}
