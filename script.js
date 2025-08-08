class MarchatClient {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.username = 'Guest';
    this.isAdmin = false;
    this.isE2EEnabled = false;
    this.users = [];
    this.typing = [];
    this.messages = [];
    this.initializeElements();
    this.bindEvents();
    this.loadServerUrl();
  }

  initializeElements() {
    this.serverInput = document.getElementById('serverInput');
    this.connectBtn = document.getElementById('connectBtn');
    this.statusIndicator = document.getElementById('statusIndicator');
    this.connectionStatus = document.getElementById('connectionStatus');
    this.messagesContainer = document.getElementById('messagesContainer');
    this.messageInput = document.getElementById('messageInput');
    this.sendBtn = document.getElementById('sendBtn');
    this.fileUpload = document.getElementById('fileUpload');
    this.userList = document.getElementById('userList');
    this.statusBar = document.getElementById('statusBar');
    this.sidebar = document.getElementById('sidebar');
    this.openSidebar = document.getElementById('openSidebar');
    this.closeSidebar = document.getElementById('closeSidebar');
    this.adminControls = document.getElementById('adminControls');
    this.adminCommand = document.getElementById('adminCommand');
    this.adminArgs = document.getElementById('adminArgs');
    this.adminBtn = document.getElementById('adminBtn');
  }

  bindEvents() {
    this.connectBtn.addEventListener('click', () => this.connected ? this.disconnect() : this.connect());
    this.messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      } else if (e.key === 'Escape') {
        this.messageInput.blur();
      }
    });
    this.messageInput.addEventListener('input', () => {
      this.autoResizeTextarea();
      if (this.connected && this.socket) {
        this.socket.send(JSON.stringify({ type: 'typing', username: this.username }));
      }
    });
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.fileUpload.addEventListener('change', (e) => this.handleFileUpload(e.target.files[0]));
    this.serverInput.addEventListener('input', () => localStorage.setItem('marchat_server_url', this.serverInput.value));
    this.openSidebar.addEventListener('click', () => this.sidebar.classList.add('open'));
    this.closeSidebar.addEventListener('click', () => this.sidebar.classList.remove('open'));
    this.adminBtn.addEventListener('click', () => this.handleAdminCommand());
  }

  loadServerUrl() {
    const savedUrl = localStorage.getItem('marchat_server_url');
    if (savedUrl) this.serverInput.value = savedUrl;
  }

  connect() {
    const serverUrl = this.serverInput.value.trim();
    if (!serverUrl) {
      this.addErrorMessage('Please enter a server URL');
      return;
    }
    this.updateConnectionStatus('connecting', 'Connecting...');
    this.connectBtn.disabled = true;
    try {
      this.socket = new WebSocket(serverUrl);
      this.socket.onopen = () => {
        this.connected = true;
        this.updateConnectionStatus('connected', 'Connected');
        this.connectBtn.textContent = 'Disconnect';
        this.connectBtn.disabled = false;
        this.messageInput.focus();
        this.socket.send(JSON.stringify({ type: 'auth', username: this.username, adminKey: 'your-secret-admin-key' }));
        this.addSystemMessage('Connected to marchat server');
      };
      this.socket.onmessage = (event) => this.handleMessage(event.data);
      this.socket.onclose = () => this.handleDisconnection();
      this.socket.onerror = () => {
        this.addErrorMessage('Connection error occurred');
        this.handleDisconnection();
      };
    } catch (error) {
      this.addErrorMessage('Failed to connect to server');
      this.handleDisconnection();
    }
  }

  disconnect() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.close();
    }
    this.handleDisconnection();
  }

  handleDisconnection() {
    this.connected = false;
    this.socket = null;
    this.users = [];
    this.typing = [];
    this.updateConnectionStatus('error', 'Disconnected');
    this.connectBtn.textContent = 'Connect';
    this.connectBtn.disabled = false;
    this.updateUserList();
    this.updateStatusBar();
    this.addSystemMessage('Disconnected from server');
  }

  handleMessage(data) {
    try {
      const message = JSON.parse(data);
      switch (message.type) {
        case 'message':
          this.messages.push(message);
          this.addChatMessage(message.sender, message.content, message.timestamp, message.encrypted);
          break;
        case 'typing':
          this.typing = message.usernames || [];
          this.updateStatusBar();
          break;
        case 'users':
          this.users = message.users.map(u => ({ name: u.name, isAdmin: u.isAdmin, online: u.online }));
          this.updateUserList();
          break;
        case 'welcome':
          this.username = message.username;
          this.addSystemMessage(`Welcome, ${message.username}!`);
          break;
        case 'command_response':
          this.addCommandMessage(message.content);
          break;
        case 'error':
          this.addErrorMessage(message.content);
          break;
        case 'user_joined':
          this.users.push({ name: message.username, isAdmin: false, online: true });
          this.updateUserList();
          this.addSystemMessage(`${message.username} joined the chat`);
          break;
        case 'user_left':
          this.users = this.users.filter(u => u.name !== message.username);
          this.updateUserList();
          this.addSystemMessage(`${message.username} left the chat`);
          break;
      }
    } catch (error) {
      this.addErrorMessage('Received invalid message from server');
    }
  }

  sendMessage() {
    const content = this.messageInput.value.trim();
    if (!content) return;
    if (content.startsWith(':')) {
      const command = content.slice(1).trim();
      this.handleCommand(command);
    } else if (this.connected && this.socket) {
      this.socket.send(JSON.stringify({ type: 'message', content, sender: this.username }));
      this.messages.push({ sender: this.username, content, timestamp: Date.now(), encrypted: this.isE2EEnabled });
      this.addChatMessage(this.username, content, Date.now(), this.isE2EEnabled);
    }
    this.messageInput.value = '';
    this.autoResizeTextarea();
  }

  handleCommand(command) {
    const [cmd, ...args] = command.split(' ');
    switch (cmd.toLowerCase()) {
      case 'theme':
        if (['patriot', 'retro', 'modern'].includes(args[0])) {
          document.body.dataset.theme = args[0];
          this.addSystemMessage(`Theme changed to ${args[0]}`);
        } else {
          this.addErrorMessage('Invalid theme. Use: patriot, retro, modern');
        }
        break;
      case 'e2e':
        this.isE2EEnabled = true;
        this.addSystemMessage('E2E encryption enabled');
        this.updateStatusBar();
        break;
      case 'showkey':
      case 'addkey':
        this.addSystemMessage(`Command ${cmd} executed`);
        break;
      case 'admin':
        this.isAdmin = true;
        this.adminControls.hidden = false;
        this.addSystemMessage('Admin mode enabled');
        break;
      case 'help':
        this.addSystemMessage('Commands: :theme [patriot|retro|modern], :e2e, :showkey, :addkey, :admin, :help');
        break;
      case 'users':
        this.addSystemMessage(`Online users: ${this.users.map(u => u.name).join(', ')}`);
        break;
      default:
        if (this.connected && this.socket) {
          this.socket.send(JSON.stringify({ type: 'command', command }));
          this.addCommandMessage(`Command executed: :${command}`);
        } else {
          this.addErrorMessage(`Unknown command: ${cmd}`);
        }
    }
  }

  handleAdminCommand() {
    const command = this.adminCommand.value;
    const args = this.adminArgs.value.trim();
    if (command) {
      this.socket.send(JSON.stringify({ type: 'admin', command, args }));
      this.addSystemMessage(`Admin command ${command} executed`);
      this.adminCommand.value = '';
      this.adminArgs.value = '';
    }
  }

  handleFileUpload(file) {
    if (file && file.size <= 1024 * 1024) {
      this.addSystemMessage(`File ${file.name} uploaded`);
      if (this.connected && this.socket) {
        // Placeholder for file upload to server
        this.socket.send(JSON.stringify({ type: 'file', name: file.name }));
      }
    } else {
      this.addErrorMessage('File must be under 1MB');
    }
  }

  addChatMessage(username, content, timestamp, encrypted) {
    const div = document.createElement('div');
    div.className = `message ${username === this.username ? 'mine' : ''} ${encrypted ? 'encrypted' : ''}`;
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    const header = document.createElement('div');
    header.className = 'message-header';
    const userSpan = document.createElement('span');
    userSpan.className = 'message-username';
    userSpan.textContent = username;
    const timeSpan = document.createElement('span');
    timeSpan.className = 'message-timestamp';
    timeSpan.textContent = this.formatTimestamp(timestamp);
    header.appendChild(userSpan);
    header.appendChild(timeSpan);
    bubble.appendChild(header);
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = this.processMentions(content);
    bubble.appendChild(contentDiv);
    div.appendChild(bubble);
    this.messagesContainer.appendChild(div);
    this.scrollToBottom();
  }

  processMentions(content) {
    return content.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  }

  addSystemMessage(content) {
    const div = document.createElement('div');
    div.className = 'system-message';
    div.textContent = content;
    this.messagesContainer.appendChild(div);
    this.scrollToBottom();
  }

  addErrorMessage(content) {
    const div = document.createElement('div');
    div.className = 'error-message';
    div.textContent = content;
    this.messagesContainer.appendChild(div);
    this.scrollToBottom();
  }

  addCommandMessage(content) {
    const div = document.createElement('div');
    div.className = 'command-message';
    div.textContent = content;
    this.messagesContainer.appendChild(div);
    this.scrollToBottom();
  }

  updateConnectionStatus(status, text) {
    this.statusIndicator.className = `status-indicator ${status}`;
    this.connectionStatus.textContent = text;
  }

  updateUserList() {
    this.userList.innerHTML = '';
    const maxUsers = 20;
    const displayedUsers = this.users.slice(0, maxUsers);
    if (this.users.length === 0) {
      const div = document.createElement('div');
      div.textContent = 'No users online';
      div.style.color = 'var(--offline)';
      div.style.fontSize = '0.75rem';
      div.style.padding = '0.5rem';
      div.style.textAlign = 'center';
      this.userList.appendChild(div);
      return;
    }
    displayedUsers.forEach(user => {
      const div = document.createElement('div');
      div.className = `user-item ${user.isAdmin ? 'admin' : ''} ${user.online ? 'online' : 'offline'}`;
      const nameSpan = document.createElement('span');
      nameSpan.textContent = user.name;
      div.appendChild(nameSpan);
      this.userList.appendChild(div);
    });
    if (this.users.length > maxUsers) {
      const div = document.createElement('div');
      div.textContent = `+${this.users.length - maxUsers} more`;
      div.style.opacity = '0.5';
      div.style.fontSize = '0.75rem';
      this.userList.appendChild(div);
    }
  }

  updateStatusBar() {
    this.statusBar.textContent = this.typing.length > 0 ? `${this.typing.join(', ')} typing...` : '';
    if (this.isE2EEnabled) {
      this.statusBar.textContent += this.statusBar.textContent ? ' 🔒 E2E Active' : '🔒 E2E Active';
    }
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  autoResizeTextarea() {
    this.messageInput.style.height = 'auto';
    this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
  }

  scrollToBottom() {
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.marchatClient = new MarchatClient();
});
