/**
 * UI module for WhatsApp Admin Panel
 * Handles all DOM manipulation and rendering
 */

class UIManager {
  constructor(config, stateManager) {
    this.config = config;
    this.stateManager = stateManager;
    this.elements = {};
    this.virtualScrolling = {
      enabled: false,
      itemHeight: 60, // Average message height
      visibleItems: 50, // Number of items to render
      scrollTop: 0,
      totalHeight: 0
    };
    
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
      helpButton: document.getElementById('help'),
      connectionStatus: document.getElementById('connection-status'),
      chatList: document.getElementById('chatlist'),
      
      // Center thread
      threadAvatar: document.getElementById('av'),
      threadName: document.getElementById('who'),
      threadChips: document.getElementById('chips'),
      threadArea: document.getElementById('area'),
      messageInput: document.getElementById('text'),
      voiceRecordButton: document.getElementById('voice-record'),
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
      toast: document.getElementById('toast'),
      
      // Scroll indicator
      scrollIndicator: document.getElementById('scroll-indicator'),
      
      // Voice recording elements
      recordingOverlay: document.getElementById('recording-overlay'),
      recordingTime: document.getElementById('recording-time'),
      cancelRecordingButton: document.getElementById('cancel-recording'),
      stopRecordingButton: document.getElementById('stop-recording')
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

    // Help button
    if (this.elements.helpButton) {
      this.elements.helpButton.addEventListener('click', () => {
        this.showHelpModal();
      });
    }

    // Send message
    if (this.elements.sendButton) {
      this.elements.sendButton.addEventListener('click', () => {
        this.handleSendMessage();
      });
    }

    // Voice recording
    if (this.elements.voiceRecordButton) {
      this.elements.voiceRecordButton.addEventListener('click', () => {
        this.toggleVoiceRecording();
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

    // Global keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      this.handleKeyboardShortcuts(e);
    });

    // Performance optimization: Debounced scroll handler
    this.debouncedScrollHandler = this.debounce(() => {
      this.handleScroll();
    }, 16); // ~60fps

    // Setup scroll optimization
    if (this.elements.threadArea) {
      this.elements.threadArea.addEventListener('scroll', this.debouncedScrollHandler);
    }

    // Mobile sidebar toggle
    this.setupMobileSidebar();

    // Setup scroll indicator
    if (this.elements.scrollIndicator) {
      this.elements.scrollIndicator.addEventListener('click', () => {
        this.scrollToBottom(true);
      });
    }

    // Setup audio message handlers
    this.setupAudioMessageHandlers();

    // Setup voice recording handlers
    this.setupVoiceRecordingHandlers();
  }

  /**
   * Handle keyboard shortcuts
   * @param {KeyboardEvent} e - Keyboard event
   */
  handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + R: Refresh conversations
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      this.emit('refresh');
      return;
    }

    // Ctrl/Cmd + T: Toggle manual mode
    if ((e.ctrlKey || e.metaKey) && e.key === 't') {
      e.preventDefault();
      this.emit('toggleManualMode');
      return;
    }

