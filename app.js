// RAHL AI - Main Application Script
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const chatContainer = document.getElementById('chatContainer');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const themeToggle = document.getElementById('themeToggle');
    const clearChat = document.getElementById('clearChat');
    const menuBtn = document.getElementById('menuBtn');
    const typingStatus = document.getElementById('typingStatus');
    const charCount = document.getElementById('charCount');
    const featuresPanel = document.getElementById('featuresPanel');
    const closePanel = document.getElementById('closePanel');
    const attachBtn = document.getElementById('attachBtn');
    const attachMenu = document.getElementById('attachMenu');
    const toast = document.getElementById('toast');
    const suggestionChips = document.querySelectorAll('.chip');
    const quickActions = document.querySelectorAll('.quick-action');
    const voiceBtn = document.getElementById('voiceBtn');
    
    // State
    let conversationHistory = [];
    let isTyping = false;
    let currentTheme = localStorage.getItem('theme') || 'light';
    
    // Initialize
    initApp();
    
    function initApp() {
        // Set theme
        setTheme(currentTheme);
        
        // Load conversation history
        loadConversationHistory();
        
        // Set up event listeners
        setupEventListeners();
        
        // Auto-resize textarea
        autoResizeTextarea();
        
        // Show welcome message if first visit
        if (!localStorage.getItem('rahl_visited')) {
            setTimeout(() => {
                showToast('Welcome to RAHL AI! 👋');
                localStorage.setItem('rahl_visited', 'true');
            }, 1000);
        }
    }
    
    function setupEventListeners() {
        // Send message on button click
        sendBtn.addEventListener('click', sendMessage);
        
        // Send message on Enter (shift+Enter for new line)
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Character count
        messageInput.addEventListener('input', updateCharCount);
        
        // Theme toggle
        themeToggle.addEventListener('click', toggleTheme);
        
        // Clear chat
        clearChat.addEventListener('click', clearConversation);
        
        // Menu button
        menuBtn.addEventListener('click', () => {
            featuresPanel.classList.add('active');
        });
        
        // Close panel
        closePanel.addEventListener('click', () => {
            featuresPanel.classList.remove('active');
        });
        
        // Attach button
        attachBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            attachMenu.classList.toggle('show');
        });
        
        // Close attach menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!attachBtn.contains(e.target) && !attachMenu.contains(e.target)) {
                attachMenu.classList.remove('show');
            }
        });
        
        // Suggestion chips
        suggestionChips.forEach(chip => {
            chip.addEventListener('click', (e) => {
                const question = e.target.dataset.question;
                sendUserMessage(question);
                e.target.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    e.target.style.transform = '';
                }, 200);
            });
        });
        
        // Quick actions
        quickActions.forEach(action => {
            action.addEventListener('click', (e) => {
                const actionType = e.target.dataset.action;
                handleQuickAction(actionType);
            });
        });
        
        // Voice button (simulated)
        voiceBtn.addEventListener('click', () => {
            if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
                startVoiceRecognition();
            } else {
                showToast('Voice recognition not supported in this browser');
            }
        });
    }
    
    function sendMessage() {
        const message = messageInput.value.trim();
        if (!message || isTyping) return;
        
        sendUserMessage(message);
        messageInput.value = '';
        updateCharCount();
        autoResizeTextarea();
        
        // Hide attach menu if open
        attachMenu.classList.remove('show');
    }
    
    function sendUserMessage(message) {
        // Add user message
        addMessage(message, 'user');
        
        // Simulate AI thinking
        simulateTyping();
        
        // Generate AI response
        setTimeout(() => {
            const aiResponse = generateAIResponse(message);
            addMessage(aiResponse, 'ai');
            
            // Save to history
            saveToHistory(message, aiResponse);
        }, getRandomDelay(1000, 3000));
    }
    
    function addMessage(text, sender) {
        const messageWrapper = document.createElement('div');
        messageWrapper.className = `message-wrapper ${sender === 'user' ? 'user-message' : 'ai-message'}`;
        
        const isUser = sender === 'user';
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        messageWrapper.innerHTML = `
            <div class="message ${isUser ? 'user-message' : ''}">
                ${!isUser ? `
                    <div class="message-avatar">
                        <i class="fas fa-robot"></i>
                    </div>
                ` : ''}
                
                <div class="message-content">
                    ${!isUser ? `
                        <div class="message-header">
                            <span class="sender">RAHL AI</span>
                            <span class="time">${timestamp}</span>
                        </div>
                    ` : ''}
                    
                    <p class="message-text">${formatMessage(text)}</p>
                    
                    ${!isUser && shouldAddQuickReplies(text) ? `
                        <div class="message-actions">
                            <button class="quick-action" data-action="explain_more">
                                <i class="fas fa-search"></i> Explain more
                            </button>
                            <button class="quick-action" data-action="examples">
                                <i class="fas fa-list"></i> Show examples
                            </button>
                            <button class="quick-action" data-action="related">
                                <i class="fas fa-link"></i> Related topics
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                ${isUser ? `
                    <div class="message-avatar">
                        <i class="fas fa-user"></i>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Add animation
        messageWrapper.style.animation = 'messageAppear 0.3s ease-out';
        
        // Add to chat
        chatContainer.appendChild(messageWrapper);
        
        // Scroll to bottom
        scrollToBottom();
        
        // Add event listeners to new quick actions
        setTimeout(() => {
            messageWrapper.querySelectorAll('.quick-action').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const action = e.target.closest('.quick-action').dataset.action;
                    handleQuickAction(action);
                });
            });
        }, 100);
        
        return messageWrapper;
    }
    
    function formatMessage(text) {
        // Convert URLs to links
        text = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" class="message-link">$1</a>');
        
        // Convert code blocks
        text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
        
        // Convert **bold** text
        text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        
        // Convert *italic* text
        text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        return text;
    }
    
    function generateAIResponse(userMessage) {
        const lowerMsg = userMessage.toLowerCase();
        
        // Define response patterns
        const responses = {
            greetings: [
                "Hello! 👋 How can I assist you today?",
                "Hi there! Ready to help with anything you need.",
                "Greetings! I'm RAHL, your AI assistant. What's on your mind?"
            ],
            farewell: [
                "Goodbye! Feel free to come back anytime.",
                "See you later! Don't hesitate to ask if you need more help.",
                "Farewell! Remember, I'm here whenever you need assistance."
            ],
            help: [
                "I can help with:\n• Code generation & debugging\n• Learning explanations\n• Creative writing\n• Data analysis\n• Problem solving\n\nWhat would you like to do?",
                "I specialize in:\n• Programming (Python, JavaScript, Java, etc.)\n• Technical explanations\n• Content creation\n• Research assistance\n• And much more!\n\nJust ask!"
            ],
            name: [
                "I'm **RAHL** (Responsive AI Helper & Learner), your intelligent assistant!",
                "I go by **RAHL** - think of me as your personal AI companion."
            ],
            capabilities: [
                "I can:\n• Write and explain code\n• Teach complex topics\n• Generate creative content\n• Analyze data\n• Solve problems\n• And adapt to your needs!",
                "My capabilities include:\n• Natural language conversations\n• Multi-language support\n• Code generation in 50+ languages\n• Learning from interactions\n• Providing detailed explanations"
            ],
            default: [
                "That's an interesting question! Let me provide you with a detailed response.",
                "I understand what you're asking. Here's my analysis:",
                "Great question! Based on my knowledge, here's what I think:",
                "Let me break this down for you in a clear way:"
            ]
        };
        
        // Match patterns
        if (/(hello|hi|hey|greetings)/i.test(lowerMsg)) {
            return getRandomResponse(responses.greetings);
        }
        
        if (/(bye|goodbye|see you|farewell)/i.test(lowerMsg)) {
            return getRandomResponse(responses.farewell);
        }
        
        if (/(what can you do|help|capabilities)/i.test(lowerMsg)) {
            return getRandomResponse(responses.help);
        }
        
        if (/(who are you|what is your name|introduce yourself)/i.test(lowerMsg)) {
            return getRandomResponse(responses.name);
        }
        
        if (/(code|programming|function|algorithm)/i.test(lowerMsg)) {
            return generateCodeResponse(userMessage);
        }
        
        if (/(explain|what is|how does|tell me about)/i.test(lowerMsg)) {
            return generateExplanationResponse(userMessage);
        }
        
        // Default intelligent response
        const baseResponse = getRandomResponse(responses.default);
        return `${baseResponse}\n\n**Your query:** "${userMessage}"\n\nI'm continuously learning and adapting to provide the best assistance possible. Is there anything specific about this topic you'd like me to elaborate on?`;
    }
    
    function generateCodeResponse(query) {
        const languages = ['Python', 'JavaScript', 'Java', 'C++', 'HTML/CSS'];
        const language = languages[Math.floor(Math.random() * languages.length)];
        
        const codeExamples = {
            Python: `def ${query.toLowerCase().includes('fibonacci') ? 'fibonacci' : 'example'}(n):
    """${query.includes('function') ? 'Example function' : 'Code demonstration'}"""
    result = []
    for i in range(n):
        result.append(i * 2)
    return result

# Example usage:
print(${query.toLowerCase().includes('fibonacci') ? 'fibonacci' : 'example'}(5))`,
            
            JavaScript: `function ${query.toLowerCase().includes('array') ? 'processArray' : 'handleData'}(data) {
    // ${query.includes('function') ? 'Example function' : 'Code sample'}
    return data.map(item => item * 2)
        .filter(item => item > 0)
        .reduce((sum, item) => sum + item, 0);
}

// Usage example:
const result = ${query.toLowerCase().includes('array') ? 'processArray' : 'handleData'}([1, 2, 3, 4, 5]);
console.log(result);`
        };
        
        const code = codeExamples[language] || `// ${language} code example\nconsole.log("Hello from RAHL AI!");`;
        
        return `Here's a ${language} code example related to your query about **"${query.substring(0, 50)}..."**:

\`\`\`${language.toLowerCase()}
${code}
\`\`\`

**Explanation:**
This code demonstrates a common pattern in ${language}. You can modify it according to your specific needs. Want me to explain any part in more detail or help with a different language?`;
    }
    
    function generateExplanationResponse(query) {
        const topics = {
            'ai': "Artificial Intelligence involves creating systems that can perform tasks typically requiring human intelligence, like learning, reasoning, and problem-solving.",
            'machine learning': "Machine Learning is a subset of AI where systems learn from data without explicit programming, using algorithms to identify patterns.",
            'programming': "Programming is writing instructions for computers to execute. It involves logic, algorithms, and understanding how to solve problems computationally.",
            'web development': "Web development involves creating websites and web applications using technologies like HTML, CSS, and JavaScript."
        };
        
        const matchedTopic = Object.keys(topics).find(topic => 
            query.toLowerCase().includes(topic)
        ) || 'technology';
        
        return `**Explanation of "${matchedTopic.charAt(0).toUpperCase() + matchedTopic.slice(1)}":**

${topics[matchedTopic] || "This is a complex topic that involves multiple aspects. Would you like me to break it down into simpler components or provide specific examples?"}

*💡 Tip: You can ask follow-up questions like "Can you give me an example?" or "How does this apply in practice?" for more detailed explanations.*`;
    }
    
    function simulateTyping() {
        isTyping = true;
        typingStatus.style.display = 'flex';
        scrollToBottom();
    }
    
    function stopTyping() {
        isTyping = false;
        typingStatus.style.display = 'none';
    }
    
    function getRandomDelay(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    function getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    function shouldAddQuickReplies(text) {
        return text.length > 20 && !text.includes('http') && Math.random() > 0.3;
    }
    
    function handleQuickAction(action) {
        const responses = {
            code: "I'd be happy to help with code! What programming language are you working with, and what do you want to build?",
            explain: "I love explaining concepts! What topic would you like me to break down for you?",
            write: "Creative writing is one of my strengths! What should I write? (story, email, poem, etc.)",
            explain_more: "Certainly! Let me elaborate on that with more details and practical examples.",
            examples: "Here are some concrete examples to illustrate the concept better:",
            related: "Here are some related topics you might find interesting:"
        };
        
        if (responses[action]) {
            setTimeout(() => {
                addMessage(responses[action], 'ai');
            }, 500);
        }
    }
    
    function toggleTheme() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(currentTheme);
        
        // Update icon
        const icon = themeToggle.querySelector('i');
        icon.className = currentTheme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
        
        // Show toast
        showToast(`${currentTheme === 'light' ? 'Light' : 'Dark'} mode activated`);
    }
    
    function setTheme(theme) {
        document.body.className = `${theme}-theme`;
        localStorage.setItem('theme', theme);
    }
    
    function clearConversation() {
        if (conversationHistory.length > 0 && confirm('Clear all conversation history?')) {
            // Keep only welcome message
            const messages = chatContainer.querySelectorAll('.message-wrapper:not(.welcome-message)');
            messages.forEach(msg => msg.remove());
            
            // Clear history
            conversationHistory = [];
            localStorage.removeItem('rahl_conversation');
            
            showToast('Conversation cleared');
            scrollToBottom();
        }
    }
    
    function saveToHistory(userMsg, aiMsg) {
        const entry = {
            user: userMsg,
            ai: aiMsg,
            timestamp: new Date().toISOString()
        };
        
        conversationHistory.push(entry);
        
        // Keep only last 50 messages
        if (conversationHistory.length > 50) {
            conversationHistory = conversationHistory.slice(-50);
        }
        
        localStorage.setItem('rahl_conversation', JSON.stringify(conversationHistory));
    }
    
    function loadConversationHistory() {
        try {
            const saved = localStorage.getItem('rahl_conversation');
            if (saved) {
                conversationHistory = JSON.parse(saved);
                
                // Optional: Load last few messages
                if (conversationHistory.length > 0) {
                    const recent = conversationHistory.slice(-3);
                    recent.forEach(entry => {
                        addMessage(entry.user, 'user');
                        setTimeout(() => {
                            addMessage(entry.ai, 'ai');
                        }, 300);
                    });
                }
            }
        } catch (e) {
            console.error('Failed to load conversation:', e);
        }
    }
    
    function updateCharCount() {
        const length = messageInput.value.length;
        const max = 500;
        charCount.textContent = `${length}/${max}`;
        
        // Change color if near limit
        if (length > max * 0.9) {
            charCount.style.color = 'var(--danger)';
        } else if (length > max * 0.75) {
            charCount.style.color = 'var(--warning)';
        } else {
            charCount.style.color = '';
        }
    }
    
    function autoResizeTextarea() {
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 120) + 'px';
    }
    
    function scrollToBottom() {
        setTimeout(() => {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }, 100);
    }
    
    function showToast(message) {
        document.getElementById('toastMessage').textContent = message;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    function startVoiceRecognition() {
        showToast('Voice input activated - speak now');
        
        // Simulate voice input for demo
        setTimeout(() => {
            const voiceMessages = [
                "Hello RAHL, how are you today?",
                "Can you explain artificial intelligence?",
                "Write a Python function to calculate factorial",
                "What is machine learning?",
                "Help me with JavaScript array methods"
            ];
            
            const randomMessage = voiceMessages[Math.floor(Math.random() * voiceMessages.length)];
            messageInput.value = randomMessage;
            updateCharCount();
            autoResizeTextarea();
            showToast('Voice message received');
        }, 1500);
    }
    
    // Initialize character count
    updateCharCount();
    
    // Global error handler
    window.addEventListener('error', (e) => {
        console.error('RAHL Error:', e.error);
        showToast('An error occurred. Please refresh the page.');
    });
    
    // Service Worker registration for PWA
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js').catch(err => {
                console.log('ServiceWorker registration failed:', err);
            });
        });
    }
    
    // Prevent context menu on long press
    document.addEventListener('contextmenu', (e) => {
        if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
        e.preventDefault();
    });
    
    // Add haptic feedback for mobile
    function vibrate() {
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
    }
    
    // Add vibration to buttons
    document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('touchstart', vibrate);
    });
});
