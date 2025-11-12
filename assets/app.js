// LawnLink App - Group Browsing & Management

// State
let groups = [];
let currentZip = '';
let currentGroupId = null;
let currentUser = null;

// DOM Elements
const zipInput = document.getElementById('zipInput');
const findGroupsBtn = document.getElementById('findGroupsBtn');
const zipLabel = document.getElementById('zipLabel');
const groupGrid = document.getElementById('groupGrid');
const startGroupBtn = document.getElementById('startGroupBtn');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const joinModal = document.getElementById('joinModal');
const startGroupModal = document.getElementById('startGroupModal');
const closeJoinModal = document.getElementById('closeJoinModal');
const closeStartGroupModal = document.getElementById('closeStartGroupModal');
const joinForm = document.getElementById('joinForm');
const startGroupForm = document.getElementById('startGroupForm');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadGroups();
  setupEventListeners();
});

// Check authentication
function checkAuth() {
  // Check for token in URL (from Google OAuth redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const userParam = urlParams.get('user');
  const error = urlParams.get('error');
  
  if (error) {
    showToast(`Authentication failed: ${error}`, 'error');
    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }
  
  if (token && userParam) {
    try {
      const user = JSON.parse(decodeURIComponent(userParam));
      currentUser = user;
      localStorage.setItem('currentUser', JSON.stringify(user));
      localStorage.setItem('authToken', token);
      updateUIForLoggedInUser();
      showToast(`Welcome, ${user.name}!`, 'success');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  } else {
    // Check localStorage
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('authToken');
    
    if (savedUser && savedToken) {
      try {
        currentUser = JSON.parse(savedUser);
        // Verify token is still valid
        verifyToken(savedToken);
      } catch (error) {
        console.error('Error loading user:', error);
        clearAuth();
      }
    }
  }
}

// Verify token
async function verifyToken(token) {
  try {
    const response = await fetch(`/api/auth/verify?token=${encodeURIComponent(token)}`);
    if (response.ok) {
      const data = await response.json();
      currentUser = data.user;
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      updateUIForLoggedInUser();
    } else {
      clearAuth();
    }
  } catch (error) {
    console.error('Token verification failed:', error);
    clearAuth();
  }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
  if (currentUser) {
    const profilePic = currentUser.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=16a34a&color=fff&size=128`;
    const userMenu = document.getElementById('userMenu');
    const userMenuTrigger = document.getElementById('userMenuTrigger');
    const userMenuAvatar = document.getElementById('userMenuAvatar');
    const userMenuName = document.getElementById('userMenuName');
    const userMenuEmail = document.getElementById('userMenuEmail');
    
    if (userMenu && userMenuTrigger && userMenuAvatar) {
      userMenu.style.display = 'block';
      userMenuAvatar.src = profilePic;
      userMenuAvatar.onerror = function() {
        this.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=16a34a&color=fff&size=128`;
      };
      if (userMenuName) userMenuName.textContent = currentUser.name;
      if (userMenuEmail) userMenuEmail.textContent = currentUser.email || '';
    }
    
    googleLoginBtn.style.display = 'none';
  }
}

// Clear authentication
function clearAuth() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authToken');
  
  const userMenu = document.getElementById('userMenu');
  if (userMenu) {
    userMenu.style.display = 'none';
  }
  
  googleLoginBtn.style.display = 'flex';
}

// Handle logout
function handleLogout() {
  clearAuth();
  showToast('Signed out successfully', 'success');
}

// Handle Google login
function handleGoogleLogin() {
  // Determine user type (default to homeowner for now)
  const userType = 'homeowner';
  window.location.href = `/api/auth/google?userType=${userType}`;
}

