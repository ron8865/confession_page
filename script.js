document.addEventListener('DOMContentLoaded', () => {
    const BACKEND_BASE_URL = 'http://localhost:5000/api';
    let authWorkflowMode = 'login';
    let activeUnlockCardId = null; 

    // 1. Floating Hearts Engine
    const heartsContainer = document.getElementById('hearts-bg');
    function triggerFloatingHeart() {
        const heart = document.createElement('div');
        heart.classList.add('heart-particle');
        heart.innerHTML = ['❤️','💖','💝','🌸','💕'][Math.floor(Math.random() * 5)];
        heart.style.left = Math.random() * 100 + 'vw';
        heart.style.fontSize = Math.random() * 15 + 15 + 'px';
        heart.style.animationDuration = Math.random() * 3 + 4 + 's';
        if(heartsContainer) heartsContainer.appendChild(heart);
        setTimeout(() => heart.remove(), 6500);
    }
    setInterval(triggerFloatingHeart, 350);

    // 2. Authentication UI Setup
    const authOverlay = document.getElementById('auth-overlay');
    const mainAppContent = document.getElementById('main-app-content');
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const authTitle = document.getElementById('auth-title');
    const authSubmitBtn = document.getElementById('auth-submit-btn');

    if (localStorage.getItem('userToken')) bypassAuthView();

    function bypassAuthView() {
        authOverlay.classList.add('hidden');
        mainAppContent.classList.remove('hidden');
        renderPublicWallFeed();
        if (localStorage.getItem('adminToken')) renderSecureDashboard();
    }

    tabLogin.addEventListener('click', () => {
        authWorkflowMode = 'login';
        tabLogin.classList.add('active');
        tabSignup.classList.remove('active');
        authTitle.innerText = "Welcome Back, Lover! 💖";
        authSubmitBtn.innerText = "Let Me In ✨";
    });

    tabSignup.addEventListener('click', () => {
        authWorkflowMode = 'signup';
        tabSignup.classList.add('active');
        tabLogin.classList.remove('active');
        authTitle.innerText = "Join Cupid's Universe 🌸";
        authSubmitBtn.innerText = "Create My Account 💝";
    });

    // 3. Auth Form Submission Pipeline
    document.getElementById('universal-auth-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value;

        if (authWorkflowMode === 'login' && email === 'admin@cupid.com' && password === 'love2026') {
            localStorage.setItem('userToken', 'master-override-token');
            localStorage.setItem('adminToken', 'love2026');
            localStorage.setItem('userEmail', email); // Tracking Admin Session
            alert("Welcome Master Cupid! Secret Dashboard Active.");
            bypassAuthView();
            return;
        }

        const endpointUrl = authWorkflowMode === 'login' ? '/auth/login' : '/auth/signup';
        try {
            const response = await fetch(`${BACKEND_BASE_URL}${endpointUrl}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();

            if (data.success) {
                localStorage.setItem('userToken', data.token);
                localStorage.setItem('userEmail', email); // 👈 Session ke liye email save kiya
                alert(authWorkflowMode === 'login' ? "Logged in safely! 💕" : "Account initialized successfully! 🌸");
                bypassAuthView();
            } else { alert(data.message || "Credential verification rejection."); }
        } catch (err) { alert("Backend data stream connection faulted."); }
    });

    // 4. Confession Submission Pipe
    document.getElementById('confession-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const packet = {
            userId: localStorage.getItem('userEmail') || 'Anonymous_User', // 👈 Owner ID track karne ke liye
            name: document.getElementById('user-name').value.trim() || 'Anonymous',
            instaId: document.getElementById('user-insta').value.trim() || 'Not provided',
            contactNo: document.getElementById('user-contact').value.trim() || 'Not provided',
            partnerName: document.getElementById('partner-name').value.trim(),
            description: document.getElementById('confession-desc').value.trim(),
            secretQuestion: document.getElementById('secret-question').value.trim(),
            secretAnswer: document.getElementById('secret-answer').value.trim()
        };

        try {
            const res = await fetch(`${BACKEND_BASE_URL}/confessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(packet)
            });
            if (res.ok) {
                alert("Your message flew directly into Cupid's box with a security lock! 🕊️🔒");
                document.getElementById('confession-form').reset();
                renderPublicWallFeed();
                if (localStorage.getItem('adminToken')) renderSecureDashboard();
            }
        } catch (err) { alert("Network connection drop. Flight aborted!"); }
    });

    // 5. Render Public Wall Feed (MODERATED DELETE CONTROL)
    async function renderPublicWallFeed() {
        const wall = document.getElementById('public-feed');
        const currentUserEmail = localStorage.getItem('userEmail');
        const isAdmin = localStorage.getItem('adminToken') === 'love2026';

        try {
            const res = await fetch(`${BACKEND_BASE_URL}/confessions/public`);
            const notes = await res.json();
            wall.innerHTML = '';

            if (notes.length === 0) {
                wall.innerHTML = '<div class="love-letter-note">No whispers yet. Be the first one to confess! 🌸</div>';
                return;
            }

            notes.forEach(note => {
                const safeQuestion = window.btoa(unescape(encodeURIComponent(note.secretQuestion || "What is the key answer?")));
                
                // 🧐 Checking moderation permission
                const canDelete = isAdmin || (note.userId && note.userId === currentUserEmail);
                
                // Conditional delete button creation
                const deleteBtnHtml = canDelete ? 
                    `<button class="btn-danger" style="padding: 6px 12px; font-size: 0.8rem; width: auto; margin-top: 10px;" onclick="deleteConfession('${note._id}')">🗑️ Delete</button>` : '';

                wall.innerHTML += `
                    <div class="love-letter-note">
                        <div>
                            <div class="note-header">To: ${note.partnerName}</div>
                            <div class="note-body">"${note.description}"</div>
                        </div>
                        <div>
                            <button class="btn-unlock-id" onclick="triggerRiddleChallenge('${note._id}', '${safeQuestion}')">
                                🔐 Unlock Instagram ID
                            </button>
                            ${deleteBtnHtml}
                            <div class="note-footer">— From ${note.name}</div>
                        </div>
                    </div>
                `;
            });
        } catch (e) { wall.innerHTML = '<div class="love-letter-note">Error parsing public registry grid. 💔</div>'; }
    }

    // 6. Interactive Riddle Modal System
    const riddleModal = document.getElementById('riddle-modal');
    const riddleQText = document.getElementById('riddle-modal-question');
    const riddleResultBox = document.getElementById('riddle-result-box');
    const riddleForm = document.getElementById('riddle-challenge-form');

    window.triggerRiddleChallenge = function(id, encodedQuestion) {
        activeUnlockCardId = id;
        try {
            riddleQText.innerText = decodeURIComponent(escape(window.atob(encodedQuestion)));
        } catch(err) {
            riddleQText.innerText = "What is the secret answer?";
        }
        riddleResultBox.classList.add('hidden');
        riddleForm.classList.remove('hidden');
        document.getElementById('riddle-user-answer').value = '';
        riddleModal.classList.remove('hidden');
    };

    riddleForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const clientAnswer = document.getElementById('riddle-user-answer').value.trim();

        try {
            const response = await fetch(`${BACKEND_BASE_URL}/confessions/${activeUnlockCardId}/unlock`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ answer: clientAnswer })
            });
            const data = await response.json();

            riddleForm.classList.add('hidden');
            riddleResultBox.classList.remove('hidden');

            if (data.success) {
                riddleResultBox.innerHTML = `
                    <div class="reveal-success-box">
                        🎉 Correct! Identity Unlocked:<br>
                        <a href="https://instagram.com/${data.instaId.replace('@','')}" target="_blank" style="color:var(--red-sweet); font-size:1.2rem; font-weight:700;">
                            ${data.instaId}
                        </a>
                    </div>`;
            } else {
                riddleResultBox.innerHTML = `
                    <div class="reveal-success-box" style="background:#f8d7da; color:#721c24;">
                        ❌ Wrong Answer! Try again.
                    </div>`;
            }
        } catch(err) { alert("Error connecting to security checkpoint routing node."); }
    });

    document.getElementById('close-riddle-btn').addEventListener('click', () => riddleModal.classList.add('hidden'));

    // 7. Secure Admin Controller Matrix & Actions
    const adminPanel = document.getElementById('admin-dashboard-section');
    document.getElementById('admin-trigger-btn').addEventListener('click', () => {
        if (localStorage.getItem('adminToken')) {
            renderSecureDashboard();
        } else {
            const verificationCode = prompt("Enter Secret Master Code to View Private Registry:");
            if (verificationCode === "love2026") {
                localStorage.setItem('adminToken', 'love2026');
                renderSecureDashboard();
            } else if (verificationCode !== null) { alert("Access Denied."); }
        }
    });

    async function renderSecureDashboard() {
        try {
            const res = await fetch(`${BACKEND_BASE_URL}/admin/dashboard`);
            const privateData = await res.json();
            
            if (privateData.success === false) {
                alert("Database Error: " + privateData.error);
                return;
            }

            const tbody = document.getElementById('admin-table-body');
            tbody.innerHTML = '';

            privateData.forEach(row => {
                tbody.innerHTML += `
                    <tr>
                        <td><strong>${row.name}</strong></td>
                        <td>${row.instaId}</td>
                        <td>${row.contactNo}</td>
                        <td style="color:var(--red-sweet)"><strong>${row.partnerName}</strong></td>
                        <td>${row.description}</td>
                        <td style="color:green; font-weight:500;">${row.secretAnswer}</td>
                        <td>${new Date(row.date).toLocaleDateString()}</td>
                        <td>
                            <button class="btn-danger" style="padding: 5px 10px; font-size: 0.8rem; width: auto;" onclick="deleteConfession('${row._id}')">
                                🗑️ Override
                            </button>
                        </td>
                    </tr>
                `;
            });
            adminPanel.classList.remove('hidden');
            adminPanel.scrollIntoView({ behavior: 'smooth' });
        } catch (err) { alert("Error decoding secure stream arrays."); }
    }

    // 🗑️ Global Delete Network Requester
    window.deleteConfession = async function(id) {
        if (!confirm("Are you sure you want to completely erase this memory? 🥲❌")) return;

        const currentUserEmail = localStorage.getItem('userEmail');
        const isAdmin = localStorage.getItem('adminToken') === 'love2026';

        try {
            const res = await fetch(`${BACKEND_BASE_URL}/confessions/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUserEmail, isAdmin: isAdmin })
            });
            const data = await res.json();
            
            if (data.success) {
                alert(data.message || "Data purged successfully.");
                // Instant UI reset
                renderPublicWallFeed();
                if (localStorage.getItem('adminToken')) renderSecureDashboard();
            } else {
                alert(data.message);
            }
        } catch (err) {
            alert("Security matrix denied request or network dropped.");
        }
    };

    document.getElementById('close-admin-btn').addEventListener('click', () => adminPanel.classList.add('hidden'));

    document.getElementById('global-logout-btn').addEventListener('click', () => {
        localStorage.clear();
        alert("Session parameters terminated.");
        window.location.reload();
    });
});