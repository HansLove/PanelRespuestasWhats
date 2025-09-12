/**
 * UI module for WhatsApp Admin Panel
 * Handles all DOM manipulation and rendering
 */

class UIManager {
  constructor(config, stateManager) {
    this.config = config;
    this.stateManager = stateManager;
    this.elements = {};
    
    this.initializeElements();
    this.setupEventListeners();
  }

  /**
   * Initialize DOM element references
   */
  initializeElements() {
    this.elements = {
      // Left sidebar
      searchInput: document.getElementById('search'),
      refreshButton: document.getElementById('refresh'),
      connectionStatus: document.getElementById('connection-status'),
      chatList: document.getElementById('chatlist'),
      
      // Center thread
      threadAvatar: document.getElementById('av'),
      threadName: document.getElementById('who'),
      threadChips: document.getElementById('chips'),
      threadArea: document.getElementById('area'),
      messageInput: document.getElementById('text'),
      quickButton: document.getElementById('quick'),
      sendButton: document.getElementById('send'),
      
      // Right panel
      sourceInfo: document.getElementById('src'),
      phoneInfo: document.getElementById('phone'),
      statusInfo: document.getElementById('status'),
      interviewInfo: document.getElementById('interview'),
      lastMessageInfo: document.getElementById('last'),
      timezoneInfo: document.getElementById('tz'),
      toggleButton: document.getElementById('toggle'),
      noteTextarea: document.getElementById('note'),
      saveNoteButton: document.getElementById('saveNote'),
      
      // Toast
      toast: document.getElementById('toast')
    };
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search functionality
    if (this.elements.searchInput) {
      this.elements.searchInput.addEventListener('input', (e) => {
        this.stateManager.setSearchQuery(e.target.value);
      });
    }

    // Refresh button
    if (this.elements.refreshButton) {
      this.elements.refreshButton.addEventListener('click', () => {
        this.emit('refresh');
      });
    }

    // Send message
    if (this.elements.sendButton) {
      this.elements.sendButton.addEventListener('click', () => {
        this.handleSendMessage();
      });
    }

    // Quick replies
    if (this.elements.quickButton) {
      this.elements.quickButton.addEventListener('click', () => {
        this.showQuickReplies();
      });
    }

    // Toggle manual mode
    if (this.elements.toggleButton) {
      this.elements.toggleButton.addEventListener('click', () => {
        this.emit('toggleManualMode');
      });
    }

    // Save note
    if (this.elements.saveNoteButton) {
      this.elements.saveNoteButton.addEventListener('click', () => {
        this.emit('saveNote');
      });
    }

    // Quick action buttons
    document.querySelectorAll('[data-quick]').forEach(button => {
      button.addEventListener('click', (e) => {
        const message = e.target.getAttribute('data-quick');
        this.elements.messageInput.value = message;
        this.elements.messageInput.focus();
      });
    });

    // Enter key to send message
    if (this.elements.messageInput) {
      this.elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSendMessage();
        }
      });
    }
  }

  /**
   * Handle send message
   */
  handleSendMessage() {
    const message = this.elements.messageInput.value.trim();
    if (!message) return;

    if (!this.stateManager.getState().isManualMode) {
      this.showToast('Activate "Take control" to intervene.');
      return;
    }

    this.emit('sendMessage', message);
    this.elements.messageInput.value = '';
  }

  /**
   * Show quick replies dialog
   */
  showQuickReplies() {
    const options = this.config.QUICK_REPLIES;
    const pick = prompt(`Choose 0-${options.length - 1} to paste:\n${options.map((opt, i) => `${i}) ${opt.substring(0, 50)}...`).join('\n')}`, '0');
    const n = Number(pick);
    
    if (!isNaN(n) && options[n]) {
      this.elements.messageInput.value = options[n];
      this.elements.messageInput.focus();
    }
  }

  /**
   * Render conversation list
   */
  renderConversationList() {
    if (!this.elements.chatList) {
      console.error('Chat list element not found');
      return;
    }

    const state = this.stateManager.getState();

    
    if (state.isLoading) {
      this.elements.chatList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted);">Loading conversations...</div>';
      return;
    }

    if (state.conversations.length === 0) {
      console.log('No conversations found');
      this.elements.chatList.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--muted);">No conversations found</div>';
      return;
    }

    const filteredConversations = this.stateManager.getFilteredConversations();
    console.log('Filtered conversations:', filteredConversations);
    this.elements.chatList.innerHTML = '';

    filteredConversations.forEach(conversation => {
      const row = this.createConversationRow(conversation, state.activeConversationId);
      this.elements.chatList.appendChild(row);
    });
  }

  /**
   * Create conversation row element
   * @param {Object} conversation - Conversation data
   * @param {string} activeId - Currently active conversation ID
   * @returns {HTMLElement} Row element
   */
  createConversationRow(conversation, activeId) {
    const row = document.createElement('div');
    row.className = 'item';
    row.dataset.id = conversation.id;
    
    if (conversation.id === activeId) {
      row.style.background = '#0f1f26';
    }

    const badge = this.createConversationBadge(conversation);
    
    row.innerHTML = `
      <div class="avatar">${conversation.initials}</div>
      <div>
        <div class="title">${conversation.name}</div>
        <div class="meta">${conversation.src} • ${conversation.messages.length} messages • ${conversation.tags.join(', ')}</div>
      </div>
      <div>${badge}</div>
    `;

    row.addEventListener('click', () => {
      this.emit('selectConversation', conversation.id);
    });

    return row;
  }

  /**
   * Create conversation badge
   * @param {Object} conversation - Conversation data
   * @returns {string} Badge HTML
   */
  createConversationBadge(conversation) {
    if (conversation.unread > 0) {
      return `<span class="badge unread">${conversation.unread}</span>`;
    } else if (conversation.needsAttention) {
      return '<span class="badge">⚑</span>';
    } else if (conversation.messages.length === 0) {
      return '<span class="badge" style="background:#666">New</span>';
    }
    return '';
  }

  /**
   * Render conversation thread
   */
  renderConversationThread() {
    if (!this.elements.threadArea) return;

    const conversation = this.stateManager.getActiveConversation();
    if (!conversation) return;

    this.elements.threadArea.innerHTML = '';

    if (conversation.messages.length === 0) {
      this.renderEmptyConversation(conversation);
      return;
    }

    const sortedMessages = [...conversation.messages].sort((a, b) => a.id - b.id);
    
    sortedMessages.forEach(message => {
      const messageElement = this.createMessageElement(message);
      this.elements.threadArea.appendChild(messageElement);
    });

    this.elements.threadArea.scrollTop = this.elements.threadArea.scrollHeight;
  }

  /**
   * Render empty conversation state
   * @param {Object} conversation - Conversation data
   */
  renderEmptyConversation(conversation) {
    const emptyDiv = document.createElement('div');
    emptyDiv.style.cssText = 'text-align: center; padding: 40px 20px; color: var(--muted);';
    emptyDiv.innerHTML = `
      <div style="font-size: 48px; margin-bottom: 16px;">💬</div>
      <div style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">No messages yet</div>
      <div style="font-size: 14px;">Start a conversation with ${conversation.name}</div>
      <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">Click "Take control" and send a message</div>
    `;
    this.elements.threadArea.appendChild(emptyDiv);
  }

  /**
   * Create message element
   * @param {Object} message - Message data
   * @returns {HTMLElement} Message element
   */
  createMessageElement(message) {
    const div = document.createElement('div');
    div.className = `msg ${message.color}`;
    div.setAttribute('data-type', message.type);
    div.innerHTML = `${message.text?.replace(/</g, '&lt;').replace(/\n/g, '<br>') || ''}<div class="stamp">${message.label}</div>`;
    return div;
  }

  /**
   * Render conversation header
   */
  renderConversationHeader() {
    const conversation = this.stateManager.getActiveConversation();
    if (!conversation) return;

    const state = this.stateManager.getState();

    if (this.elements.threadName) {
      this.elements.threadName.textContent = conversation.name;
    }

    if (this.elements.threadAvatar) {
      this.elements.threadAvatar.textContent = conversation.initials;
    }

    if (this.elements.sourceInfo) {
      this.elements.sourceInfo.textContent = conversation.src;
    }

    if (this.elements.phoneInfo) {
      this.elements.phoneInfo.textContent = conversation.number || '—';
    }

    if (this.elements.interviewInfo) {
      this.elements.interviewInfo.textContent = conversation.interview ? 'Completed' : 'Pending';
    }

    if (this.elements.statusInfo) {
      this.elements.statusInfo.textContent = state.isManualMode ? 'Operator active' : 'Bot active';
    }

    if (this.elements.lastMessageInfo) {
      this.elements.lastMessageInfo.textContent = conversation.messages.length > 0 ? new Date().toLocaleString() : 'No messages';
    }

    if (this.elements.threadChips) {
      this.elements.threadChips.innerHTML = '';
      conversation.tags.forEach(tag => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = tag;
        this.elements.threadChips.appendChild(chip);
      });
    }
  }

  /**
   * Update connection status indicator
   * @param {boolean} connected - Connection status
   */
  updateConnectionStatus(connected) {
    if (!this.elements.connectionStatus) return;

    if (connected) {
      this.elements.connectionStatus.style.background = '#00a884';
      this.elements.connectionStatus.title = 'Connected to real-time updates';
    } else {
      this.elements.connectionStatus.style.background = '#ff6b6b';
      this.elements.connectionStatus.title = 'Disconnected from real-time updates';
    }
  }

  /**
   * Show toast message
   * @param {string} message - Toast message
   */
  showToast(message) {
    if (!this.elements.toast) return;

    this.elements.toast.textContent = message;
    this.elements.toast.style.display = 'block';
    
    setTimeout(() => {
      this.elements.toast.style.display = 'none';
    }, this.config.UI.TOAST_DURATION);
  }

  /**
   * Emit custom events
   * @param {string} eventName - Event name
   * @param {*} data - Event data
   */
  emit(eventName, data) {
    const event = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(event);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIManager;
} else {
  window.UIManager = UIManager;
}