// Event Listeners
function setupEventListeners() {
  // ZIP input - only allow numbers
  zipInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 5);
  });

  // Find groups button
  findGroupsBtn.addEventListener('click', handleFindGroups);

  // Enter key on ZIP input
  zipInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleFindGroups();
    }
  });

  // Google login button
  googleLoginBtn.addEventListener('click', handleGoogleLogin);
  
  // User menu
  const userMenuTrigger = document.getElementById('userMenuTrigger');
  const logoutLink = document.getElementById('logoutLink');
  const profileLink = document.getElementById('profileLink');
  const myGroupsLink = document.getElementById('myGroupsLink');
  
  if (logoutLink) {
    logoutLink.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }
  
  if (profileLink) {
    profileLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Profile page coming soon!', 'success');
    });
  }
  
  if (myGroupsLink) {
    myGroupsLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('My Groups page coming soon!', 'success');
    });
  }
  
  // Start group button
  startGroupBtn.addEventListener('click', () => {
    if (!currentUser) {
      showToast('Please sign in to start a group', 'error');
      handleGoogleLogin();
      return;
    }
    openModal(startGroupModal);
  });

  // Close modals
  closeJoinModal.addEventListener('click', () => closeModal(joinModal));
  closeStartGroupModal.addEventListener('click', () => closeModal(startGroupModal));

  // Modal backdrop click
  joinModal.addEventListener('click', (e) => {
    if (e.target === joinModal) closeModal(joinModal);
  });
  startGroupModal.addEventListener('click', (e) => {
    if (e.target === startGroupModal) closeModal(startGroupModal);
  });

  // ESC key to close modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (joinModal.getAttribute('aria-hidden') === 'false') closeModal(joinModal);
      if (startGroupModal.getAttribute('aria-hidden') === 'false') closeModal(startGroupModal);
    }
  });

  // Join form submit
  joinForm.addEventListener('submit', handleJoinGroup);

  // Start group form submit
  startGroupForm.addEventListener('submit', handleStartGroup);
}

// Load groups from API
async function loadGroups() {
  showLoading();
  
  try {
    const response = await fetch('/api/groups');
    if (!response.ok) throw new Error('Failed to load groups');
    
    const data = await response.json();
    groups = data.map(group => {
      // Handle members as array or number
      let memberCount = 0;
      if (Array.isArray(group.members)) {
        memberCount = group.members.length;
      } else if (typeof group.members === 'number') {
        memberCount = group.members;
      }
      
      // Extract ZIP from address if not provided
      let zip = group.zip || '';
      if (!zip && group.address) {
        const zipMatch = group.address.match(/\b\d{5}\b/);
        if (zipMatch) zip = zipMatch[0];
        else zip = group.address.split(' ').pop() || '';
      }
      
      return {
        id: group.id,
        name: group.name || 'Unnamed Group',
        zip: zip,
        members: memberCount
      };
    });
    
    renderGroups();
  } catch (error) {
    console.error('Error loading groups:', error);
    showToast('Failed to load groups. Please try again.', 'error');
    renderEmptyState();
  }
}

// Handle find groups
function handleFindGroups() {
  const zip = zipInput.value.trim();
  
  if (zip.length !== 5) {
    showToast('Please enter a valid 5-digit ZIP code', 'error');
    return;
  }
  
  currentZip = zip;
  zipLabel.textContent = zip;
  renderGroups();
  
  // Show hint if no groups found
  const hint = document.getElementById('heroHint');
  if (hint) {
    setTimeout(() => {
      const hasGroups = groupGrid.querySelector('.card');
      if (!hasGroups && groupGrid.querySelector('.empty-state')) {
        hint.style.display = 'block';
      } else {
        hint.style.display = 'none';
      }
    }, 100);
  }
}

// Render groups
function renderGroups() {
  groupGrid.innerHTML = '';
  
  let filteredGroups = groups;
  
  // Filter by ZIP if one is entered
  if (currentZip) {
    filteredGroups = groups.filter(g => g.zip === currentZip);
  }
  
  // Show empty state if no groups
  if (filteredGroups.length === 0) {
    renderEmptyState();
    return;
  }
  
  // Render group cards
  filteredGroups.forEach(group => {
    const card = createGroupCard(group);
    groupGrid.appendChild(card);
  });
}

// Create group card
function createGroupCard(group) {
  const card = document.createElement('div');
  card.className = 'card';
  card.setAttribute('role', 'article');
  
  const discount = getDiscount(group.members);
  const memberAvatars = generateMemberAvatars(group.members);
  
  card.innerHTML = `
    <div class="card__header">
      <div class="card__header-left">
        <div class="card__location">
          <span class="card__location-icon">📍</span>
          <span class="card__location-text">${group.zip}</span>
        </div>
        <h3 class="card__title">${escapeHtml(group.name)}</h3>
      </div>
      ${discount > 0 ? `<span class="pill pill--discount">Save ${discount}%</span>` : ''}
    </div>
    <div class="card__body">
      <div class="card__members">
        <div class="card__member-avatars">
          ${memberAvatars}
        </div>
        <p class="card__member-count">${group.members} ${group.members === 1 ? 'neighbor' : 'neighbors'}</p>
      </div>
    </div>
    <div class="card__footer">
      <button class="btn btn--primary btn--small" onclick="joinGroup('${group.id}')">Join Group</button>
    </div>
  `;
  
  return card;
}

