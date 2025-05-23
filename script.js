// 加载动画控制
window.addEventListener('DOMContentLoaded', () => {
    const loadingScreen = document.querySelector('.loading-screen');
    const progressBar = document.querySelector('.progress-bar');
    const loadingText = document.querySelector('.loading-text');
    let progress = 0;
    let targetProgress = 0;
    
    // 平滑更新进度条
    function updateProgress() {
        progress += (targetProgress - progress) * 0.2;
        
        if (progress >= 99.9) {
            progress = 100;
            progressBar.style.width = '100%';
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 400);
            return;
        }
        
        progressBar.style.width = `${progress}%`;
        requestAnimationFrame(updateProgress);
    }
    
    // 模拟加载进度
    function simulateLoading() {
        const interval = setInterval(() => {
            targetProgress += 20;
            
            if (targetProgress >= 100) {
                clearInterval(interval);
                targetProgress = 100;
            }
            
            // 更新加载文本
            if (targetProgress < 30) {
                loadingText.textContent = "正在初始化...";
            } else if (targetProgress < 60) {
                loadingText.textContent = "加载资源中...";
            } else if (targetProgress < 90) {
                loadingText.textContent = "马上就好...";
            } else {
                loadingText.textContent = "准备就绪！";
            }
        }, 100);
    }
    
    // 启动加载动画
    simulateLoading();
    updateProgress();
});

// DOM 元素
const DOM = {
    chatMessages: null,
    userInput: null,
    sendButton: null,
    danmakuArea: null,
    danmakuSection: null
};

// 配置
const CONFIG = {
    API_KEY: 'sk-91068f5a15504eaaaaf0cfee075b48b3',
    API_URL: 'https://api.deepseek.com/v1/chat/completions'
};

// 对话历史
let conversationHistory = [];

// 初始化变量
let danmakuHistory = [];
const maxHistoryItems = 50; // 最多保存50条历史记录

// DOM 元素
const historyPanel = document.querySelector('.danmaku-history');
const historyToggle = document.querySelector('.history-toggle');
const historyList = document.querySelector('.history-list');

// 切换历史面板显示
historyToggle.addEventListener('click', () => {
    historyPanel.classList.toggle('active');
});

// 添加弹幕到历史记录
function addToHistory(text) {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // 创建新的历史记录
    const historyItem = {
        text,
        time,
        date: now.toLocaleDateString()
    };
    
    // 添加到历史数组开头
    danmakuHistory.unshift(historyItem);
    
    // 限制历史记录数量
    if (danmakuHistory.length > maxHistoryItems) {
        danmakuHistory.pop();
    }
    
    // 更新显示
    updateHistoryDisplay();
    
    // 保存到localStorage
    saveHistory();
}

// 更新历史记录显示
function updateHistoryDisplay() {
    historyList.innerHTML = '';
    danmakuHistory.forEach(item => {
        const historyElement = document.createElement('div');
        historyElement.className = 'history-item';
        historyElement.innerHTML = `
            ${item.text}
            <span class="time">${item.date} ${item.time}</span>
        `;
        historyList.appendChild(historyElement);
    });
}

// 保存历史记录到localStorage
function saveHistory() {
    localStorage.setItem('danmakuHistory', JSON.stringify(danmakuHistory));
}

// 从localStorage加载历史记录
function loadHistory() {
    const savedHistory = localStorage.getItem('danmakuHistory');
    if (savedHistory) {
        danmakuHistory = JSON.parse(savedHistory);
        updateHistoryDisplay();
    }
}

// 在页面加载时加载历史记录
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});

