// Ephemeral session ID
let sessionId = crypto.randomUUID();

// Hamburger menu
const hamburger = document.querySelector('.hamburger');
const nav = document.querySelector('.nav');

hamburger.addEventListener('click', () => {
    nav.classList.toggle('open');
    hamburger.classList.toggle('open');
});

// IntersectionObserver for animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// WhatsApp Widget
const whatsappToggle = document.getElementById('whatsapp-toggle');
const whatsappPanel = document.getElementById('whatsapp-panel');
const whatsappClose = document.getElementById('whatsapp-close');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');
const whatsappLink = document.getElementById('whatsapp-link');

// Initialize panel closed
whatsappPanel.style.display = 'none';

function toggleWhatsappPanel() {
    const isOpen = whatsappPanel.style.display !== 'none';
    whatsappPanel.style.display = isOpen ? 'none' : 'block';
    whatsappToggle.setAttribute('aria-expanded', !isOpen);
    if (!isOpen) {
        chatInput.focus();
    }
}

whatsappToggle.addEventListener('click', toggleWhatsappPanel);
whatsappClose.addEventListener('click', toggleWhatsappPanel);

// Close panel on escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !whatsappPanel.hidden) {
        toggleWhatsappPanel();
    }
});

// Update WhatsApp link
function updateWhatsappLink() {
    const preset = encodeURIComponent('Hola. Quiero implementar IA en mi empresa. Nos dedicamos a: ____');
    whatsappLink.href = `https://wa.me/5493704961782?text=${preset}`;
}

// Send message
async function sendMessage(message) {
    if (!message.trim()) return;

    // Append user message
    const userMessage = document.createElement('div');
    userMessage.className = 'chat-message user';
    userMessage.textContent = message;
    chatMessages.appendChild(userMessage);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const data = {
        sessionId,
        message: message.trim(),
        name: '',
        phone: '',
        page: window.location.href,
        utm: {
            source: new URLSearchParams(window.location.search).get('utm_source') || '',
            medium: new URLSearchParams(window.location.search).get('utm_medium') || '',
            campaign: new URLSearchParams(window.location.search).get('utm_campaign') || ''
        }
    };

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            // Start polling for response
            pollForResponse();
        } else {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'chat-message bot';
            errorMessage.textContent = 'Error al enviar. Inténtalo de nuevo.';
            chatMessages.appendChild(errorMessage);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = document.createElement('div');
        errorMessage.className = 'chat-message bot';
        errorMessage.textContent = 'Error de conexión.';
        chatMessages.appendChild(errorMessage);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// Poll for response
function pollForResponse() {
    const poll = async () => {
        try {
            const response = await fetch(`/api/response?sessionId=${sessionId}`);
            const data = await response.json();
            if (data.message) {
                const botMessage = document.createElement('div');
                botMessage.className = 'chat-message bot';
                botMessage.textContent = data.message;
                chatMessages.appendChild(botMessage);
                chatMessages.scrollTop = chatMessages.scrollHeight;
                return; // Stop polling
            }
        } catch (error) {
            console.error('Poll error:', error);
        }
        // Continue polling every 2 seconds
        setTimeout(poll, 2000);
    };
    poll();
}

chatSend.addEventListener('click', () => {
    const message = chatInput.value;
    sendMessage(message);
    chatInput.value = '';
});

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const message = chatInput.value;
        sendMessage(message);
        chatInput.value = '';
    }
});

// Initialize WhatsApp link
updateWhatsappLink();

// YouTube Lazy Load
document.querySelectorAll('.video-wrapper').forEach(wrapper => {
    const img = wrapper.querySelector('img');
    const playButton = wrapper.querySelector('.play-button');
    const youtubeId = wrapper.dataset.youtubeId;

    playButton.addEventListener('click', () => {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&start=90`;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        wrapper.innerHTML = '';
        wrapper.appendChild(iframe);
    });
});

// Success Stories Video Overlays
document.querySelectorAll('.video-play').forEach(button => {
    button.addEventListener('click', () => {
        const video = button.previousElementSibling;
        const overlay = document.createElement('div');
        overlay.className = 'video-overlay';
        overlay.innerHTML = `
            <div class="video-modal">
                <button class="video-close" aria-label="Cerrar video">×</button>
                <video controls autoplay>
                    <source src="${video.querySelector('source').src}" type="video/mp4">
                </video>
            </div>
        `;
        document.body.appendChild(overlay);

        const closeButton = overlay.querySelector('.video-close');
        closeButton.addEventListener('click', () => {
            overlay.remove();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });

        document.addEventListener('keydown', function closeOnEscape(e) {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', closeOnEscape);
            }
        });
    });
});

// Add CSS for video overlay
const style = document.createElement('style');
style.textContent = `
    .video-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        opacity: 0;
        animation: fadeIn 0.3s forwards;
    }
    .video-modal {
        position: relative;
        max-width: 90%;
        max-height: 90%;
    }
    .video-modal video {
        width: 100%;
        height: auto;
        max-height: 80vh;
    }
    .video-close {
        position: absolute;
        top: -40px;
        right: 0;
        background: none;
        border: none;
        color: white;
        font-size: 2rem;
        cursor: pointer;
    }
    @keyframes fadeIn {
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);

// Mobile sticky CTA (if needed)
if (window.innerWidth < 768) {
    const stickyCta = document.createElement('a');
    stickyCta.href = 'https://wa.me/5493704961782?text=Hola.%20Quiero%20implementar%20IA%20en%20mi%20empresa.%20Nos%20dedicamos%20a%3A%20____';
    stickyCta.className = 'cta-button primary sticky-cta';
    stickyCta.textContent = 'Comienza Ahora';
    document.body.appendChild(stickyCta);

    const stickyStyle = document.createElement('style');
    stickyStyle.textContent = `
        .sticky-cta {
            position: fixed;
            bottom: 100px;
            right: 20px;
            z-index: 999;
            display: none;
        }
        .sticky-cta.show {
            display: block;
        }
    `;
    document.head.appendChild(stickyStyle);

    window.addEventListener('scroll', () => {
        const hero = document.getElementById('hero');
        const heroBottom = hero.offsetTop + hero.offsetHeight;
        if (window.scrollY > heroBottom) {
            stickyCta.classList.add('show');
        } else {
            stickyCta.classList.remove('show');
        }
    });
}