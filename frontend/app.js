// Configuration
let API_URL = 'http://localhost:8000';
let currentPhoneNumber = '5511999999999';

// DOM Elements
const phoneNumberInput = document.getElementById('phoneNumber');
const apiUrlInput = document.getElementById('apiUrl');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const checkStatusBtn = document.getElementById('checkStatusBtn');
const chatMessages = document.getElementById('chatMessages');
const statusBadge = document.getElementById('statusBadge');
const conversationStatus = document.getElementById('conversationStatus');
const funnelStep = document.getElementById('funnelStep');
const conversationName = document.getElementById('conversationName');
const conversationBirthDate = document.getElementById('conversationBirthDate');
const conversationReason = document.getElementById('conversationReason');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    phoneNumberInput.value = currentPhoneNumber;
    apiUrlInput.value = API_URL;
    
    phoneNumberInput.addEventListener('change', (e) => {
        currentPhoneNumber = e.target.value;
    });
    
    apiUrlInput.addEventListener('change', (e) => {
        API_URL = e.target.value;
    });
    
    sendBtn.addEventListener('click', sendMessage);
    checkStatusBtn.addEventListener('click', checkStatus);
    
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Check initial status
    checkStatus();
});

async function sendMessage() {
    const message = messageInput.value.trim();
    
    if (!message) {
        return;
    }
    
    if (!currentPhoneNumber) {
        showError('Por favor, informe um número de telefone');
        return;
    }
    
    // Disable input while sending
    setLoading(true);
    
    // Add user message to chat
    addMessage('user', message);
    messageInput.value = '';
    
    try {
        const response = await fetch(`${API_URL}/conversations/${currentPhoneNumber}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                content: message
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Add assistant response to chat
        if (data.content) {
            addMessage('assistant', data.content);
        }
        
        // Update conversation info
        updateConversationInfo(data.conversation);
        
    } catch (error) {
        console.error('Error sending message:', error);
        addMessage('system', `Erro: ${error.message}`);
        showError(error.message);
    } finally {
        setLoading(false);
        messageInput.focus();
    }
}

async function checkStatus() {
    if (!currentPhoneNumber) {
        showError('Por favor, informe um número de telefone');
        return;
    }
    
    setLoading(true);
    
    try {
        const response = await fetch(`${API_URL}/conversations/${currentPhoneNumber}/status`);
        
        if (!response.ok) {
            if (response.status === 404) {
                // Conversation doesn't exist yet
                resetConversationInfo();
                return;
            }
            throw new Error(`Erro ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        updateConversationInfo(data);
        
    } catch (error) {
        console.error('Error checking status:', error);
        showError(error.message);
    } finally {
        setLoading(false);
    }
}

function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.textContent = content;
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = new Date().toLocaleTimeString('pt-BR');
    
    messageDiv.appendChild(contentDiv);
    messageDiv.appendChild(timeDiv);
    
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function updateConversationInfo(conversation) {
    if (!conversation) {
        resetConversationInfo();
        return;
    }
    
    // Update status badge
    const status = conversation.status || 'unknown';
    statusBadge.textContent = status;
    statusBadge.className = 'status-badge ' + status;
    
    // Update info panel
    conversationStatus.textContent = status;
    funnelStep.textContent = conversation.funnelStep || '-';
    
    const variables = conversation.variables || {};
    conversationName.textContent = variables.name || '-';
    conversationBirthDate.textContent = variables.birthDate || '-';
    conversationReason.textContent = variables.weightLossReason || '-';
}

function resetConversationInfo() {
    statusBadge.textContent = 'Desconectado';
    statusBadge.className = 'status-badge';
    conversationStatus.textContent = '-';
    funnelStep.textContent = '-';
    conversationName.textContent = '-';
    conversationBirthDate.textContent = '-';
    conversationReason.textContent = '-';
}

function setLoading(loading) {
    if (loading) {
        sendBtn.disabled = true;
        checkStatusBtn.disabled = true;
        messageInput.disabled = true;
        document.body.classList.add('loading');
    } else {
        sendBtn.disabled = false;
        checkStatusBtn.disabled = false;
        messageInput.disabled = false;
        document.body.classList.remove('loading');
    }
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    chatMessages.appendChild(errorDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Remove error after 5 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}
