// admin.js

document.addEventListener('DOMContentLoaded', () => {
    
    // Login Logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;

            if (user === 'admin' && pass === 'admin123') {
                localStorage.setItem('isAdmin', 'true');
                window.location.href = 'dashboard.html';
            } else {
                document.getElementById('loginMessage').innerText = 'Tên đăng nhập hoặc mật khẩu sai!';
                document.getElementById('loginMessage').style.color = 'red';
            }
        });
        return; // Stop here if on login page
    }

    // Dashboard Logic
    if (window.location.pathname.includes('dashboard.html')) {
        checkAuth();
        loadDashboardData();
        loadMembers();
        loadWorkshops();
        loadPosts();
        loadGallery();
        loadSiteConfigForm();
        renderSiteConfigPreview();
        loadAdminChat();

        // Add Workshop Form
        const addWsForm = document.getElementById('addWorkshopForm');
        if (addWsForm) {
            addWsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveWorkshop();
            });
        }

        // Add Post Form
        const addPostForm = document.getElementById('addPostForm');
        if (addPostForm) {
            addPostForm.addEventListener('submit', (e) => {
                e.preventDefault();
                savePost();
            });
        }

        // Add Gallery Form
        const addGalleryForm = document.getElementById('addGalleryForm');
        if (addGalleryForm) {
            addGalleryForm.addEventListener('submit', (e) => {
                e.preventDefault();
                saveGalleryImage();
            });
        }

        const memberSearch = document.getElementById('memberSearch');
        if (memberSearch) {
            memberSearch.addEventListener('input', () => {
                renderMembers(memberSearch.value.trim().toLowerCase());
            });
        }

        // Use delegation for form submit to ensure it works even if DOM timing is off
        document.body.addEventListener('submit', (e) => {
            if (e.target && e.target.id === 'siteConfigForm') {
                e.preventDefault();
                saveSiteConfig();
            }
        });
        
        // Edit Registration Form
        const editRegForm = document.getElementById('editRegForm');
        if (editRegForm) {
             editRegForm.addEventListener('submit', (e) => {
                 e.preventDefault();
                 saveRegistrationEdit();
             });
        }
        
        // Media Library Input Listener
        const mediaInput = document.getElementById('mediaUploadFile');
        if (mediaInput) {
             mediaInput.addEventListener('change', uploadMediaFile);
        }
    }
});

function checkAuth() {
    if (localStorage.getItem('isAdmin') !== 'true') {
        window.location.href = 'admin.html';
    }
}

function logout() {
    localStorage.removeItem('isAdmin');
    window.location.href = 'admin.html';
}

function showSection(sectionId) {
    document.querySelectorAll('.section-container').forEach(el => el.classList.remove('active'));
    document.getElementById(sectionId).classList.add('active');
    document.querySelectorAll('.sidebar-menu li').forEach(el => el.classList.remove('active'));
    // Ideally highlight the clicked menu item, but for now simple toggle
    event.currentTarget.classList.add('active');
    if (sectionId === 'workshops') {
        // Re-render calendar and grid to ensure correct sizing when section becomes visible
        loadWorkshops();
    }
}

function notify(text) {
    const overlay = document.getElementById('notifyOverlay');
    const txt = document.getElementById('notifyText');
    if (overlay && txt) {
        txt.innerText = text;
        overlay.classList.add('active');
        setTimeout(() => overlay.classList.remove('active'), 2000);
    } else {
        alert(text);
    }
}
function notifySuccess() {
    notify('Cập nhật thành công');
}