// 初始化函数
function initializeChat() {
    console.log('初始化聊天模块');
    
    // 初始化 DOM 元素
    DOM.chatMessages = document.getElementById('chatMessages');
    DOM.userInput = document.getElementById('userInput');
    DOM.sendButton = document.getElementById('sendMessage');
    DOM.danmakuArea = document.querySelector('.danmaku-area');
    DOM.danmakuSection = document.querySelector('.danmaku-section');
    
    // 检查必要的 DOM 元素
    const elementStatus = {
        chatMessages: !!DOM.chatMessages,
        userInput: !!DOM.userInput,
        sendButton: !!DOM.sendButton,
        danmakuArea: !!DOM.danmakuArea,
        danmakuSection: !!DOM.danmakuSection
    };
    console.log('DOM元素状态:', elementStatus);
    
    if (!DOM.sendButton || !DOM.userInput || !DOM.chatMessages) {
        console.error('必要的DOM元素未找到');
        return false;
    }
    
    // 初始化对话历史
    conversationHistory = [{
        role: "system",
        content: "你是一个友好、专业的AI助手。请用简洁、自然的语气回答问题。回答要有趣味性，但要保持专业性。"
    }];
    
    // 绑定事件
    bindEvents();
    
    console.log('聊天模块初始化完成');
    return true;
}

// 绑定事件
function bindEvents() {
    // 发送按钮点击事件
    DOM.sendButton.addEventListener('click', function(e) {
        console.log('发送按钮被点击');
        e.preventDefault();
        handleSend();
    });
    
    // 输入框回车事件
    DOM.userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
    
    // 输入框焦点效果
    DOM.userInput.addEventListener('focus', () => {
        DOM.userInput.parentElement.style.boxShadow = '0 0 0 4px rgba(79, 172, 254, 0.1)';
    });
    
    DOM.userInput.addEventListener('blur', () => {
        DOM.userInput.parentElement.style.boxShadow = 'none';
    });
}

// 处理发送消息
async function handleSend() {
    console.log('handleSend 函数被调用');
    if (!DOM.userInput || !DOM.sendButton) {
        console.error('DOM元素未初始化');
        return;
    }
    
    const message = DOM.userInput.value.trim();
    if (!message) {
        console.log('消息为空，不发送');
        return;
    }

    try {
        DOM.userInput.disabled = true;
        DOM.sendButton.disabled = true;
        addMessage(message, true);
        DOM.userInput.value = '';
        
        const loadingDiv = showTypingIndicator();
        
        try {
            const response = await sendToAI(message);
            console.log('收到AI响应:', response);
            addMessage(response);
            
            if (message === '新年快乐') {
                createSpecialDanmaku();
            }
        } catch (error) {
            console.error('AI响应错误:', error);
            addMessage(`抱歉，我遇到了一些问题：${error.message}`);
        } finally {
            if (loadingDiv && loadingDiv.parentNode) {
                loadingDiv.parentNode.removeChild(loadingDiv);
            }
        }
    } catch (error) {
        console.error('处理消息时出错:', error);
        addMessage('抱歉，发生了一些错误，请稍后重试。');
    } finally {
        DOM.userInput.disabled = false;
        DOM.sendButton.disabled = false;
        DOM.userInput.focus();
    }
}

