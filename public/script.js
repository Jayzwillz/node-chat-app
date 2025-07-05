// DOM Elements
const joinScreen = document.getElementById('joinScreen');
const chatScreen = document.getElementById('chatScreen');
const joinForm = document.getElementById('joinForm');
const usernameInput = document.getElementById('usernameInput');
const messageForm = document.getElementById('messageForm');
const messageInput = document.getElementById('messageInput');
const messagesArea = document.getElementById('messagesArea');
const usersList = document.getElementById('usersList');
const onlineCount = document.getElementById('onlineCount');
const leaveBtn = document.getElementById('leaveBtn');
const typingIndicator = document.getElementById('typingIndicator');
const typingText = document.getElementById('typingText');
const sendBtn = document.getElementById('sendBtn');

// Global variables
let socket;
let currentUsername = '';
let typingTimer;
let isTyping = false;

// Initialize Socket.IO connection
function initializeSocket() {
    socket = io();
    
    // Socket event listeners
    socket.on('connect', () => {
        console.log('Connected to server');
    });

    socket.on('disconnect', () => {
        console.log('Disconnected from server');
        showSystemMessage('Connection lost. Please refresh the page.');
    });

    socket.on('message', (data) => {
        displayMessage(data);
    });

    socket.on('userJoined', (data) => {
        showSystemMessage(data.message);
    });

    socket.on('userLeft', (data) => {
        showSystemMessage(data.message);
    });

    socket.on('updateUsersList', (users) => {
        updateUsersList(users);
    });

    socket.on('userTyping', (data) => {
        handleTypingIndicator(data);
    });
}

// Join chat functionality
joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = usernameInput.value.trim();
    
    if (username.length >= 2) {
        currentUsername = username;
        socket.emit('join', username);
        joinScreen.classList.add('hidden');
        chatScreen.classList.remove('hidden');
        messageInput.focus();
        
        // Clear welcome message
        setTimeout(() => {
            const welcomeMsg = document.querySelector('.welcome-message');
            if (welcomeMsg) {
                welcomeMsg.remove();
            }
        }, 1000);
    }
});

// Send message functionality
messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    
    if (message) {
        socket.emit('message', { message });
        messageInput.value = '';
        
        // Stop typing indicator
        if (isTyping) {
            socket.emit('typing', { isTyping: false });
            isTyping = false;
        }
        
        // Auto-resize input and scroll to bottom
        adjustTextareaHeight();
        scrollToBottom();
    }
});

// Typing indicator functionality
messageInput.addEventListener('input', () => {
    if (!isTyping) {
        isTyping = true;
        socket.emit('typing', { isTyping: true });
    }
    
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        isTyping = false;
        socket.emit('typing', { isTyping: false });
    }, 2000);
    
    // Update send button state
    updateSendButton();
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        messageForm.dispatchEvent(new Event('submit'));
    }
});

// Leave chat functionality
leaveBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to leave the chat?')) {
        socket.disconnect();
        location.reload();
    }
});

// Display message in chat
function displayMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${data.username === currentUsername ? 'own' : 'other'}`;
    
    const messageHeader = document.createElement('div');
    messageHeader.className = 'message-header';
    
    const username = document.createElement('span');
    username.className = 'username';
    username.textContent = data.username;
    
    const timestamp = document.createElement('span');
    timestamp.className = 'timestamp';
    timestamp.textContent = formatTime(data.timestamp);
    
    messageHeader.appendChild(username);
    messageHeader.appendChild(timestamp);
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    messageContent.textContent = data.message;
    
    messageDiv.appendChild(messageHeader);
    messageDiv.appendChild(messageContent);
    
    messagesArea.appendChild(messageDiv);
    scrollToBottom();
}

// Show system message
function showSystemMessage(message) {
    const systemDiv = document.createElement('div');
    systemDiv.className = 'system-message';
    systemDiv.textContent = message;
    messagesArea.appendChild(systemDiv);
    scrollToBottom();
}

// Update users list
function updateUsersList(users) {
    usersList.innerHTML = '';
    onlineCount.textContent = `${users.length} online`;
    
    users.forEach(username => {
        const userDiv = document.createElement('div');
        userDiv.className = 'user-item';
        
        const avatar = document.createElement('div');
        avatar.className = 'user-avatar';
        avatar.textContent = username.charAt(0).toUpperCase();
        
        const nameSpan = document.createElement('span');
        nameSpan.className = 'user-name';
        nameSpan.textContent = username;
        
        // Highlight current user
        if (username === currentUsername) {
            nameSpan.textContent += ' (You)';
            userDiv.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)';
        }
        
        userDiv.appendChild(avatar);
        userDiv.appendChild(nameSpan);
        usersList.appendChild(userDiv);
    });
}

// Handle typing indicator
function handleTypingIndicator(data) {
    if (data.isTyping) {
        typingText.textContent = `${data.username} is typing...`;
        typingIndicator.classList.remove('hidden');
    } else {
        typingIndicator.classList.add('hidden');
    }
    scrollToBottom();
}

// Utility functions
function formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function adjustTextareaHeight() {
    messageInput.style.height = 'auto';
    messageInput.style.height = messageInput.scrollHeight + 'px';
}

function updateSendButton() {
    const hasText = messageInput.value.trim().length > 0;
    sendBtn.disabled = !hasText;
    sendBtn.style.opacity = hasText ? '1' : '0.5';
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeSocket();
    usernameInput.focus();
    updateSendButton();
    
    // Add some visual feedback for input focus
    usernameInput.addEventListener('focus', () => {
        usernameInput.parentElement.style.transform = 'scale(1.02)';
    });
    
    usernameInput.addEventListener('blur', () => {
        usernameInput.parentElement.style.transform = 'scale(1)';
    });
    
    messageInput.addEventListener('focus', () => {
        messageInput.parentElement.style.transform = 'scale(1.02)';
    });
    
    messageInput.addEventListener('blur', () => {
        messageInput.parentElement.style.transform = 'scale(1)';
    });
});

// Handle window resize
window.addEventListener('resize', () => {
    scrollToBottom();
});

// Add some fun easter eggs
let konamiCode = [];
const konamiPattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];

document.addEventListener('keydown', (e) => {
    konamiCode.push(e.code);
    if (konamiCode.length > konamiPattern.length) {
        konamiCode.shift();
    }
    
    if (konamiCode.length === konamiPattern.length && 
        konamiCode.every((code, index) => code === konamiPattern[index])) {
        showSystemMessage('🎉 Konami Code activated! You found the easter egg!');
        konamiCode = [];
    }
});
