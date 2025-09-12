/**
 * API module for WhatsApp Admin Panel
 * Handles all backend communication
 */

class ApiService {
  constructor(config) {
    this.config = config;
  }

  /**
   * Fetch all conversations from the backend
   * @returns {Promise<Object>} Conversations data
   */
  async fetchConversations() {
    try {
      const response = await fetch(`${this.config.API_BASE}${this.config.ENDPOINTS.GET_ALL_CONVERSATIONS}`);
      const data = await response.json();
      
      if (data.status === 200) {
        return {
          success: true,
          data: data.numbers.map((number, index) => this.mapConversationData(number, index))
        };
      } else {
        return {
          success: false,
          error: data.message || 'Error loading conversations'
        };
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Fetch specific conversation info by phone number
   * @param {string} phoneNumber - The phone number to fetch info for
   * @returns {Promise<Object>} Conversation info
   */
  async fetchConversationInfo(phoneNumber) {
    try {
      const response = await fetch(`${this.config.API_BASE}${this.config.ENDPOINTS.GET_CONVERSATION_INFO}/${phoneNumber}`);
      const data = await response.json();
      
      if (data.status === 200) {
        return {
          success: true,
          data: data
        };
      } else {
        return {
          success: false,
          error: data.message || 'Error loading conversation info'
        };
      }
    } catch (error) {
      console.error('Error fetching conversation info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send an intervention message to a contact
   * @param {string} phoneNumber - The phone number to send to
   * @param {string} message - The message to send
   * @returns {Promise<Object>} Send result
   */
  async sendIntervention(phoneNumber, message) {
    try {
      const response = await fetch(`${this.config.API_BASE}${this.config.ENDPOINTS.SEND_INTERVENTION}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: phoneNumber,
          message: message
        })
      });
      
      if (response.ok) {
        return {
          success: true,
          data: await response.json()
        };
      } else {
        return {
          success: false,
          error: 'Failed to send message'
        };
      }
    } catch (error) {
      console.error('Error sending intervention:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Map conversation data from API response to internal format
   * @param {Object} number - Raw conversation data from API
   * @param {number} index - Index for generating ID
   * @returns {Object} Mapped conversation data
   */
  mapConversationData(number, index) {
    return {
      id: `c${index + 1}`,
      name: number.name,
      initials: this.getInitials(number.name),
      number: number.number,
      src: 'Whats',
      tags: [...this.config.DEFAULT_TAGS],
      unread: 0,
      needsAttention: !number.interview,
      interview: number.interview,
      messages: (number.history || []).map(msg => this.mapMessageData(msg))
    };
  }

  /**
   * Map message data from API response to internal format
   * @param {Object} msg - Raw message data from API
   * @returns {Object} Mapped message data
   */
  mapMessageData(msg) {
    const messageType = this.config.MESSAGE_TYPES[msg.typo] || { from: 'unknown', label: 'Unknown', color: 'in' };
    
    return {
      id: msg.id,
      from: messageType.from,
      type: msg.typo,
      label: messageType.label,
      color: messageType.color,
      text: msg.message,
      timestamp: new Date() // You might want to add timestamp to your API
    };
  }

  /**
   * Generate initials from a name
   * @param {string} name - Full name
   * @returns {string} Initials
   */
  getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiService;
} else {
  window.ApiService = ApiService;
}