// 添加消息到聊天框
function addMessage(message, isUser = false) {
    if (!DOM.chatMessages) {
        console.error('聊天消息容器未初始化');
        return;
    }
    
    console.log('添加消息:', { message, isUser });
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'ai-message'}`;
    
    // 创建内部的段落元素
    const paragraph = document.createElement('p');
    paragraph.textContent = message; // 使用 textContent 而不是 innerHTML 以防止 XSS
    messageDiv.appendChild(paragraph);
    
    // 添加到聊天框并滚动到底部
    DOM.chatMessages.appendChild(messageDiv);
    
    // 确保滚动到最新消息
    requestAnimationFrame(() => {
        DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
        messageDiv.classList.add('show'); // 添加显示动画
    });
}

// 显示加载动画
function showTypingIndicator() {
    if (!DOM.chatMessages) {
        console.error('聊天消息容器未初始化');
        return null;
    }
    
    console.log('显示加载动画');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message typing';
    loadingDiv.innerHTML = `
        <div class="typing-indicator">
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        </div>
    `;
    
    // 添加到聊天框并滚动到底部
    DOM.chatMessages.appendChild(loadingDiv);
    requestAnimationFrame(() => {
        DOM.chatMessages.scrollTop = DOM.chatMessages.scrollHeight;
        loadingDiv.classList.add('show');
    });
    
    return loadingDiv;
}

// 发送消息到 API
async function sendToAI(message) {
    console.log('发送消息到API:', message);
    try {
        conversationHistory.push({
            role: "user",
            content: message
        });

        const requestBody = {
            model: "deepseek-chat",
            messages: conversationHistory,
            temperature: 0.7,
            max_tokens: 2000,
            top_p: 0.95,
            presence_penalty: 0.6,
            frequency_penalty: 0.5,
            stream: false
        };

        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.API_KEY}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        const responseData = await response.json();
        console.log('API响应:', responseData);

        if (!response.ok) {
            throw new Error(`API 请求失败: ${response.status}`);
        }

        if (responseData.choices && responseData.choices[0]) {
            const aiResponse = responseData.choices[0].message.content;
            conversationHistory.push({
                role: "assistant",
                content: aiResponse
            });
            return aiResponse;
        } else {
            throw new Error('无效的 API 响应');
        }
    } catch (error) {
        console.error('API 调用错误:', error);
        throw error;
    }
}

// 创建特殊弹幕
function createSpecialDanmaku() {
    if (!DOM.danmakuArea || !DOM.danmakuSection) {
        console.error('弹幕相关DOM元素未初始化');
        return;
    }
    
    const colors = ['#ff0000', '#ff69b4', '#ff1493', '#ff4500', '#ffd700'];
    const messages = ['新年快乐！', '恭喜发财！', '万事如意！', '心想事成！', '大吉大利！'];
    const icons = ['fa-star', 'fa-heart', 'fa-gift', 'fa-coins', 'fa-dragon'];
    
    messages.forEach((msg, index) => {
        setTimeout(() => {
            const danmaku = document.createElement('div');
            danmaku.className = 'danmaku-item special-danmaku';
            danmaku.innerHTML = `
                <i class="fas ${icons[index]} danmaku-icon" style="color: ${colors[index]}"></i>
                <span class="danmaku" style="color: ${colors[index]}; text-shadow: 0 0 10px ${colors[index]}80">${msg}</span>
            `;
            DOM.danmakuArea.appendChild(danmaku);
            
            const duration = 8000;
            const startPosition = window.innerWidth;
            danmaku.style.top = `${Math.random() * 80}px`;
            danmaku.style.transform = `translateX(${startPosition}px)`;
            
            requestAnimationFrame(() => {
                danmaku.style.transition = `transform ${duration}ms linear`;
                danmaku.style.transform = 'translateX(-100%)';
            });
            
            setTimeout(() => {
                DOM.danmakuArea.removeChild(danmaku);
            }, duration);
        }, index * 500);
    });

    DOM.danmakuSection.classList.add('active');
    setTimeout(() => {
        DOM.danmakuSection.classList.remove('active');
    }, 10000);
}

// 当 DOM 加载完成时初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM 加载完成');
    if (initializeChat()) {
        console.log('聊天模块初始化成功');
    } else {
        console.error('聊天模块初始化失败');
    }
});

// DOM 元素
document.addEventListener('DOMContentLoaded', () => {
    const avatar = document.getElementById('avatar');
    const avatarModal = document.querySelector('.avatar-modal');
    const closeModal = document.querySelector('.close-modal');
    const rocketLauncher = document.querySelector('.rocket-launcher');
    const rocketIcon = document.querySelector('.rocket-icon');
    const messageInput = document.querySelector('.message-input');
    const inputField = messageInput.querySelector('input');
    const sendButton = messageInput.querySelector('button');
    const danmakuSection = document.querySelector('.danmaku-section');
    const danmakuArea = document.querySelector('.danmaku-area');
    
    // 添加图集相关的DOM元素
    const galleryModal = document.querySelector('.gallery-modal');
    const galleryContent = document.querySelector('.gallery-content');
    const closeGallery = document.querySelector('.close-gallery');
    const activityCards = document.querySelectorAll('.activity-card');

    // 头像点击事件
    avatar.addEventListener('click', () => {
        avatarModal.style.display = 'flex';
        requestAnimationFrame(() => {
            avatarModal.classList.add('active');
        });
    });

    // 关闭头像模态框
    closeModal.addEventListener('click', () => {
        avatarModal.classList.remove('active');
        setTimeout(() => {
            avatarModal.style.display = 'none';
        }, 300);
    });

    // 点击火箭图标显示输入框
    rocketIcon.addEventListener('click', (event) => {
        event.stopPropagation();
        if (!rocketIcon.classList.contains('active')) {
            rocketIcon.classList.add('active');
            messageInput.classList.add('active');
            inputField.focus();
        }
    });

    // 点击其他区域隐藏输入框
    document.addEventListener('click', (event) => {
        if (!rocketLauncher.contains(event.target)) {
            rocketIcon.classList.remove('active');
            messageInput.classList.remove('active');
        }
    });

    // 防止输入框点击事件冒泡
    messageInput.addEventListener('click', (event) => {
        event.stopPropagation();
    });

    // 添加防抖函数
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 添加节流函数
    function throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // 优化后的创建弹幕函数
    function createDanmaku(text, isHistory = false) {
        // 创建文档片段来减少DOM操作
        const fragment = document.createDocumentFragment();
        const danmakuItem = document.createElement('div');
        danmakuItem.className = 'danmaku-item';
        
        const icon = document.createElement('i');
        icon.className = isHistory ? 'fas fa-history danmaku-icon history' : 'fas fa-heart danmaku-icon';
        
        const message = document.createElement('div');
        message.className = isHistory ? 'danmaku history' : 'danmaku';
        message.textContent = text;
        
        danmakuItem.appendChild(icon);
        danmakuItem.appendChild(message);
        
        // 批量设置样式
        const top = Math.random() * 110 + 20;
        const speed = 8 + Math.random() * 4;
        Object.assign(danmakuItem.style, {
            position: 'absolute',
            left: '100%',
            top: `${top}px`,
            animation: `danmakuMove ${speed}s linear`,
            opacity: isHistory ? '0.6' : '1'
        });
        
        fragment.appendChild(danmakuItem);
        requestAnimationFrame(() => {
            danmakuArea.appendChild(fragment);
        });
        
        // 使用 requestAnimationFrame 优化动画
        const cleanup = () => {
            requestAnimationFrame(() => {
                if (danmakuItem.parentNode) {
                    danmakuItem.remove();
                    
                    // 检查是否还有其他弹幕
                    if (danmakuArea.children.length === 0) {
                        const mainContent = document.querySelector('main');
                        danmakuSection.classList.remove('active');
                        mainContent.classList.remove('danmaku-active');
                        requestAnimationFrame(() => {
                            danmakuSection.style.display = 'none';
                        });
                    }
                }
            });
        };
        
        danmakuItem.addEventListener('animationend', cleanup);
    }

    // 发送弹幕
    function sendDanmaku() {
        const text = inputField.value.trim();
        const mainContent = document.querySelector('main');
        
        if (text) {
            // 显示弹幕区域
            if (danmakuSection.style.display !== 'block') {
                danmakuSection.style.display = 'block';
                requestAnimationFrame(() => {
                    danmakuSection.classList.add('active');
                    mainContent.classList.add('danmaku-active');
                });
            }
            
            // 发送实时弹幕
            createDanmaku(text, false);
            
            // 随机选择2-3条历史弹幕一起显示
            const historyCount = Math.floor(Math.random() * 2) + 2; // 2-3条
            const historyItems = [...danmakuHistory];
            for (let i = 0; i < historyCount && historyItems.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * historyItems.length);
                const historyItem = historyItems.splice(randomIndex, 1)[0];
                setTimeout(() => {
                    createDanmaku(historyItem.text, true);
                }, Math.random() * 1000); // 随机延迟0-1秒
            }
            
            addToHistory(text); // 添加到历史记录
            inputField.value = '';
            inputField.focus();
            
            // 特殊弹幕效果
            if (text === '新年快乐') {
                createSpecialDanmaku();
            }
        }
    }

    // 发送按钮点击事件
    sendButton.addEventListener('click', (event) => {
        event.stopPropagation();
        sendDanmaku();
    });

    // 按回车发送弹幕
    inputField.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendDanmaku();
        }
    });

    // 添加动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes danmakuMove {
            0% { 
                transform: translateX(0);
                opacity: 0;
            }
            5% {
                opacity: 1;
            }
            95% {
                opacity: 1;
            }
            100% { 
                transform: translateX(-120vw);
                opacity: 0;
            }
        }
        
        @keyframes iconSway {
            0% { 
                transform: translateY(0) scale(1);
            }
            25% {
                transform: translateY(-3px) scale(1.1);
            }
            50% {
                transform: translateY(0) scale(1);
            }
            75% {
                transform: translateY(3px) scale(1.1);
            }
            100% { 
                transform: translateY(0) scale(1);
            }
        }
    `;
    document.head.appendChild(style);

    // 访问计数器
    const visitorCountElement = document.getElementById('visitorCount');
    let visitorCount = localStorage.getItem('visitorCount') || 0;
    visitorCount++;
    
    // 添加动画效果
    function updateCounter(count) {
        visitorCountElement.textContent = count;
        visitorCountElement.classList.remove('count-update');
        void visitorCountElement.offsetWidth; // 触发重绘
        visitorCountElement.classList.add('count-update');
    }
    
    // 使用 setTimeout 延迟显示，让动画更明显
    setTimeout(() => {
        updateCounter(visitorCount);
        localStorage.setItem('visitorCount', visitorCount);
    }, 500);

    // 答案之书功能
    const answerBook = document.querySelector('.answer-book');
    const bookCover = document.querySelector('.book-cover');
    const bookAnswer = document.querySelector('.book-answer');
    const answerText = bookAnswer.querySelector('p');
    const askAgainBtn = document.querySelector('.ask-again');

    // 答案列表
    const answers = [
        "去做吧，不要犹豫",
        "现在机会来了",
        "相信你的直觉",
        "这是一个好主意",
        "需要再等等",
        "保持耐心",
        "不要着急",
        "专注当下",
        "保持希望",
        "继续努力",
        "不要放弃",
        "值得尝试",
        "相信自己",
        "勇敢前行",
        "保持冷静"
    ];

    // 获取随机答案
    function getRandomAnswer() {
        const randomIndex = Math.floor(Math.random() * answers.length);
        return answers[randomIndex];
    }

    // 点击答案之书
    answerBook.addEventListener('click', function(event) {
        if (event.target.closest('.ask-again')) return;
        
        bookCover.style.display = 'none';
        bookAnswer.style.display = 'block';
        
        // 添加渐入动画
        requestAnimationFrame(() => {
            bookAnswer.classList.add('active');
            answerText.textContent = getRandomAnswer();
        });
    });

    // 再问一次
    askAgainBtn.addEventListener('click', function(event) {
        event.stopPropagation();
        answerText.style.opacity = '0';
        answerText.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            answerText.textContent = getRandomAnswer();
            requestAnimationFrame(() => {
                answerText.style.opacity = '1';
                answerText.style.transform = 'translateY(0)';
            });
        }, 300);
    });

    // 图集模态框滚动处理
    if (galleryModal && galleryContent) {
        let isMouseOverGallery = false;

        // 监听鼠标进入/离开图集内容区域
        galleryContent.addEventListener('mouseenter', () => {
            isMouseOverGallery = true;
        });

        galleryContent.addEventListener('mouseleave', () => {
            isMouseOverGallery = false;
        });

        // 处理滚动事件
        document.addEventListener('wheel', (e) => {
            if (galleryModal.classList.contains('active')) {
                if (isMouseOverGallery) {
                    // 鼠标在图集内部时，允许图集滚动
                    e.stopPropagation();
                } else {
                    // 鼠标在图集外部时，允许页面滚动
                    galleryModal.style.pointerEvents = 'none';
                    setTimeout(() => {
                        galleryModal.style.pointerEvents = 'auto';
                    }, 100);
                }
            }
        }, { passive: true });

        // 修改打开图集的代码
        document.addEventListener('click', function(e) {
            if (e.target.closest('.view-gallery')) {
                e.preventDefault();
                e.stopPropagation();
                
                const card = e.target.closest('.activity-card');
                if (!card) return;
                
                const activityTitle = card.querySelector('.activity-info h4')?.textContent;
                if (!activityTitle || !galleryModal) return;
                
                requestAnimationFrame(() => {
                    galleryModal.style.display = 'block';
                    document.body.style.overflow = 'auto'; // 允许页面滚动
                    requestAnimationFrame(() => {
                        galleryModal.classList.add('active');
                    });
                });
            }
        });

        // 修改关闭图集的代码
        if (closeGallery) {
            closeGallery.addEventListener('click', function() {
                galleryModal.classList.remove('active');
                setTimeout(() => {
                    galleryModal.style.display = 'none';
                }, 300);
            });
        }

        // 点击模态框背景关闭
        galleryModal.addEventListener('click', function(e) {
            if (e.target === galleryModal) {
                galleryModal.classList.remove('active');
                setTimeout(() => {
                    galleryModal.style.display = 'none';
                }, 300);
            }
        });
    }

    // 图片预览相关元素
    const imagePreviewModal = document.querySelector('.image-preview-modal');
    const previewImage = document.querySelector('.preview-image');
    const previewCaption = document.querySelector('.preview-caption');
    const closePreviewBtn = document.querySelector('.close-preview');

    // 关闭预览
    function closeImagePreview() {
        imagePreviewModal.classList.remove('active');
        setTimeout(() => {
            imagePreviewModal.style.display = 'none';
            previewImage.src = '';
            previewCaption.textContent = '';
        }, 300);
    }

    // 点击关闭按钮
    closePreviewBtn.addEventListener('click', closeImagePreview);

    // 点击模态框背景关闭
    imagePreviewModal.addEventListener('click', function(e) {
        if (e.target === imagePreviewModal) {
            closeImagePreview();
        }
    });

    // ESC键关闭
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && imagePreviewModal.classList.contains('active')) {
            closeImagePreview();
        }
    });
});

