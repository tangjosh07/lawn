// Socket.io connection
const socket = io();

// Global state
let currentUser = null;
let currentChat = null;

// DOM Elements
const authModal = document.getElementById('authModal');
const mainContent = document.getElementById('mainContent');
const landingPage = document.getElementById('landingPage');
const homeownerDashboard = document.getElementById('homeownerDashboard');
const providerDashboard = document.getElementById('providerDashboard');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authToggle = document.getElementById('toggleAuth');
const registerFields = document.getElementById('registerFields');
const logoutBtn = document.getElementById('logoutBtn');
const userName = document.getElementById('userName');
const homeownerBtn = document.getElementById('homeownerBtn');
const providerBtn = document.getElementById('providerBtn');
const navLinks = document.getElementById('navLinks');

// Selected user type for registration
let selectedUserType = null;

// Check if user is logged in
function checkAuth() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        showLandingPage();
    }
}

// Show landing page
function showLandingPage() {
    landingPage.style.display = 'flex';
    authModal.style.display = 'none';
    mainContent.style.display = 'none';
    homeownerBtn.style.display = 'block';
    providerBtn.style.display = 'block';
    userName.style.display = 'none';
    logoutBtn.style.display = 'none';
}

// Show auth modal
function showAuthModal(userType) {
    selectedUserType = userType;
    authModal.style.display = 'block';
    isLogin = true;
    authTitle.textContent = 'Login';
    registerFields.style.display = 'none';
    document.querySelector('#authToggle a').textContent = 'Register';
}

// Hide auth modal
function hideAuthModal() {
    authModal.style.display = 'none';
}

// Show dashboard
function showDashboard() {
    landingPage.style.display = 'none';
    authModal.style.display = 'none';
    mainContent.style.display = 'block';
    userName.textContent = currentUser.name;
    userName.style.display = 'block';
    logoutBtn.style.display = 'block';
    homeownerBtn.style.display = 'none';
    providerBtn.style.display = 'none';
    
    if (currentUser.userType === 'homeowner') {
        homeownerDashboard.style.display = 'block';
        providerDashboard.style.display = 'none';
        loadGroups();
        loadOffers();
    } else {
        homeownerDashboard.style.display = 'none';
        providerDashboard.style.display = 'block';
        loadMyOffers();
    }
    
    // Join socket room
    socket.emit('join-room', currentUser.id);
}

// Auth form handler
let isLogin = true;
authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('authEmail').value;
    const password = document.getElementById('authPassword').value;
    
    if (isLogin) {
        // Login
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            if (response.ok) {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                hideAuthModal();
                showDashboard();
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            alert('Error logging in');
        }
    } else {
        // Register
        const name = document.getElementById('regName').value;
        const userType = selectedUserType || 'homeowner';
        
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, userType })
            });
            
            const data = await response.json();
            if (response.ok) {
                currentUser = data.user;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                hideAuthModal();
                showDashboard();
            } else {
                alert(data.error || 'Registration failed');
            }
        } catch (error) {
            alert('Error registering');
        }
    }
    
    authForm.reset();
});

// Toggle between login and register
authToggle.addEventListener('click', (e) => {
    e.preventDefault();
    isLogin = !isLogin;
    authTitle.textContent = isLogin ? 'Login' : 'Register';
    registerFields.style.display = isLogin ? 'none' : 'block';
    document.querySelector('#authToggle a').textContent = isLogin ? 'Register' : 'Login';
});

// Homeowner button click
homeownerBtn.addEventListener('click', () => {
    showAuthModal('homeowner');
});

// Provider button click
providerBtn.addEventListener('click', () => {
    showAuthModal('provider');
});

// Logout
logoutBtn.addEventListener('click', () => {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showLandingPage();
});

// Close modals
document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', (e) => {
        e.target.closest('.modal').style.display = 'none';
    });
});

// Load groups
async function loadGroups() {
    try {
        const response = await fetch('/api/groups');
        const groups = await response.json();
        const groupsList = document.getElementById('groupsList');
        
        groupsList.innerHTML = groups
            .filter(g => g.members.includes(currentUser.id))
            .map(group => `
                <div class="card">
                    <h3>${group.name}</h3>
                    <p>${group.description}</p>
                    <div class="card-info">
                        <span>📍 ${group.address}</span>
                        <span class="badge member-count">${group.members.length} members</span>
                    </div>
                    <div class="card-info">
                        <span>📐 ${group.area} sq ft</span>
                    </div>
                </div>
            `).join('');
    } catch (error) {
        console.error('Error loading groups:', error);
    }
}

// Create group
const createGroupBtn = document.getElementById('createGroupBtn');
const groupModal = document.getElementById('groupModal');
const groupForm = document.getElementById('groupForm');

createGroupBtn.addEventListener('click', () => {
    groupModal.style.display = 'block';
});

groupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const groupData = {
        name: document.getElementById('groupName').value,
        description: document.getElementById('groupDescription').value,
        address: document.getElementById('groupAddress').value,
        area: document.getElementById('groupArea').value,
        creatorId: currentUser.id
    };
    
    try {
        const response = await fetch('/api/groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(groupData)
        });
        
        if (response.ok) {
            groupModal.style.display = 'none';
            groupForm.reset();
            loadGroups();
            loadOffers();
        } else {
            alert('Error creating group');
        }
    } catch (error) {
        alert('Error creating group');
    }
});