// Generate member avatars
function generateMemberAvatars(count) {
  const colors = ['#16a34a', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b'];
  let avatars = '';
  const displayCount = Math.min(count, 3);
  
  for (let i = 0; i < displayCount; i++) {
    const color = colors[i % colors.length];
    const initial = String.fromCharCode(65 + (i % 26)); // A, B, C...
    avatars += `
      <div class="member-avatar" style="background: ${color}; margin-left: ${i > 0 ? '-8px' : '0'}; z-index: ${10 - i};">
        ${initial}
      </div>
    `;
  }
  
  if (count > 3) {
    avatars += `<div class="member-avatar member-avatar--more" style="margin-left: -8px; z-index: 1;">+${count - 3}</div>`;
  }
  
  return avatars;
}

// Get discount based on members
function getDiscount(members) {
  if (members >= 6) return 20;
  if (members >= 3) return 10;
  return 0;
}

// View group (placeholder)
function viewGroup(groupId) {
  const group = groups.find(g => g.id === groupId);
  if (group) {
    showToast(`Viewing ${group.name} (feature coming soon)`, 'success');
  }
}

// Join group
function joinGroup(groupId) {
  if (!currentUser) {
    showToast('Please sign in to join a group', 'error');
    handleGoogleLogin();
    return;
  }
  currentGroupId = groupId;
  openModal(joinModal);
}

// Handle join form submit
function handleJoinGroup(e) {
  e.preventDefault();
  
  const name = document.getElementById('joinName').value.trim();
  const email = document.getElementById('joinEmail').value.trim();
  
  // Validation
  if (name.length < 2) {
    showToast('Name must be at least 2 characters', 'error');
    return;
  }
  
  if (!email.includes('@')) {
    showToast('Please enter a valid email address', 'error');
    return;
  }
  
  // Find group and update members (optimistic UI)
  const group = groups.find(g => g.id === currentGroupId);
  if (group) {
    group.members += 1;
    
    // Show success
    showToast(`Joined ${group.name}! (demo)`, 'success');
    
    // Re-render
    renderGroups();
    
    // Close modal
    closeModal(joinModal);
    
    // Reset form
    joinForm.reset();
  }
}

// Handle start group form submit
function handleStartGroup(e) {
  e.preventDefault();
  
  const name = document.getElementById('groupName').value.trim();
  const zip = document.getElementById('groupZip').value.trim();
  
  // Validation
  if (name.length < 2) {
    showToast('Group name must be at least 2 characters', 'error');
    return;
  }
  
  if (zip.length !== 5) {
    showToast('Please enter a valid 5-digit ZIP code', 'error');
    return;
  }
  
  // Create new group (optimistic UI)
  const newGroup = {
    id: Date.now().toString(),
    name: name,
    zip: zip,
    members: 1
  };
  
  groups.push(newGroup);
  
  // Show success
  showToast(`Created ${name}! (demo)`, 'success');
  
  // Update ZIP filter if needed
  if (!currentZip || currentZip === zip) {
    currentZip = zip;
    zipInput.value = zip;
    zipLabel.textContent = zip;
  }
  
  // Re-render
  renderGroups();
  
  // Close modal
  closeModal(startGroupModal);
  
  // Reset form
  startGroupForm.reset();
}

// Show loading state
function showLoading() {
  groupGrid.innerHTML = '';
  for (let i = 0; i < 3; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'card skeleton skeleton--card';
    groupGrid.appendChild(skeleton);
  }
}

// Show empty state
function renderEmptyState() {
  groupGrid.innerHTML = `
    <div class="empty-state">
      <div class="empty-state__icon">🌲</div>
      <h3 class="empty-state__title">No groups yet—start one!</h3>
      <p class="empty-state__description">Be the first in your area to create a group and unlock discounts.</p>
      <button class="btn btn--primary" onclick="document.getElementById('startGroupBtn').click()">Start a Group</button>
    </div>
  `;
}

// Modal functions
function openModal(modal) {
  modal.setAttribute('aria-hidden', 'false');
  const firstInput = modal.querySelector('input');
  if (firstInput) {
    setTimeout(() => firstInput.focus(), 100);
  }
  
  // Trap focus
  trapFocus(modal);
}

function closeModal(modal) {
  modal.setAttribute('aria-hidden', 'true');
  startGroupBtn.focus();
}

// Focus trap for modal
function trapFocus(modal) {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  
  modal.addEventListener('keydown', function handleTab(e) {
    if (e.key !== 'Tab') return;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });
}

// Toast notification
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <span class="toast__message">${escapeHtml(message)}</span>
  `;
  
  document.body.appendChild(toast);
  
  // Auto dismiss after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Utility: Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make functions globally available for onclick handlers
window.viewGroup = viewGroup;
window.joinGroup = joinGroup;