// 页面滚动处理
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('nav a, .side-nav a');
    
    // 初始化显示首页
    sections[0].classList.add('active');
    
    // 监听滚动事件
    function onScroll() {
        const scrollPos = window.scrollY;
        
        // 检查每个部分的位置
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
                // 激活当前部分
                section.classList.add('active');
                
                // 更新导航状态
                const currentId = section.getAttribute('id');
                navLinks.forEach(link => {
                    if (link.getAttribute('href') === `#${currentId}`) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    }
    
    // 添加滚动监听
    window.addEventListener('scroll', onScroll);
    
    // 平滑滚动处理
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                targetSection.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

// 社交链接显示逻辑
const footer = document.querySelector('footer');

function checkFooterVisibility() {
    const scrollPosition = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollPosition + windowHeight >= documentHeight - 100) {
        footer.classList.add('visible');
    } else {
        footer.classList.remove('visible');
    }
}

// 添加滚动和调整大小的事件监听器
window.addEventListener('scroll', checkFooterVisibility);
window.addEventListener('resize', checkFooterVisibility);

// 初始检查
checkFooterVisibility();

// 发送弹幕的处理
sendButton.addEventListener('click', () => {
    const message = inputField.value.trim();
    if (message) {
        // 检查新年快乐彩蛋
        if (message === '新年快乐') {
            createSpecialDanmaku();
        } else {
            createDanmaku(message);
        }
        inputField.value = '';
        rocketIcon.classList.remove('active');
        messageInput.classList.remove('active');
    }
});

// 在页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    // 其他初始化代码
});
