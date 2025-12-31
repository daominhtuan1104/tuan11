document.addEventListener('DOMContentLoaded', () => {
    
    // Sticky Header
    const header = document.querySelector('.header');
    const heroSection = document.querySelector('.hero');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });

    // Close mobile menu when a link is clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
        });
    });

    // Registration Form Handling
    const form = document.getElementById('registrationForm');
    
    if (form) {
        // Populate workshop select options from Admin-created public workshops
        const workshopSelect = document.getElementById('workshop');
        if (workshopSelect) {
            try {
                const storedWorkshops = JSON.parse(localStorage.getItem('workshops') || '[]');
                const publicWorkshops = storedWorkshops.filter(ws => (!ws.visibility || ws.visibility === 'public') && ws.isoDate);
                if (publicWorkshops.length > 0) {
                    const formatDDMM = (iso) => {
                        const d = new Date(iso + 'T00:00:00');
                        const dd = d.getDate().toString().padStart(2, '0');
                        const mm = (d.getMonth() + 1).toString().padStart(2, '0');
                        return `${dd}/${mm}`;
                    };
                    workshopSelect.innerHTML = '<option value="" disabled selected>Chọn một tùy chọn...</option>';
                    publicWorkshops.forEach(ws => {
                        const label = `${ws.name} - ${formatDDMM(ws.isoDate)}`;
                        const opt = document.createElement('option');
                        opt.value = ws.name; // store by name for matching
                        opt.textContent = label;
                        workshopSelect.appendChild(opt);
                    });
                }
            } catch (e) {}
        }
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Simple validation simulation
            const name = document.getElementById('fullname').value;
            const email = document.getElementById('email').value;
            const phone = document.getElementById('phone').value;
            const workshop = document.getElementById('workshop').value;
            const participants = parseInt(document.getElementById('participants').value || '1', 10);
            const message = document.getElementById('message').value;
            const id = Date.now();

            if (name && email && workshop) {
                // Simulate API call
                const submitBtn = form.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerText;
                
                submitBtn.innerText = 'Đang đăng ký...';
                submitBtn.disabled = true;

                // Save to LocalStorage for Admin Panel
                const registrationData = {
                    id: id,
                    fullname: name,
                    email: email,
                    phone: phone,
                    workshop: workshop,
                    participants: isNaN(participants) ? 1 : participants,
                    message: message,
                    date: new Date().toISOString(),
                    status: 'active'
                };

                let registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
                registrations.push(registrationData);
                localStorage.setItem('registrations', JSON.stringify(registrations));

                setTimeout(() => {
                    // Success message
                    form.innerHTML = `
                        <div style="text-align: center; padding: 20px;">
                            <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--primary-color); margin-bottom: 20px;"></i>
                            <h3 style="color: var(--primary-color);">Cảm Ơn, ${name}!</h3>
                            <p>Bạn đã đăng ký tham gia workshop thành công.</p>
                            <p>Chúng tôi đã gửi email xác nhận tới <strong>${email}</strong>.</p>
                            <button onclick="location.reload()" class="btn btn-outline" style="margin-top: 20px;">Đăng Ký Khác</button>
                        </div>
                    `;
                }, 1500);
            }
        });
    }

    // Apply Site Config to Footer
    const applyFooterConfig = (root, cfg) => {
        if (!cfg) return;
        const socials = root.querySelectorAll('.footer-social a');
        if (socials.length >= 4) {
            if (cfg.youtube) socials[0].href = cfg.youtube;
            if (cfg.instagram) socials[1].href = cfg.instagram;
            if (cfg.tiktok) socials[2].href = cfg.tiktok;
            if (cfg.facebook) socials[3].href = cfg.facebook;
            socials.forEach(a => a.setAttribute('target', '_blank'));
        }
        const phoneEl = root.querySelector('#footerPhone');
        const websiteWrap = root.querySelector('#footerWebsiteWrap');
        const infoFirstP = root.querySelector('.footer-info p');
        
        const phoneText = (cfg.phone && cfg.phone.trim().length > 0) ? cfg.phone : '+1 234 567 890';
        const emailText = (cfg.email && cfg.email.trim().length > 0) ? cfg.email : 'contact@jiansflower.com';

        if (phoneEl) phoneEl.textContent = phoneText;
        
        // Update Email and remove website logic
        if (infoFirstP) {
            infoFirstP.innerHTML = `${emailText} | <span id="footerPhone">${phoneText}</span>`;
            if (websiteWrap) websiteWrap.style.display = 'none'; 
        } else {
             if (websiteWrap) websiteWrap.style.display = 'none';
        }
    };
    const footer = document.querySelector('.footer');
    const updateFooter = () => {
        try {
            const cfg = JSON.parse(localStorage.getItem('siteConfig') || '{}');
            const f = document.querySelector('.footer');
            if (f) applyFooterConfig(f, cfg);
        } catch (e) {
            console.error('Footer update error:', e);
        }
    };

    if (footer) updateFooter();
    // Ensure it runs on pageshow (back/forward cache) and window focus
    window.addEventListener('pageshow', updateFooter);
    window.addEventListener('focus', updateFooter);

    window.addEventListener('storage', (e) => {
        if (e.key === 'siteConfig') updateFooter();
    });
    // Load Workshops from LocalStorage if available
    const workshopContainer = document.querySelector('.workshop-grid');
    if (workshopContainer) {
        const storedWorkshops = localStorage.getItem('workshops');
        if (storedWorkshops) {
            const workshops = JSON.parse(storedWorkshops);
            if (workshops.length > 0) {
                workshopContainer.innerHTML = ''; // Clear default content
                workshops.forEach(ws => {
                    // Only show if public or visibility is undefined (backward compatibility)
                    if (!ws.visibility || ws.visibility === 'public') {
                        workshopContainer.innerHTML += `
                            <div class="card workshop-card">
                                <div class="workshop-date">
                                    <span class="day">${ws.day}</span>
                                    <span class="month">${ws.month}</span>
                                </div>
                                <div class="card-content">
                                    <span class="tag">${ws.level}</span>
                                    <h3>${ws.name}</h3>
                                    <p class="time"><i class="far fa-clock"></i> ${ws.time}</p>
                                    <p>${ws.desc}</p>
                                    <a href="#register" class="btn btn-outline">Xem Chi Tiết</a>
                                </div>
                            </div>
                        `;
                    }
                });
            }
        }
    }

    // Load Posts from LocalStorage if available
    const postContainer = document.querySelector('.vlog-grid');
    if (postContainer) {
        const storedPosts = localStorage.getItem('posts');
        if (storedPosts) {
            const posts = JSON.parse(storedPosts);
            if (posts.length > 0) {
                postContainer.innerHTML = ''; // Clear default content
                posts.forEach(post => {
                    postContainer.innerHTML += `
                        <article class="card vlog-card">
                            <div class="card-image" style="background-image: url('${post.image}')">
                                <div class="play-icon"><i class="fas fa-play"></i></div>
                            </div>
                            <div class="card-content">
                                <h3>${post.title}</h3>
                                <p>${post.desc}</p>
                                <a href="${post.link}" class="text-link">Xem Ngay</a>
                            </div>
                        </article>
                    `;
                });
            }
        }
    }

    // Load Gallery from LocalStorage if available
    const galleryContainer = document.querySelector('.gallery-grid');
    let galleryList = [];
    let currentImageIndex = -1;
    if (galleryContainer) {
        const storedGallery = localStorage.getItem('gallery');
        if (storedGallery) {
            const gallery = JSON.parse(storedGallery);
            if (gallery.length > 0) {
                galleryContainer.innerHTML = ''; // Clear default content
                gallery.forEach((url, idx) => {
                    galleryList.push(url);
                    const div = document.createElement('div');
                    div.className = 'gallery-item';
                    div.style.backgroundImage = `url('${url}')`;
                    
                    // Add click event for lightbox
                    div.addEventListener('click', () => {
                        currentImageIndex = idx;
                        lightboxImg.src = galleryList[currentImageIndex];
                        lightbox.classList.add('active');
                        document.body.style.overflow = 'hidden';
                    });
                    
                    galleryContainer.appendChild(div);
                });
            }
        }
    }

    // Lightbox Gallery
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.querySelector('.lightbox-close');
    let onLightboxKey = null; // Define variable to avoid ReferenceError

    const initGalleryInteractions = () => {
        const items = document.querySelectorAll('.gallery-grid .gallery-item');
        galleryList = [];
        items.forEach((item, idx) => {
            const bg = item.style.backgroundImage || getComputedStyle(item).backgroundImage;
            const match = bg && bg.match(/url\(["']?(.*?)["']?\)/);
            const url = match && match[1] ? match[1] : null;
            if (!url) return;
            galleryList.push(url);
            item.addEventListener('click', () => {
                currentImageIndex = idx;
                lightboxImg.src = galleryList[currentImageIndex];
                lightbox.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
        });
        const closeLightbox = () => {
            lightbox.classList.remove('active');
            document.body.style.overflow = 'auto';
            if (onLightboxKey) {
                document.removeEventListener('keydown', onLightboxKey);
                onLightboxKey = null;
            }
        };
        const showAt = (i) => {
            if (!galleryList.length) return;
            currentImageIndex = (i + galleryList.length) % galleryList.length;
            lightboxImg.classList.add('switching');
            lightboxImg.src = galleryList[currentImageIndex];
            setTimeout(() => lightboxImg.classList.remove('switching'), 180);
        };
        lightboxImg.addEventListener('click', (e) => {
            const rect = lightboxImg.getBoundingClientRect();
            const x = e.clientX - rect.left;
            if (x > rect.width / 2) {
                showAt(currentImageIndex + 1);
            } else {
                showAt(currentImageIndex - 1);
            }
            e.stopPropagation();
        });
        onLightboxKey = (e) => {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'ArrowLeft') {
                showAt(currentImageIndex - 1);
            } else if (e.key === 'ArrowRight') {
                showAt(currentImageIndex + 1);
            } else if (e.key === 'Escape') {
                closeLightbox();
            }
        };
        document.addEventListener('keydown', onLightboxKey);
        let startX = null;
        lightboxImg.addEventListener('touchstart', (ev) => {
            startX = ev.changedTouches && ev.changedTouches[0] ? ev.changedTouches[0].clientX : null;
        }, { passive: true });
        lightboxImg.addEventListener('touchend', (ev) => {
            const endX = ev.changedTouches && ev.changedTouches[0] ? ev.changedTouches[0].clientX : null;
            if (startX !== null && endX !== null) {
                const dx = endX - startX;
                if (Math.abs(dx) > 40) {
                    if (dx > 0) showAt(currentImageIndex - 1);
                    else showAt(currentImageIndex + 1);
                }
            }
            startX = null;
        });
        if (lightboxClose) {
            lightboxClose.onclick = (e) => {
                e.stopPropagation();
                closeLightbox();
            };
        }
        if (lightbox) {
            lightbox.addEventListener('click', (e) => {
                if (e.target === lightbox) {
                    const x = e.clientX;
                    const w = window.innerWidth || lightbox.clientWidth;
                    const leftZone = w * 0.33;
                    const rightZone = w * 0.67;
                    if (x <= leftZone) {
                        showAt(currentImageIndex - 1);
                    } else if (x >= rightZone) {
                        showAt(currentImageIndex + 1);
                    } else {
                        closeLightbox();
                    }
                }
            });
        }
    };
    initGalleryInteractions();

    // Chat Widget Logic
    const chatWidget = document.getElementById('chatWidget');
    const closeChatBtn = document.getElementById('closeChat');
    const navConsultation = document.getElementById('navConsultation');
    const btnConsultation = document.getElementById('btnConsultation');
    const chatInput = document.getElementById('chatInput');
    const sendChatBtn = document.getElementById('sendChatBtn');
    const chatMessages = document.getElementById('chatMessages');

    const toggleChat = (e) => {
        if (e) e.preventDefault();
        chatWidget.classList.toggle('active');
        if (chatWidget.classList.contains('active')) {
            chatInput.focus();
            scrollToBottom();
        }
    };

    if (navConsultation) navConsultation.addEventListener('click', toggleChat);
    if (btnConsultation) btnConsultation.addEventListener('click', toggleChat);
    if (closeChatBtn) closeChatBtn.addEventListener('click', () => chatWidget.classList.remove('active'));

    const scrollToBottom = () => {
        if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    const addMessage = (text, sender, save = true) => {
        const div = document.createElement('div');
        div.className = `message ${sender}`;
        div.textContent = text;
        chatMessages.appendChild(div);
        scrollToBottom();

        if (save) {
            const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
            history.push({ text, sender, timestamp: Date.now() });
            localStorage.setItem('chatHistory', JSON.stringify(history));
            // Dispatch event for other tabs/admin
            window.dispatchEvent(new Event('storage')); 
        }
    };

    const loadChatHistory = () => {
        if (!chatMessages) return;
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        // Clear non-system messages
        const systemMsg = chatMessages.querySelector('.message.system');
        chatMessages.innerHTML = '';
        if (systemMsg) chatMessages.appendChild(systemMsg);
        
        history.forEach(msg => {
            const div = document.createElement('div');
            div.className = `message ${msg.sender}`;
            div.textContent = msg.text;
            chatMessages.appendChild(div);
        });
        scrollToBottom();
    };

    loadChatHistory();

    const handleSend = () => {
        const text = chatInput.value.trim();
        if (!text) return;
        addMessage(text, 'user');
        chatInput.value = '';
    };

    if (sendChatBtn) sendChatBtn.addEventListener('click', handleSend);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }

    // Listen for replies from Admin (or other tabs)
    window.addEventListener('storage', (e) => {
        if (e.key === 'chatHistory') {
            loadChatHistory();
        }
    });
});
