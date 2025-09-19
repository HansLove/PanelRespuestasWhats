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
      console.log('fetching conversation info for', phoneNumber);
      console.log('To the URL:', `${this.config.API_BASE}${this.config.ENDPOINTS.GET_CONVERSATION_INFO}/${phoneNumber}`);
      const response = await fetch(`${this.config.API_BASE}${this.config.ENDPOINTS.GET_CONVERSATION_INFO}/${phoneNumber}`);
      const data = await response.json();
      
      console.log('data::::::::::::::::', data);
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
   * Send a voice message to a contact
   * @param {string} phoneNumber - The phone number to send to
   * @param {string} base64Audio - Base64 encoded audio data
   * @returns {Promise<Object>} Send result
   */
  async sendVoiceMessage(phoneNumber, base64Audio) {
    try {
      console.log('Sending voice message to:', phoneNumber, 'Audio length:', base64Audio.length);
      
      const response = await fetch(`${this.config.API_BASE}${this.config.ENDPOINTS.SEND_INTERVENTION}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: phoneNumber,
          audio: base64Audio
        })
      });
      
      const responseData = await response.json();
      console.log('Voice message API response:', responseData);
      
      if (response.ok) {
        return {
          success: true,
          data: responseData
        };
      } else {
        return {
          success: false,
          error: responseData.message || 'Failed to send voice message'
        };
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
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
    console.log('number::::::::::::::::', number);
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

  mapConversationData2(number, index) {
    console.log('number::::::::::::::::', number);
    console.log('index::::::::::::::::', index);
    return {
      // id: `c${index + 1}`,
      id: `c${index}`,
      name: number.number.name,
      initials: this.getInitials(number.number.name),
      number: number.number.number,
      src: 'Whats',
      tags: [...this.config.DEFAULT_TAGS],
      unread: 0,
      needsAttention: !number.number.interview,
      interview: number.number.interview,
      messages: (number.number.history || []).map(msg => this.mapMessageData(msg))
    };
  }


  /**
   * Map message data from API response to internal format
   * @param {Object} msg - Raw message data from API
   * @returns {Object} Mapped message data
   */
  mapMessageData(msg) {
    const messageType = this.config.MESSAGE_TYPES[msg.typo] || { from: 'unknown', label: 'Unknown', color: 'in' };
    
    const mappedMessage = {
      id: msg.id,
      from: messageType.from,
      type: msg.typo,
      label: messageType.label,
      color: messageType.color,
      text: msg.message,
      timestamp: new Date(), // You might want to add timestamp to your API
      isAudio: msg.isaudio || false
    };

    // Handle audio messages
    if (msg.isaudio && msg.message) {
      console.log('Processing audio message:', msg.id, 'Base64 length:', msg.message.length);
      mappedMessage.audioData = msg.message;
      mappedMessage.audioUrl = this.convertBase64ToAudioUrl(msg.message);
      mappedMessage.text = '🎵 Audio Message';
      console.log('Audio URL created:', mappedMessage.audioUrl ? 'Success' : 'Failed');
    }

    return mappedMessage;
  }

  /**
   * Convert base64 audio data to blob URL
   * @param {string} base64Data - Base64 encoded audio data
   * @returns {string} Blob URL for audio playback
   */
  convertBase64ToAudioUrl(base64Data) {
    try {
      if (!base64Data || typeof base64Data !== 'string') {
        console.error('Invalid base64 data provided');
        return null;
      }

      console.log('Converting base64 audio, data length:', base64Data.length);
      
      // Detect MIME type from base64 data or use default
      let mimeType = 'audio/mp4';
      
      // Check if data URL format with MIME type
      if (base64Data.startsWith('data:')) {
        const mimeMatch = base64Data.match(/^data:([^;]+);base64,/);
        if (mimeMatch) {
          mimeType = mimeMatch[1];
          console.log('Detected MIME type from data URL:', mimeType);
        }
      }
      
      // Auto-detect common audio formats from base64 header
      const base64Audio = base64Data.replace(/^data:[^;]+;base64,/, '');
      
      // Validate base64 format
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64Audio)) {
        console.error('Invalid base64 format');
        return null;
      }
      
      try {
        const binaryStart = atob(base64Audio.substring(0, 20));
        
        // Check magic bytes for common audio formats
        if (binaryStart.includes('ftyp')) {
          mimeType = 'audio/mp4';
        } else if (binaryStart.includes('ID3') || binaryStart.startsWith('\xFF\xFB')) {
          mimeType = 'audio/mpeg';
        } else if (binaryStart.includes('OggS')) {
          mimeType = 'audio/ogg';
        } else if (binaryStart.includes('RIFF') && binaryStart.includes('WAVE')) {
          mimeType = 'audio/wav';
        }
        
        console.log('Detected audio format:', mimeType);
      } catch (headerError) {
        console.warn('Could not detect audio format from header, using default:', mimeType);
      }
      
      // Convert base64 to binary
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // Create blob with detected MIME type
      const blob = new Blob([bytes], { type: mimeType });
      console.log('Created audio blob:', blob.size, 'bytes, type:', mimeType);
      
      // Create and return blob URL
      const blobUrl = URL.createObjectURL(blob);
      console.log('Generated blob URL:', blobUrl);
      return blobUrl;
    } catch (error) {
      console.error('Error converting base64 to audio URL:', error);
      return null;
    }
  }

  /**
   * Cleanup blob URLs to prevent memory leaks
   * @param {Array} messages - Array of messages
   */
  cleanupAudioBlobs(messages) {
    messages.forEach(message => {
      if (message.audioUrl && message.audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(message.audioUrl);
      }
    });
  }

  /**
   * Test audio message processing with sample data
   * @param {string} base64Data - Sample base64 audio data
   */
  testAudioMessage(base64Data) {
    console.log('=== TESTING AUDIO MESSAGE ===');
    const testMessage = {
      id: 86,
      typo: 4,
      message: base64Data,
      isaudio: true
    };
    
    const mappedMessage = this.mapMessageData(testMessage);
    console.log('Mapped message result:', {
      id: mappedMessage.id,
      isAudio: mappedMessage.isAudio,
      hasAudioUrl: !!mappedMessage.audioUrl,
      text: mappedMessage.text
    });
    
    return mappedMessage;
  }

  /**
   * Generate initials from a name
   * @param {string} name - Full name
   * @returns {string} Initials
   */
  getInitials(name) {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ApiService;
} else {
  window.ApiService = ApiService;
}