    // Ctrl/Cmd + F: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
      e.preventDefault();
      if (this.elements.searchInput) {
        this.elements.searchInput.focus();
        this.elements.searchInput.select();
      }
      return;
    }

    // Escape: Clear search or focus message input
    if (e.key === 'Escape') {
      if (this.elements.searchInput && this.elements.searchInput.value) {
        this.elements.searchInput.value = '';
        this.stateManager.setSearchQuery('');
      } else if (this.elements.messageInput) {
        this.elements.messageInput.focus();
      }
      return;
    }

    // Ctrl/Cmd + End: Scroll to bottom
    if ((e.ctrlKey || e.metaKey) && e.key === 'End') {
      e.preventDefault();
      this.scrollToBottom(true);
      return;
    }

    // ? key: Show help modal
    if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Only if not typing in an input
      if (!['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        this.showHelpModal();
        return;
      }
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
    this.hideTypingIndicator();
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

    // Store current scroll position to maintain scroll position when appropriate
    const wasAtBottom = this.isScrolledToBottom();
    const previousScrollHeight = this.elements.threadArea.scrollHeight;

    this.elements.threadArea.innerHTML = '';

    if (conversation.messages.length === 0) {
      this.renderEmptyConversation(conversation);
      return;
    }

    const sortedMessages = [...conversation.messages].sort((a, b) => a.id - b.id);
    
    // Create message container for better scroll management
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    
    // Enable virtual scrolling for large message lists
    if (sortedMessages.length > 100) {
      this.renderVirtualScrollMessages(messageContainer, sortedMessages);
    } else {
      // Standard rendering for smaller lists
      sortedMessages.forEach((message, index) => {
        const messageElement = this.createMessageElement(message);
        
        // Add staggered animation for initial load (only for reasonable amounts)
        if (conversation.messages.length > 10 && conversation.messages.length < 50) {
          messageElement.style.opacity = '0';
          messageElement.style.transform = 'translateY(10px)';
          setTimeout(() => {
            messageElement.style.transition = 'all 0.3s ease';
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
          }, Math.min(index * 30, 300));
        }
        
        messageContainer.appendChild(messageElement);
      });
    }
    
    this.elements.threadArea.appendChild(messageContainer);

    // Force scroll to bottom after rendering - multiple attempts for reliability
    requestAnimationFrame(() => {
      this.scrollToBottom(false);
      
      // Additional attempts to ensure scroll works
      setTimeout(() => this.scrollToBottom(false), 100);
      setTimeout(() => this.scrollToBottom(false), 300);
    });
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
    div.setAttribute('data-message-id', message.id);
    
    const timestamp = this.formatTimestamp(message.timestamp);
    
    let messageContent;
    
    // Handle audio messages
    if (message.isAudio && message.audioUrl) {
      console.log('Creating audio player for message:', message.id, 'Audio URL:', message.audioUrl);
      messageContent = this.createAudioPlayer(message);
    } else {
      // Regular text message
      const messageText = message.text?.replace(/</g, '&lt;').replace(/\n/g, '<br>') || '';
      messageContent = `<div class="message-content">${messageText}</div>`;
    }
    
    div.innerHTML = `
      ${messageContent}
      <div class="stamp">${message.label} • ${timestamp}</div>
    `;
    
    // Add hover effects for better UX
    div.addEventListener('mouseenter', () => {
      div.style.transform = 'scale(1.01)';
      div.style.transition = 'transform 0.2s ease';
    });
    
    div.addEventListener('mouseleave', () => {
      div.style.transform = 'scale(1)';
    });
    
    return div;
  }

  /**
   * Create audio player for audio messages
   * @param {Object} message - Message data with audio
   * @returns {string} HTML string for audio player
   */
  createAudioPlayer(message) {
    const audioId = `audio-${message.id}`;
    const playButtonId = `play-${message.id}`;
    const progressId = `progress-${message.id}`;
    const timeId = `time-${message.id}`;
    
    return `
      <div class="audio-message">
        <div class="audio-controls">
          <button class="audio-play-btn" id="${playButtonId}" data-audio-id="${audioId}">
            <span class="play-icon">▶</span>
            <span class="pause-icon" style="display:none">⏸</span>
          </button>
          <div class="audio-progress">
            <div class="audio-waveform">
              <div class="waveform-bar"></div>
              <div class="waveform-bar"></div>
              <div class="waveform-bar"></div>
              <div class="waveform-bar"></div>
              <div class="waveform-bar"></div>
              <div class="waveform-bar"></div>
              <div class="waveform-bar"></div>
              <div class="waveform-bar"></div>
            </div>
            <div class="audio-progress-bar">
              <div class="progress-fill" id="${progressId}"></div>
            </div>
          </div>
          <div class="audio-time" id="${timeId}">0:00</div>
          <button class="audio-download-btn" title="Download audio">⬇</button>
        </div>
        <audio id="${audioId}" src="${message.audioUrl}" preload="metadata"></audio>
      </div>
    `;
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
   * Check if scroll is at bottom
   * @returns {boolean} Whether scrolled to bottom
   */
  isScrolledToBottom() {
    if (!this.elements.threadArea) return false;
    const threshold = 50; // pixels from bottom
    return this.elements.threadArea.scrollHeight - this.elements.threadArea.scrollTop - this.elements.threadArea.clientHeight < threshold;
  }

  /**
   * Scroll to bottom with animation
   * @param {boolean} smooth - Whether to use smooth scrolling
   */
  scrollToBottom(smooth = true) {
    if (!this.elements.threadArea) return;
    
    // Force scroll to bottom - multiple methods for better compatibility
    const scrollTop = this.elements.threadArea.scrollHeight - this.elements.threadArea.clientHeight;
    
    if (smooth) {
      // Smooth scroll with fallback
      if (this.elements.threadArea.scrollTo) {
        this.elements.threadArea.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      } else {
        // Fallback for older browsers
        this.elements.threadArea.scrollTop = scrollTop;
      }
    } else {
      // Instant scroll
      this.elements.threadArea.scrollTop = scrollTop;
    }
    
    // Additional fallback - ensure we're at the bottom
    setTimeout(() => {
      this.elements.threadArea.scrollTop = this.elements.threadArea.scrollHeight;
    }, 50);
  }

  /**
   * Add new message with animation
   * @param {Object} message - Message data
   */
  addMessageWithAnimation(message) {
    if (!this.elements.threadArea) return;
    
    const messageContainer = this.elements.threadArea.querySelector('.message-container');
    if (!messageContainer) {
      this.renderConversationThread();
      return;
    }
    
    const wasAtBottom = this.isScrolledToBottom();
    const messageElement = this.createMessageElement(message);
    
    // Add entrance animation
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateY(20px) scale(0.95)';
    messageElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    messageContainer.appendChild(messageElement);
    
    // Trigger animation
    requestAnimationFrame(() => {
      messageElement.style.opacity = '1';
      messageElement.style.transform = 'translateY(0) scale(1)';
    });
    
    // Always scroll to bottom for new messages - force it
    setTimeout(() => {
      this.scrollToBottom(true);
    }, 100);
  }

  /**
   * Show new message indicator
   */
  showNewMessageIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'new-message-indicator';
    indicator.innerHTML = '↓ New message';
    indicator.style.cssText = `
      position: absolute;
      bottom: 80px;
      right: 20px;
      background: var(--accent);
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 12px;
      cursor: pointer;
      z-index: 1000;
      animation: slideInUp 0.3s ease;
    `;
    
    indicator.addEventListener('click', () => {
      this.scrollToBottom(true);
      indicator.remove();
    });
    
    document.body.appendChild(indicator);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (indicator.parentNode) {
        indicator.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => indicator.remove(), 300);
      }
    }, 5000);
  }

  /**
   * Format timestamp for display
   * @param {Date} timestamp - Message timestamp
   * @returns {string} Formatted timestamp
   */
  formatTimestamp(timestamp) {
    if (!timestamp) return 'now';
    
    const now = new Date();
    const msgTime = new Date(timestamp);
    const diffMs = now - msgTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return msgTime.toLocaleDateString();
  }

  /**
   * Render messages with virtual scrolling for performance
   * @param {HTMLElement} container - Container element
   * @param {Array} messages - Array of messages
   */
  renderVirtualScrollMessages(container, messages) {
    const totalHeight = messages.length * this.virtualScrolling.itemHeight;
    container.style.height = `${totalHeight}px`;
    container.style.position = 'relative';
    
    // Create viewport
    const viewport = document.createElement('div');
    viewport.className = 'virtual-scroll-viewport';
    viewport.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      overflow: visible;
    `;
    
    // Initial render of visible items
    this.updateVirtualScrollView(viewport, messages);
    
    // Setup scroll listener for virtual scrolling
    this.elements.threadArea.addEventListener('scroll', () => {
      this.updateVirtualScrollView(viewport, messages);
    });
    
    container.appendChild(viewport);
  }

  /**
   * Update virtual scroll view
   * @param {HTMLElement} viewport - Viewport element
   * @param {Array} messages - Array of messages
   */
  updateVirtualScrollView(viewport, messages) {
    const scrollTop = this.elements.threadArea.scrollTop;
    const containerHeight = this.elements.threadArea.clientHeight;
    
    const startIndex = Math.floor(scrollTop / this.virtualScrolling.itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / this.virtualScrolling.itemHeight) + 5,
      messages.length
    );
    
    // Clear viewport
    viewport.innerHTML = '';
    
    // Render visible messages
    for (let i = Math.max(0, startIndex - 5); i < endIndex; i++) {
      const message = messages[i];
      const messageElement = this.createMessageElement(message);
      messageElement.style.position = 'absolute';
      messageElement.style.top = `${i * this.virtualScrolling.itemHeight}px`;
      messageElement.style.width = '100%';
      viewport.appendChild(messageElement);
    }
  }

  /**
   * Show typing indicator
   * @param {string} userName - Name of the user typing
   */
  showTypingIndicator(userName = 'User') {
    if (!this.elements.threadArea) return;
    
    // Remove existing typing indicator
    this.hideTypingIndicator();
    
    const messageContainer = this.elements.threadArea.querySelector('.message-container');
    if (!messageContainer) return;
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = `
      <div class="typing-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span style="margin-left: 8px; font-size: 11px; color: var(--muted);">${userName} is typing...</span>
    `;
    
    messageContainer.appendChild(typingDiv);
    this.scrollToBottom(true);
  }

  /**
   * Hide typing indicator
   */
  hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
      typingIndicator.remove();
    }
  }

  /**
   * Setup mobile sidebar functionality
   */
  setupMobileSidebar() {
    // Add click handler to hamburger menu (thread-head::before)
    if (this.elements.threadArea) {
      const threadHead = document.querySelector('.thread-head');
      if (threadHead) {
        threadHead.addEventListener('click', (e) => {
          // Check if click is on the left side (hamburger area)
          if (e.clientX < 50) {
            this.toggleMobileSidebar();
          }
        });
      }
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
      const sidebar = document.querySelector('.sidebar');
      const threadHead = document.querySelector('.thread-head');
      
      if (window.innerWidth <= 768 && sidebar && sidebar.classList.contains('open')) {
        if (!sidebar.contains(e.target) && !threadHead.contains(e.target)) {
          this.closeMobileSidebar();
        }
      }
    });

    // Close sidebar on conversation selection (mobile)
    document.addEventListener('selectConversation', () => {
      if (window.innerWidth <= 768) {
        this.closeMobileSidebar();
      }
    });
  }

  /**
   * Toggle mobile sidebar
   */
  toggleMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.toggle('open');
    }
  }

  /**
   * Close mobile sidebar
   */
  closeMobileSidebar() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.remove('open');
    }
  }

  /**
   * Setup audio message event handlers
   */
  setupAudioMessageHandlers() {
    // Use event delegation for audio controls
    document.addEventListener('click', (e) => {
      // Handle play/pause button clicks
      if (e.target.closest('.audio-play-btn')) {
        const button = e.target.closest('.audio-play-btn');
        const audioId = button.getAttribute('data-audio-id');
        this.toggleAudioPlayback(audioId, button);
      }
      
      // Handle download button clicks
      if (e.target.closest('.audio-download-btn')) {
        const audioMessage = e.target.closest('.audio-message');
        const audioElement = audioMessage.querySelector('audio');
        this.downloadAudio(audioElement);
      }
    });

    // Handle progress bar clicks for seeking
    document.addEventListener('click', (e) => {
      if (e.target.closest('.audio-progress-bar')) {
        const progressBar = e.target.closest('.audio-progress-bar');
        const audioMessage = progressBar.closest('.audio-message');
        const audioElement = audioMessage.querySelector('audio');
        this.seekAudio(e, progressBar, audioElement);
      }
    });
  }

  /**
   * Toggle audio playback
   * @param {string} audioId - Audio element ID
   * @param {HTMLElement} button - Play button element
   */
  toggleAudioPlayback(audioId, button) {
    const audioElement = document.getElementById(audioId);
    if (!audioElement) return;

    const playIcon = button.querySelector('.play-icon');
    const pauseIcon = button.querySelector('.pause-icon');
    const waveformBars = button.closest('.audio-message').querySelectorAll('.waveform-bar');

    if (audioElement.paused) {
      // Stop all other audio elements
      this.stopAllAudio();
      
      // Play this audio
      audioElement.play().then(() => {
        playIcon.style.display = 'none';
        pauseIcon.style.display = 'inline';
        waveformBars.forEach(bar => bar.classList.add('playing'));
        this.startAudioProgressTracking(audioElement);
      }).catch(error => {
        console.error('Error playing audio:', error);
        this.showToast('Error playing audio');
      });
    } else {
      // Pause audio
      audioElement.pause();
      playIcon.style.display = 'inline';
      pauseIcon.style.display = 'none';
      waveformBars.forEach(bar => bar.classList.remove('playing'));
    }
  }

  /**
   * Stop all audio playback
   */
  stopAllAudio() {
    const allAudioElements = document.querySelectorAll('audio');
    const allPlayButtons = document.querySelectorAll('.audio-play-btn');
    const allWaveformBars = document.querySelectorAll('.waveform-bar');

    allAudioElements.forEach(audio => {
      audio.pause();
      audio.currentTime = 0;
    });

    allPlayButtons.forEach(button => {
      const playIcon = button.querySelector('.play-icon');
      const pauseIcon = button.querySelector('.pause-icon');
      if (playIcon && pauseIcon) {
        playIcon.style.display = 'inline';
        pauseIcon.style.display = 'none';
      }
    });

    allWaveformBars.forEach(bar => {
      bar.classList.remove('playing');
    });
  }

  /**
   * Start tracking audio progress
   * @param {HTMLAudioElement} audioElement - Audio element
   */
  startAudioProgressTracking(audioElement) {
    const messageId = audioElement.id.replace('audio-', '');
    const progressFill = document.getElementById(`progress-${messageId}`);
    const timeDisplay = document.getElementById(`time-${messageId}`);

    const updateProgress = () => {
      if (!audioElement.paused) {
        const progress = (audioElement.currentTime / audioElement.duration) * 100;
        if (progressFill) {
          progressFill.style.width = `${progress}%`;
        }
        
        if (timeDisplay) {
          timeDisplay.textContent = this.formatAudioTime(audioElement.currentTime);
        }
        
        requestAnimationFrame(updateProgress);
      }
    };

    // Handle audio end
    audioElement.addEventListener('ended', () => {
      const button = document.getElementById(`play-${messageId}`);
      if (button) {
        const playIcon = button.querySelector('.play-icon');
        const pauseIcon = button.querySelector('.pause-icon');
        const waveformBars = button.closest('.audio-message').querySelectorAll('.waveform-bar');
        
        playIcon.style.display = 'inline';
        pauseIcon.style.display = 'none';
        waveformBars.forEach(bar => bar.classList.remove('playing'));
        
        if (progressFill) progressFill.style.width = '0%';
        if (timeDisplay) timeDisplay.textContent = '0:00';
      }
    });

    updateProgress();
  }

  /**
   * Seek audio to specific position
   * @param {Event} e - Click event
   * @param {HTMLElement} progressBar - Progress bar element
   * @param {HTMLAudioElement} audioElement - Audio element
   */
  seekAudio(e, progressBar, audioElement) {
    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * audioElement.duration;
    
    if (!isNaN(newTime)) {
      audioElement.currentTime = newTime;
    }
  }

  /**
   * Download audio file
   * @param {HTMLAudioElement} audioElement - Audio element
   */
  downloadAudio(audioElement) {
    const link = document.createElement('a');
    link.href = audioElement.src;
    link.download = `audio-message-${Date.now()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    this.showToast('Audio download started');
  }

  /**
   * Format audio time in MM:SS format
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time
   */
  formatAudioTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Setup voice recording event handlers
   */
  setupVoiceRecordingHandlers() {
    // Initialize voice recording state
    this.voiceRecording = {
      isRecording: false,
      mediaRecorder: null,
      audioChunks: [],
      startTime: null,
      timerInterval: null
    };

    // Recording overlay event listeners
    if (this.elements.cancelRecordingButton) {
      this.elements.cancelRecordingButton.addEventListener('click', () => {
        this.cancelVoiceRecording();
      });
    }

    if (this.elements.stopRecordingButton) {
      this.elements.stopRecordingButton.addEventListener('click', () => {
        this.stopVoiceRecording();
      });
    }

    // Close recording on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.voiceRecording.isRecording) {
        this.cancelVoiceRecording();
      }
    });
  }

  /**
   * Toggle voice recording on/off
   */
  async toggleVoiceRecording() {
    if (!this.stateManager.getState().isManualMode) {
      this.showToast('Activate "Take control" to send voice notes.');
      return;
    }

    if (this.voiceRecording.isRecording) {
      this.stopVoiceRecording();
    } else {
      await this.startVoiceRecording();
    }
  }

  /**
   * Start voice recording
   */
  async startVoiceRecording() {
    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Initialize MediaRecorder
      this.voiceRecording.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.voiceRecording.audioChunks = [];
      this.voiceRecording.isRecording = true;
      this.voiceRecording.startTime = Date.now();

      // Setup MediaRecorder events
      this.voiceRecording.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.voiceRecording.audioChunks.push(event.data);
        }
      };

      this.voiceRecording.mediaRecorder.onstop = () => {
        this.processRecordedAudio();
        stream.getTracks().forEach(track => track.stop()); // Stop microphone
      };

      // Start recording
      this.voiceRecording.mediaRecorder.start();

      // Update UI
      this.elements.voiceRecordButton.classList.add('recording');
      this.elements.recordingOverlay.style.display = 'flex';
      
      // Start timer
      this.startRecordingTimer();

      console.log('Voice recording started');

    } catch (error) {
      console.error('Error starting voice recording:', error);
      
      if (error.name === 'NotAllowedError') {
        this.showToast('Microphone permission denied. Please allow access to record voice notes.');
      } else if (error.name === 'NotFoundError') {
        this.showToast('No microphone found. Please connect a microphone.');
      } else {
        this.showToast('Error starting voice recording. Please try again.');
      }
    }
  }

  /**
   * Stop voice recording and send
   */
  stopVoiceRecording() {
    if (!this.voiceRecording.isRecording) return;

    console.log('Stopping voice recording...');
    this.voiceRecording.mediaRecorder.stop();
    this.resetRecordingUI();
  }

  /**
   * Cancel voice recording without sending
   */
  cancelVoiceRecording() {
    if (!this.voiceRecording.isRecording) return;

    console.log('Cancelling voice recording...');
    this.voiceRecording.mediaRecorder.stop();
    this.voiceRecording.audioChunks = []; // Clear audio data
    this.resetRecordingUI();
    this.showToast('Voice recording cancelled');
  }

  /**
   * Process recorded audio and send
   */
  async processRecordedAudio() {
    if (this.voiceRecording.audioChunks.length === 0) return;

    try {
      // Create audio blob
      const audioBlob = new Blob(this.voiceRecording.audioChunks, { 
        type: 'audio/webm;codecs=opus' 
      });

      console.log('Processing recorded audio, size:', audioBlob.size, 'bytes');

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result.split(',')[1]; // Remove "data:audio/webm;base64,"
        console.log('Audio converted to base64, length:', base64Audio.length);
        
        // Send via API
        this.sendVoiceMessage(base64Audio);
      };
      
      reader.readAsDataURL(audioBlob);

    } catch (error) {
      console.error('Error processing recorded audio:', error);
      this.showToast('Error processing voice recording');
    }
  }

  /**
   * Send voice message via API
   * @param {string} base64Audio - Base64 encoded audio data
   */
  async sendVoiceMessage(base64Audio) {
    const conversation = this.stateManager.getActiveConversation();
    if (!conversation) {
      this.showToast('No conversation selected');
      return;
    }

    try {
      // Use the existing API service to send voice message
      const result = await window.app.apiService.sendVoiceMessage(conversation.number, base64Audio);
      
      if (result.success) {
        this.showToast('Voice message sent successfully');
        
        // Add message to local state for immediate feedback
        const messageData = {
          id: Date.now(),
          from: 'admin',
          type: 4, // Admin intervention
          label: '👨‍💼 Admin Voice',
          color: 'out',
          text: '🎵 Voice Message',
          isAudio: true,
          audioData: base64Audio,
          audioUrl: window.app.apiService.convertBase64ToAudioUrl(`data:audio/webm;base64,${base64Audio}`),
          timestamp: new Date()
        };
        
        this.stateManager.addMessage(conversation.id, messageData);
        this.addMessageWithAnimation(messageData);
        
      } else {
        this.showToast(result.error || 'Failed to send voice message');
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
      this.showToast('Failed to send voice message');
    }
  }

  /**
   * Start recording timer
   */
  startRecordingTimer() {
    this.voiceRecording.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.voiceRecording.startTime) / 1000);
      const minutes = Math.floor(elapsed / 60);
      const seconds = elapsed % 60;
      
      if (this.elements.recordingTime) {
        this.elements.recordingTime.textContent = 
          `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }

      // Auto-stop after 5 minutes
      if (elapsed >= 300) {
        this.stopVoiceRecording();
        this.showToast('Recording stopped: 5 minute limit reached');
      }
    }, 1000);
  }

  /**
   * Reset recording UI to initial state
   */
  resetRecordingUI() {
    this.voiceRecording.isRecording = false;
    
    // Clear timer
    if (this.voiceRecording.timerInterval) {
      clearInterval(this.voiceRecording.timerInterval);
      this.voiceRecording.timerInterval = null;
    }

    // Reset UI elements
    this.elements.voiceRecordButton.classList.remove('recording');
    this.elements.recordingOverlay.style.display = 'none';
    
    if (this.elements.recordingTime) {
      this.elements.recordingTime.textContent = '00:00';
    }
  }

  /**
   * Show help modal with keyboard shortcuts
   */
  showHelpModal() {
    const helpModal = document.getElementById('help-modal');
    if (helpModal) {
      helpModal.style.display = 'flex';
      
      // Close modal when clicking outside
      helpModal.addEventListener('click', (e) => {
        if (e.target === helpModal) {
          helpModal.style.display = 'none';
        }
      });
      
      // Close modal with Escape key
      const closeHandler = (e) => {
        if (e.key === 'Escape') {
          helpModal.style.display = 'none';
          document.removeEventListener('keydown', closeHandler);
        }
      };
      document.addEventListener('keydown', closeHandler);
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
    this.elements.toast.style.animation = 'slideInRight 0.3s ease';
    
    setTimeout(() => {
      this.elements.toast.style.animation = 'slideOutRight 0.3s ease';
      setTimeout(() => {
        this.elements.toast.style.display = 'none';
      }, 300);
    }, this.config.UI.TOAST_DURATION);
  }

  /**
   * Handle scroll events for performance optimization
   */
  handleScroll() {
    const isAtBottom = this.isScrolledToBottom();
    
    // Hide new message indicator if user scrolls to bottom
    if (isAtBottom) {
      const indicator = document.querySelector('.new-message-indicator');
      if (indicator) {
        indicator.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => indicator.remove(), 300);
      }
    }
    
    // Show/hide scroll to bottom indicator
    if (this.elements.scrollIndicator) {
      if (isAtBottom) {
        this.elements.scrollIndicator.style.display = 'none';
      } else {
        // Only show if there are enough messages to warrant scrolling
        const conversation = this.stateManager.getActiveConversation();
        if (conversation && conversation.messages.length > 3) {
          this.elements.scrollIndicator.style.display = 'flex';
        }
      }
    }
  }

  /**
   * Debounce function for performance optimization
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Optimize image loading with lazy loading
   * @param {HTMLElement} element - Element containing images
   */
  optimizeImages(element) {
    const images = element.querySelectorAll('img');
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            observer.unobserve(img);
          }
        });
      });

      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for older browsers
      images.forEach(img => {
        img.src = img.dataset.src;
      });
    }
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