// --- Dashboard Data ---
function loadDashboardData() {
    const regs = JSON.parse(localStorage.getItem('registrations') || '[]');
    const workshops = JSON.parse(localStorage.getItem('workshops') || '[]');
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    
    document.getElementById('totalReg').innerText = regs.length;
    document.getElementById('totalWorkshops').innerText = workshops.length;
    // Update vlog count if element exists
    const vlogCount = document.querySelectorAll('.stat-card p')[2]; 
    if(vlogCount) vlogCount.innerText = posts.length;

    // Recent Registrations
    const tbody = document.getElementById('recentRegTable');
    if (tbody) {
        tbody.innerHTML = '';
        regs.slice(-5).reverse().forEach(reg => {
            const tr = document.createElement('tr');
            const status = reg.status === 'cancelled' ? 'Đã hủy' : 'Mới';
            const statusClass = reg.status === 'cancelled' ? 'status-cancelled' : 'status-active';
            tr.innerHTML = `
                <td>${reg.fullname}</td>
                <td>${reg.email}</td>
                <td>${reg.phone}</td>
                <td>${reg.participants}</td>
                <td>${reg.workshop}</td>
                <td>${new Date(reg.date).toLocaleDateString()}</td>
                <td><span class="status-badge ${statusClass}">${status}</span></td>
                <td>
                    <button class="btn-icon" onclick="editRegistration(${reg.id})"><i class="fas fa-edit"></i></button>
                    ${reg.status === 'cancelled' ? '' : `<button class="btn-icon delete" onclick="cancelRegistration(${reg.id})"><i class="fas fa-ban"></i></button>`}
                </td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// --- Members / Registrations ---
function loadMembers() {
    renderMembers();
}

function renderMembers(filter = '') {
    const tbody = document.getElementById('membersTable');
    if (!tbody) return;
    const regs = JSON.parse(localStorage.getItem('registrations') || '[]');
    tbody.innerHTML = '';
    const map = new Map();
    regs.forEach(reg => {
        if (reg.status === 'cancelled') return;
        const key = `${reg.email || ''}|${reg.phone || ''}`;
        if (!map.has(key)) {
            map.set(key, { fullname: reg.fullname, email: reg.email || '', phone: reg.phone || '', total: 1 });
        } else {
            const v = map.get(key);
            v.total += 1;
            map.set(key, v);
        }
    });
    const rows = Array.from(map.values()).filter(r => {
        if (!filter) return true;
        const f = filter.toLowerCase();
        return (r.fullname || '').toLowerCase().includes(f) || (r.email || '').toLowerCase().includes(f) || (r.phone || '').includes(f);
    }).sort((a, b) => (a.fullname || '').localeCompare(b.fullname || ''));
    rows.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${r.fullname}</td>
            <td>${r.phone}</td>
            <td>${r.email}</td>
            <td>${r.total}</td>
        `;
        tbody.appendChild(tr);
    });
}

function editRegistration(id) {
    const regs = JSON.parse(localStorage.getItem('registrations') || '[]');
    const reg = regs.find(r => r.id == id);
    if (!reg) return;
    
    const modal = document.getElementById('regModal');
    if (modal) {
        document.getElementById('editRegId').value = reg.id;
        document.getElementById('editRegName').value = reg.fullname;
        document.getElementById('editRegEmail').value = reg.email;
        document.getElementById('editRegPhone').value = reg.phone;
        const wsSelect = document.getElementById('editRegWorkshop');
        if(wsSelect) {
             wsSelect.innerHTML = `<option value="${reg.workshop}" selected>${reg.workshop}</option>`;
        }
        document.getElementById('editRegParticipants').value = reg.participants;
        modal.classList.add('active');
    } else {
        const current = parseInt(reg.participants, 10) || 1;
        const next = prompt('Nhập lại số lượng người tham gia:', String(current));
        if (next !== null) {
            const n = parseInt(next, 10);
            if (!isNaN(n) && n > 0) {
                reg.participants = n;
                const idx = regs.findIndex(r => r.id == id);
                regs[idx] = reg;
                localStorage.setItem('registrations', JSON.stringify(regs));
                loadDashboardData();
                renderMembers();
                loadWorkshops();
                notify('Đã cập nhật số lượng người tham gia.');
            } else {
                notify('Số lượng không hợp lệ.');
            }
        }
    }
}

function saveRegistrationEdit() {
    const id = document.getElementById('editRegId')?.value;
    if (!id) return;
    let regs = JSON.parse(localStorage.getItem('registrations') || '[]');
    const idx = regs.findIndex(r => r.id == id);
    if (idx === -1) return;
    regs[idx].fullname = document.getElementById('editRegName')?.value || regs[idx].fullname;
    regs[idx].email = document.getElementById('editRegEmail')?.value || regs[idx].email;
    regs[idx].phone = document.getElementById('editRegPhone')?.value || regs[idx].phone;
    regs[idx].workshop = document.getElementById('editRegWorkshop')?.value || regs[idx].workshop;
    const p = parseInt(document.getElementById('editRegParticipants')?.value, 10);
    regs[idx].participants = !isNaN(p) && p > 0 ? p : regs[idx].participants;
    const statusSel = document.getElementById('editRegStatus');
    if (statusSel) {
        const sVal = (statusSel.value || '').toLowerCase();
        regs[idx].status = sVal.includes('huỷ') || sVal.includes('hủy') || sVal === 'cancelled' ? 'cancelled' : 'active';
    }
    localStorage.setItem('registrations', JSON.stringify(regs));
    const m = document.getElementById('regModal');
    if (m) m.classList.remove('active');
    loadDashboardData();
    renderMembers();
    loadWorkshops();
    notifySuccess();
}

function cancelRegistration(id) {
    let regs = JSON.parse(localStorage.getItem('registrations') || '[]');
    const idx = regs.findIndex(r => r.id == id);
    if (idx === -1) return;
    if (!confirm('Bạn có chắc muốn hủy đăng ký này?')) return;
    regs[idx].status = 'cancelled';
    localStorage.setItem('registrations', JSON.stringify(regs));
    loadDashboardData();
    renderMembers();
    loadWorkshops();
    notifySuccess();
}

// --- Workshops ---
function loadWorkshops() {
    const grid = document.getElementById('adminWorkshopGrid');
    if (!grid) return;
    const workshops = JSON.parse(localStorage.getItem('workshops') || '[]');
    const regs = JSON.parse(localStorage.getItem('registrations') || '[]');
    const countByWorkshop = {};
    regs.forEach(r => {
        if (r.status !== 'cancelled') {
            const k = r.workshop;
            const n = parseInt(r.participants, 10);
            countByWorkshop[k] = (countByWorkshop[k] || 0) + (isNaN(n) ? 1 : n);
        }
    });
    grid.innerHTML = '';
    
    workshops.forEach((ws, index) => {
        const div = document.createElement('div');
        div.className = 'card workshop-card';
        div.innerHTML = `
            <div class="card-content">
                <span class="tag">${ws.visibility || 'public'}</span>
                <h3>${ws.name}</h3>
                <p>${ws.isoDate} ${ws.startTime && ws.endTime ? `| ${ws.startTime} - ${ws.endTime}` : ''}</p>
                <p><strong>${countByWorkshop[ws.name] || 0} người tham dự</strong></p>
                <p>${ws.desc}</p>
                <div style="margin-top:10px;">
                    <button class="btn-icon" onclick="editWorkshop(${index})"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="deleteWorkshop(${index})"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        grid.appendChild(div);
    });
    
    // Calendar Logic (Simplified)
    const calEl = document.getElementById('calendar');
    if (calEl && window.FullCalendar) {
        calEl.innerHTML = ''; // Clear previous
        const calendar = new FullCalendar.Calendar(calEl, {
            initialView: 'dayGridMonth',
            initialDate: workshops.length ? workshops[0].isoDate : undefined,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth'
            },
            height: 650,
            expandRows: true,
            locale: 'vi',
            buttonText: { today: 'Hôm nay' },
            events: workshops.map(ws => ({
                title: `${ws.name} (${countByWorkshop[ws.name] || 0})`,
                start: ws.isoDate,
                color: ws.visibility === 'private' ? '#999' : '#5a7d68',
                extendedProps: {
                    count: countByWorkshop[ws.name] || 0
                }
            }))
        });
        calendar.render();
    }
}

function saveWorkshop() {
    const index = parseInt(document.getElementById('editWorkshopIndex').value);
    const ws = {
        name: document.getElementById('wsName').value,
        isoDate: document.getElementById('wsDateInput').value,
        startTime: document.getElementById('wsStartTime').value,
        endTime: document.getElementById('wsEndTime').value,
        level: document.getElementById('wsLevel').value,
        desc: document.getElementById('wsDesc').value,
        visibility: document.getElementById('wsVisibility').value,
        notes: document.getElementById('wsNotes').value
    };
    
    // Derived fields for display
    const d = new Date(ws.isoDate);
    ws.day = d.getDate();
    ws.month = d.toLocaleString('default', { month: 'short' });
    ws.time = `${ws.startTime} - ${ws.endTime}`;

    let workshops = JSON.parse(localStorage.getItem('workshops') || '[]');
    if (index === -1) {
        workshops.push(ws);
    } else {
        workshops[index] = ws;
    }
    localStorage.setItem('workshops', JSON.stringify(workshops));
    closeModal('workshopModal');
    loadWorkshops();
    notify('Đã lưu workshop!');
}

function editWorkshop(index) {
    let workshops = JSON.parse(localStorage.getItem('workshops') || '[]');
    const ws = workshops[index];
    if (!ws) return;
    
    document.getElementById('editWorkshopIndex').value = index;
    document.getElementById('wsName').value = ws.name;
    document.getElementById('wsDateInput').value = ws.isoDate;
    document.getElementById('wsStartTime').value = ws.startTime;
    document.getElementById('wsEndTime').value = ws.endTime;
    document.getElementById('wsLevel').value = ws.level || '';
    document.getElementById('wsDesc').value = ws.desc;
    document.getElementById('wsVisibility').value = ws.visibility || 'public';
    document.getElementById('wsNotes').value = ws.notes || '';
    
    document.getElementById('workshopModalLabel').innerText = 'Chỉnh Sửa Workshop';
    document.getElementById('workshopModal').classList.add('active');
}

function deleteWorkshop(index) {
    if(!confirm('Bạn có chắc muốn xoá?')) return;
    let workshops = JSON.parse(localStorage.getItem('workshops') || '[]');
    workshops.splice(index, 1);
    localStorage.setItem('workshops', JSON.stringify(workshops));
    loadWorkshops();
    notify('Đã xoá workshop.');
}

// --- Posts ---
function loadPosts() {
    const grid = document.getElementById('adminPostGrid');
    if (!grid) return;
    const posts = JSON.parse(localStorage.getItem('posts') || '[]');
    grid.innerHTML = '';
    
    posts.forEach((post, index) => {
        const div = document.createElement('div');
        div.className = 'card vlog-card';
        div.innerHTML = `
            <div class="card-image" style="background-image: url('${post.image}')"></div>
            <div class="card-content">
                <h3>${post.title}</h3>
                <p>${post.desc}</p>
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button class="btn btn-outline" style="padding: 5px 15px; font-size: 0.9rem;" onclick="editPost(${index})">Sửa</button>
                    <button class="btn btn-secondary" style="padding: 5px 15px; font-size: 0.9rem; border: 1px solid #ccc; color: #333;" onclick="deletePost(${index})">Xoá</button>
                </div>
            </div>
        `;
        grid.appendChild(div);
    });
}

function readFileAsBase64(fileInputId) {
    return new Promise((resolve, reject) => {
        const input = document.getElementById(fileInputId);
        if (input && input.files && input.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(input.files[0]);
        } else {
            resolve(null);
        }
    });
}

async function savePost() {
    const index = parseInt(document.getElementById('editPostIndex').value);
    
    let imageSrc = document.getElementById('postImage').value;
    const fileData = await readFileAsBase64('postImageFile');
    if (fileData) {
        imageSrc = fileData;
    }

    const post = {
        title: document.getElementById('postTitle').value,
        desc: document.getElementById('postDesc').value,
        image: imageSrc,
        link: document.getElementById('postLink').value
    };
    
    let posts = JSON.parse(localStorage.getItem('posts') || '[]');
    if (index === -1) {
        posts.push(post);
        notify('Đã thêm bài viết!');
    } else {
        posts[index] = post;
        notify('Đã cập nhật bài viết!');
    }
    localStorage.setItem('posts', JSON.stringify(posts));
    closeModal('postModal');
    loadPosts();
}

function editPost(index) {
    let posts = JSON.parse(localStorage.getItem('posts') || '[]');
    const post = posts[index];
    if (!post) return;
    
    document.getElementById('editPostIndex').value = index;
    document.getElementById('postTitle').value = post.title;
    document.getElementById('postDesc').value = post.desc;
    document.getElementById('postImage').value = post.image;
    document.getElementById('postLink').value = post.link;
    
    document.getElementById('postModal').classList.add('active');
}

function deletePost(index) {
    if(!confirm('Bạn có chắc muốn xoá?')) return;
    let posts = JSON.parse(localStorage.getItem('posts') || '[]');
    posts.splice(index, 1);
    localStorage.setItem('posts', JSON.stringify(posts));
    loadPosts();
    notify('Đã xoá bài viết.');
}

// --- Gallery ---
function loadGallery() {
    const grid = document.getElementById('adminGalleryGrid');
    if (!grid) return;
    const gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
    grid.innerHTML = '';
    
    gallery.forEach((url, index) => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        div.style.backgroundImage = `url('${url}')`;
        div.innerHTML = `
            <button class="btn-icon gallery-edit" onclick="editGalleryImage(${index})" style="position:absolute; top:5px; right:45px; background:#fff; width:30px; height:30px; border-radius:50%; border:none; box-shadow:0 2px 5px rgba(0,0,0,0.2); cursor:pointer;"><i class="fas fa-edit" style="color:#5a7d68"></i></button>
            <button class="btn-icon gallery-del" onclick="deleteGalleryImage(${index})"><i class="fas fa-trash"></i></button>
        `;
        grid.appendChild(div);
    });
}

async function saveGalleryImage() {
    const index = parseInt(document.getElementById('editGalleryIndex').value);
    let url = document.getElementById('galleryImage').value;
    const fileData = await readFileAsBase64('galleryFile');
    if (fileData) {
        url = fileData;
    }

    if (url) {
        let gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
        if (index === -1) {
            gallery.push(url);
            notify('Đã thêm ảnh!');
        } else {
            gallery[index] = url;
            notify('Đã cập nhật ảnh!');
        }
        localStorage.setItem('gallery', JSON.stringify(gallery));
        closeModal('galleryModal');
        loadGallery();
    }
}

function editGalleryImage(index) {
    let gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
    const url = gallery[index];
    if (!url) return;
    
    document.getElementById('editGalleryIndex').value = index;
    document.getElementById('galleryImage').value = url;
    document.getElementById('galleryModal').classList.add('active');
}

function deleteGalleryImage(index) {
    if(!confirm('Bạn có chắc muốn xoá?')) return;
    let gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
    gallery.splice(index, 1);
    localStorage.setItem('gallery', JSON.stringify(gallery));
    loadGallery();
    notify('Đã xoá ảnh.');
}

// --- Config ---
function loadSiteConfigForm() {
    const cfg = JSON.parse(localStorage.getItem('siteConfig') || '{}');
    const ids = [
        ['cfgPhone', 'phone'],
        ['cfgEmail', 'email'],
        ['cfgYoutube', 'youtube'],
        ['cfgFacebook', 'facebook'],
        ['cfgTiktok', 'tiktok'],
        ['cfgInstagram', 'instagram']
    ];
    ids.forEach(([inputId, key]) => {
        const el = document.getElementById(inputId);
        if (el) el.value = cfg[key] || '';
    });
}

function resetSiteConfigForm() {
    localStorage.removeItem('siteConfig');
    loadSiteConfigForm();
    notify('Đã khôi phục cấu hình mặc định.');
}

function saveSiteConfig() {
    const getVal = (id) => (document.getElementById(id)?.value || '').trim();
    const prev = JSON.parse(localStorage.getItem('siteConfig') || '{}');
    const cfg = {
        phone: getVal('cfgPhone'),
        email: getVal('cfgEmail'),
        youtube: getVal('cfgYoutube'),
        facebook: getVal('cfgFacebook'),
        tiktok: getVal('cfgTiktok'),
        instagram: getVal('cfgInstagram')
    };
    
    try {
        localStorage.setItem('siteConfig', JSON.stringify(cfg));
        
        // Verify immediately
        const verify = JSON.parse(localStorage.getItem('siteConfig') || '{}');
        if (verify.phone !== cfg.phone || verify.email !== cfg.email) {
            console.error('Save verification failed');
            notify('Cảnh báo: Có thể chưa lưu được dữ liệu!');
        } else {
            if ((cfg.phone && cfg.phone !== prev.phone) || (cfg.email && cfg.email !== prev.email)) {
                notify(`Đã cập nhật thông tin thành công.`);
            } else {
                notify('Đã cập nhật thông tin liên hệ & liên kết.');
            }
        }
    } catch (e) {
        console.error('Save error:', e);
        notify('Lỗi khi lưu cấu hình: ' + e.message);
    }
    
    renderSiteConfigPreview();
}

function renderSiteConfigPreview() {
    const wrap = document.getElementById('siteConfigPreview');
    if (!wrap) return;
    const cfg = JSON.parse(localStorage.getItem('siteConfig') || '{}');
    const item = (label, value, link) => {
        const v = value ? (link ? `<a href="${value}" target="_blank">${value}</a>` : value) : '<span style="color:#888">Chưa thiết lập</span>';
        return `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid #eee;">
            <div style="color:#666;">${label}</div>
            <div style="text-align:right;">${v}</div>
        </div>`;
    };
    wrap.innerHTML = `
        ${item('Số Điện Thoại', cfg.phone || '')}
        ${item('Email', cfg.email || '')}
        ${item('Youtube', cfg.youtube || '', true)}
        ${item('Facebook', cfg.facebook || '', true)}
        ${item('TikTok', cfg.tiktok || '', true)}
        ${item('Instagram', cfg.instagram || '', true)}
    `;
}

// --- Media Library ---
let currentMediaTarget = null;
let selectedMediaSrc = null;

function openMediaLibrary(targetId) {
    currentMediaTarget = targetId;
    loadMediaLibrary();
    document.getElementById('mediaModal').classList.add('active');
}

function switchMediaTab(tab) {
    const tabs = Array.from(document.querySelectorAll('.media-tab'));
    tabs.forEach(t => t.classList.remove('active'));
    const activeBtn = tab === 'library' ? tabs[0] : tabs[1];
    if (activeBtn) activeBtn.classList.add('active');
    
    if (tab === 'library') {
        document.getElementById('mediaLibraryPanel').style.display = 'block';
        document.getElementById('mediaUploadPanel').style.display = 'none';
        loadMediaLibrary();
    } else {
        document.getElementById('mediaLibraryPanel').style.display = 'none';
        document.getElementById('mediaUploadPanel').style.display = 'block';
    }
}

function loadMediaLibrary() {
    const grid = document.getElementById('mediaGrid');
    grid.innerHTML = '';
    
    // Combine gallery images + default placeholders if needed
    let gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
    
    // Add some placeholders for demo
    const placeholders = [
        'https://images.unsplash.com/photo-1563241527-30058e5a706e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80',
        'https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=80'
    ];
    
    const allImages = [...placeholders, ...gallery];
    
    allImages.forEach(src => {
        const div = document.createElement('div');
        div.className = 'media-item';
        div.style.backgroundImage = `url('${src}')`;
        div.onclick = () => selectMedia(src, div);
        grid.appendChild(div);
    });
}

function selectMedia(src, el) {
    selectedMediaSrc = src;
    document.querySelectorAll('.media-item').forEach(d => d.classList.remove('selected'));
    el.classList.add('selected');
}

function confirmMediaSelection() {
    if (!currentMediaTarget || !selectedMediaSrc) return;
    const input = document.getElementById(currentMediaTarget);
    if (input) input.value = selectedMediaSrc;
    closeModal('mediaModal');
}

function uploadMediaFile() {
    const candidates = [
        document.getElementById('mediaUploadFile'),
        document.getElementById('galleryFile'),
        document.getElementById('postImageFile')
    ].filter(Boolean);
    const f = candidates.find(inp => inp.files && inp.files.length > 0);
    const file = f && f.files[0];
    if (!file) {
        notify('Vui lòng chọn một file ảnh');
        return;
    }
    const r = new FileReader();
    r.onload = (e) => {
        let gallery = JSON.parse(localStorage.getItem('gallery') || '[]');
        gallery.push(e.target.result);
        localStorage.setItem('gallery', JSON.stringify(gallery));
        if (currentMediaTarget) {
            const input = document.getElementById(currentMediaTarget);
            if (input) input.value = e.target.result;
            const mediaModal = document.getElementById('mediaModal');
            if (mediaModal) mediaModal.classList.remove('active');
            notifySuccess();
        } else {
            loadGallery();
            const galleryModal = document.getElementById('galleryModal');
            if (galleryModal) galleryModal.classList.remove('active');
            notifySuccess();
        }
    };
    r.readAsDataURL(file);
}

// --- Admin Chat ---
function loadAdminChat() {
    const chatMessages = document.getElementById('adminChatMessages');
    const chatInput = document.getElementById('adminChatInput');
    const sendBtn = document.getElementById('adminSendChatBtn');

    if (!chatMessages) return;

    const renderChat = () => {
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        chatMessages.innerHTML = '';
        history.forEach(msg => {
            const div = document.createElement('div');
            // Dashboard Logic:
            // msg.sender == 'user' -> Customer -> Left -> class 'customer'
            // msg.sender == 'admin' -> Admin (Me) -> Right -> class 'admin-me'
            
            if (msg.sender === 'user') {
                div.className = 'message customer';
                div.textContent = msg.text;
            } else {
                div.className = 'message admin-me';
                div.textContent = msg.text;
            }
            
            chatMessages.appendChild(div);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    renderChat();

    const handleSend = () => {
        const text = chatInput.value.trim();
        if (!text) return;
        
        const history = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        history.push({ text, sender: 'admin', timestamp: Date.now() });
        localStorage.setItem('chatHistory', JSON.stringify(history));
        
        chatInput.value = '';
        renderChat();
    };

    if (sendBtn) sendBtn.addEventListener('click', handleSend);
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') handleSend();
        });
    }

    // Handle user list clicks (Demo only)
    const userListItems = document.querySelectorAll('.chat-user-list li');
    userListItems.forEach(li => {
        li.addEventListener('click', () => {
            userListItems.forEach(item => item.classList.remove('active'));
            li.classList.add('active');
            const name = li.querySelector('.user-info h4').innerText;
            const headerInfo = document.getElementById('currentChatUser');
            if(headerInfo) headerInfo.innerText = name;
            
            // In a real app, load chat for this user. 
            // Here we just clear/reload demo
            if (name.includes('Nam')) {
                chatMessages.innerHTML = '<div class="message customer">Cảm ơn shop nhé!</div><div class="message admin-me">Dạ không có chi ạ!</div>';
            } else {
                renderChat();
            }
        });
    });

    window.addEventListener('storage', (e) => {
        if (e.key === 'chatHistory') renderChat();
        if (e.key === 'registrations') {
            loadDashboardData();
            renderMembers();
            loadWorkshops();
        }
    });
}

function openAddModal(type) {
    if (type === 'workshop') {
        document.getElementById('workshopModalLabel').innerText = 'Thêm Workshop Mới';
        document.getElementById('addWorkshopForm').reset();
        document.getElementById('editWorkshopIndex').value = '-1';
        document.getElementById('workshopModal').classList.add('active');
    } else if (type === 'post') {
        document.getElementById('addPostForm').reset();
        const postIndexEl = document.getElementById('editPostIndex');
        if (postIndexEl) postIndexEl.value = '-1';
        document.getElementById('postModal').classList.add('active');
    } else if (type === 'gallery') {
        document.getElementById('addGalleryForm').reset();
        const galIndexEl = document.getElementById('editGalleryIndex');
        if (galIndexEl) galIndexEl.value = '-1';
        document.getElementById('galleryModal').classList.add('active');
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}