// Load offers
async function loadOffers() {
    try {
        const response = await fetch('/api/offers');
        const offers = await response.json();
        const offersList = document.getElementById('offersList');
        
        // Get user's groups to filter offers
        const groupsResponse = await fetch('/api/groups');
        const groups = await groupsResponse.json();
        const userGroups = groups.filter(g => g.members.includes(currentUser.id));
        
        if (offers.length === 0) {
            offersList.innerHTML = '<p style="color: white;">No offers available yet.</p>';
            return;
        }
        
        offersList.innerHTML = offers.map(offer => {
            const totalPrice = offer.basePrice + (offer.pricePerHome * (userGroups[0]?.members.length || 1));
            const amenities = offer.amenities.map(a => `<span class="badge amenity">${a.replace('_', ' ')}</span>`).join('');
            
            return `
                <div class="card">
                    <h3>${offer.title}</h3>
                    <p>${offer.description}</p>
                    <div class="card-info">
                        <span>Homes: ${offer.minHomes} - ${offer.maxHomes}</span>
                        <span>Area: ${offer.areaCoverage} sq ft</span>
                    </div>
                    <div style="margin: 1rem 0;">
                        ${amenities}
                    </div>
                    <div class="price-tag">$${totalPrice.toFixed(2)}</div>
                    <div class="card-actions">
                        <button class="btn-small btn-primary" onclick="openChat('${offer.providerId}', '${offer.id}')">Chat with Provider</button>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading offers:', error);
    }
}

// Load my offers (provider)
async function loadMyOffers() {
    try {
        const response = await fetch('/api/offers');
        const offers = await response.json();
        const myOffers = offers.filter(o => o.providerId === currentUser.id);
        const myOffersList = document.getElementById('myOffersList');
        
        if (myOffers.length === 0) {
            myOffersList.innerHTML = '<p style="color: white;">You haven\'t created any offers yet.</p>';
            return;
        }
        
        myOffersList.innerHTML = myOffers.map(offer => {
            const amenities = offer.amenities.map(a => `<span class="badge amenity">${a.replace('_', ' ')}</span>`).join('');
            
            return `
                <div class="card">
                    <h3>${offer.title}</h3>
                    <p>${offer.description}</p>
                    <div class="card-info">
                        <span>Homes: ${offer.minHomes} - ${offer.maxHomes}</span>
                        <span>Area: ${offer.areaCoverage} sq ft</span>
                    </div>
                    <div style="margin: 1rem 0;">
                        ${amenities}
                    </div>
                    <div class="price-tag">Base: $${offer.basePrice.toFixed(2)} + $${offer.pricePerHome.toFixed(2)}/home</div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error('Error loading offers:', error);
    }
}

// Create offer
const createOfferBtn = document.getElementById('createOfferBtn');
const offerModal = document.getElementById('offerModal');
const offerForm = document.getElementById('offerForm');

createOfferBtn.addEventListener('click', () => {
    offerModal.style.display = 'block';
});

offerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const amenities = Array.from(document.querySelectorAll('#offerForm input[type="checkbox"]:checked'))
        .map(cb => cb.value);
    
    const offerData = {
        providerId: currentUser.id,
        title: document.getElementById('offerTitle').value,
        description: document.getElementById('offerDescription').value,
        minHomes: document.getElementById('offerMinHomes').value,
        maxHomes: document.getElementById('offerMaxHomes').value,
        basePrice: document.getElementById('offerBasePrice').value,
        pricePerHome: document.getElementById('offerPricePerHome').value,
        areaCoverage: document.getElementById('offerAreaCoverage').value,
        amenities
    };
    
    try {
        const response = await fetch('/api/offers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(offerData)
        });
        
        if (response.ok) {
            offerModal.style.display = 'none';
            offerForm.reset();
            loadMyOffers();
        } else {
            alert('Error creating offer');
        }
    } catch (error) {
        alert('Error creating offer');
    }
});

// Chat functionality
const chatModal = document.getElementById('chatModal');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');
const chatTitle = document.getElementById('chatTitle');

// Open chat
window.openChat = async function(otherUserId, offerId) {
    currentChat = otherUserId;
    chatModal.style.display = 'block';
    
    // Load user info for title
    try {
        const response = await fetch('/api/messages/' + currentUser.id + '/' + otherUserId);
        const messages = await response.json();
        chatMessages.innerHTML = messages.map(msg => {
            const isSent = msg.fromId === currentUser.id;
            return `
                <div class="message ${isSent ? 'sent' : 'received'}">
                    <div>${msg.content}</div>
                    <div class="message-info">${new Date(msg.createdAt).toLocaleString()}</div>
                </div>
            `;
        }).join('');
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    } catch (error) {
        console.error('Error loading messages:', error);
    }
    
    chatTitle.textContent = 'Chat';
};

// Send message
sendMessageBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const content = chatInput.value.trim();
    if (!content || !currentChat) return;
    
    socket.emit('send-message', {
        fromId: currentUser.id,
        toId: currentChat,
        content
    });
    
    chatInput.value = '';
}

// Receive message
socket.on('receive-message', (message) => {
    if (currentChat && (message.fromId === currentChat || message.toId === currentChat)) {
        const isSent = message.fromId === currentUser.id;
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
        messageDiv.innerHTML = `
            <div>${message.content}</div>
            <div class="message-info">${new Date(message.createdAt).toLocaleString()}</div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
});

// Initialize
checkAuth();

