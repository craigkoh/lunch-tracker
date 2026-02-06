// Supabase configuration - replace with your values
const SUPABASE_URL = 'https://ypvgfmxnjjlymxifpuyc.supabase.co';
const SUPABASE_KEY = 'sbp_32bc8f2c98f8555da933144021b9d73658b5cd12';
const SHARED_PASSWORD = 'doug_rocks'; // Change this to your shared password

let supabase;
let currentUser = null;
let currentRound = null;

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    console.log('App initializing...');
    
    // Check if Supabase is configured
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.log('Supabase not configured');
        showSetupNeeded();
        return;
    }

    // Initialize Supabase
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('Supabase initialized');

    // Check for existing session
    const savedName = localStorage.getItem('lunchUserName');
    const savedLower = localStorage.getItem('lunchUserLower');
    if (savedName && savedLower) {
        console.log('Found existing session:', savedName);
        currentUser = savedLower;
        showMainScreen(savedName);
        loadData();
    } else {
        console.log('No existing session');
    }
});

// Test function for debugging
function testLogin() {
    console.log('Testing login...');
    document.getElementById('username').value = 'Test';
    document.getElementById('password').value = 'doug_rocks';
    login();
}

function showSetupNeeded() {
    document.getElementById('login-screen').innerHTML = `
        <div class="login-card">
            <h1>⚙️ Setup Required</h1>
            <p class="subtitle">Ask Craig to configure Supabase</p>
            <div style="text-align: left; background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0; font-size: 0.85rem;">
                <p><strong>Missing:</strong> Supabase URL and API Key</p>
                <p style="margin-top: 0.5rem; color: #666;">1. Create free account at supabase.com</p>
                <p style="color: #666;">2. Create new project</p>
                <p style="color: #666;">3. Copy URL and anon key</p>
                <p style="color: #666;">4. Update app.js with values</p>
            </div>
        </div>
    `;
}

function login() {
    console.log('Login function called');
    const name = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    console.log('Name:', name, 'Password:', password);

    if (!name || !password) {
        document.getElementById('login-error').textContent = 'Please fill in both fields';
        console.log('Missing name or password');
        return;
    }

    if (password !== SHARED_PASSWORD) {
        document.getElementById('login-error').textContent = 'Incorrect password';
        console.log('Wrong password');
        return;
    }

    console.log('Login successful');
    currentUser = name.toLowerCase();
    localStorage.setItem('lunchUserName', name);
    localStorage.setItem('lunchUserLower', currentUser);
    showMainScreen(name);
    loadData();
}

function logout() {
    currentUser = null;
    localStorage.removeItem('lunchUserName');
    localStorage.removeItem('lunchUserLower');
    document.getElementById('main-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

function showMainScreen(displayName) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('main-screen').classList.remove('hidden');
    document.getElementById('current-user').textContent = `Hi, ${displayName}!`;
}

function showTab(tabName) {
    // Update nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update tabs
    document.querySelectorAll('.tab').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
}

async function loadData() {
    await Promise.all([
        loadCurrentRound(),
        loadRestaurants(),
        loadHistory()
    ]);
}

// ============ ROUND MANAGEMENT ============

async function loadCurrentRound() {
    const { data, error } = await supabase
        .from('rounds')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) {
        currentRound = null;
        showStartRoundButton();
        return;
    }

    currentRound = data;
    updateDashboard();
}

function showStartRoundButton() {
    document.getElementById('current-picker').innerHTML = `
        <p>No active round</p>
        <button onclick="startNewRound()" style="margin-top: 1rem; width: auto; padding: 12px 24px;">Start New Round</button>
    `;
    document.getElementById('instruction').textContent = '';
    hideAllPhases();
}

async function startNewRound() {
    // Get next picker in rotation
    const users = ['Craig', 'Seth', 'Chris'];
    const { data: rounds } = await supabase
        .from('rounds')
        .select('picker')
        .order('created_at', { ascending: false })
        .limit(3);

    let nextPicker = users[0]; // Default to first
    if (rounds && rounds.length > 0) {
        const lastPicker = rounds[0].picker;
        const index = users.indexOf(lastPicker);
        nextPicker = users[(index + 1) % users.length];
    }

    const { data, error } = await supabase
        .from('rounds')
        .insert({
            picker: nextPicker,
            phase: 'suggestion',
            suggestions: [],
            vetos: {},
            winner: null
        })
        .select()
        .single();

    if (!error) {
        currentRound = data;
        updateDashboard();
    }
}

function updateDashboard() {
    if (!currentRound) {
        showStartRoundButton();
        return;
    }

    const picker = currentRound.picker;
    const isPicker = currentUser === picker.toLowerCase();

    document.getElementById('current-picker').textContent = picker + (isPicker ? ' (You!)' : '');
    document.getElementById('instruction').textContent = isPicker
        ? "It's your turn to pick 3 places!"
        : `Waiting for ${picker} to pick places...`;

    // Show appropriate phase
    hideAllPhases();

    if (currentRound.phase === 'suggestion') {
        document.getElementById('suggestion-phase').classList.remove('hidden');
        renderSuggestions();
    } else if (currentRound.phase === 'veto') {
        document.getElementById('veto-phase').classList.remove('hidden');
        renderVetoList();
    } else if (currentRound.phase === 'winner') {
        document.getElementById('winner-phase').classList.remove('hidden');
        document.getElementById('winner-display').textContent = currentRound.winner;
    }
}

function hideAllPhases() {
    document.getElementById('suggestion-phase').classList.add('hidden');
    document.getElementById('veto-phase').classList.add('hidden');
    document.getElementById('winner-phase').classList.add('hidden');
}

// ============ SUGGESTION PHASE ============

function renderSuggestions() {
    const container = document.getElementById('suggestion-list');
    const suggestions = currentRound.suggestions || [];
    const isPicker = currentUser === currentRound.picker.toLowerCase();

    if (suggestions.length === 0) {
        container.innerHTML = `
            <p style="color: #666; text-align: center; padding: 1rem;">
                ${isPicker ? 'Add 3 restaurants from the library below, or type a new one:' : 'Waiting for suggestions...'}
            </p>
        `;
    } else {
        container.innerHTML = suggestions.map((s, i) => `
            <div class="suggestion-item">
                <span>${i + 1}. ${s}</span>
                ${isPicker ? `<span class="remove" onclick="removeSuggestion(${i})">✕</span>` : ''}
            </div>
        `).join('');
    }

    // Update button state
    const btn = document.getElementById('start-veto-btn');
    btn.disabled = suggestions.length !== 3;
    btn.textContent = suggestions.length === 3
        ? (isPicker ? 'Start Veto Phase' : 'Waiting for picker...')
        : `Add more places (${suggestions.length}/3)`;
}

async function addSuggestion(restaurant) {
    const suggestions = currentRound.suggestions || [];
    if (suggestions.length >= 3) return;

    suggestions.push(restaurant);

    const { error } = await supabase
        .from('rounds')
        .update({ suggestions })
        .eq('id', currentRound.id);

    if (!error) {
        currentRound.suggestions = suggestions;
        renderSuggestions();
    }
}

async function removeSuggestion(index) {
    const suggestions = currentRound.suggestions.filter((_, i) => i !== index);

    const { error } = await supabase
        .from('rounds')
        .update({ suggestions })
        .eq('id', currentRound.id);

    if (!error) {
        currentRound.suggestions = suggestions;
        renderSuggestions();
    }
}

async function startVetoPhase() {
    const { error } = await supabase
        .from('rounds')
        .update({ phase: 'veto', vetos: {} })
        .eq('id', currentRound.id);

    if (!error) {
        currentRound.phase = 'veto';
        currentRound.vetos = {};
        updateDashboard();
    }
}

// ============ VETO PHASE ============

function renderVetoList() {
    const container = document.getElementById('veto-list');
    const suggestions = currentRound.suggestions || [];
    const vetos = currentRound.vetos || {};
    const isPicker = currentUser === currentRound.picker.toLowerCase();

    // Get veto count for each restaurant
    const vetoCounts = {};
    suggestions.forEach(s => vetoCounts[s] = 0);
    Object.values(vetos).forEach(v => {
        if (vetoCounts[v] !== undefined) vetoCounts[v]++;
    });

    // Determine if this user has vetoed
    const userHasVetoed = Object.keys(vetos).map(k => k.toLowerCase()).includes(currentUser);

    // Show complete button if all non-pickers have vetoed
    const nonPickers = ['Craig', 'Seth', 'Chris'].map(u => u.toLowerCase()).filter(u => u !== currentRound.picker.toLowerCase());
    const allVetoed = nonPickers.every(u => Object.keys(vetos).map(k => k.toLowerCase()).includes(u));

    const btn = document.getElementById('complete-veto-btn');
    if (allVetoed || isPicker) {
        btn.classList.remove('hidden');
        btn.textContent = isPicker ? 'Complete Veto & Pick Winner' : 'Waiting for picker...';
        btn.disabled = !allVetoed;
    } else {
        btn.classList.add('hidden');
    }
}

async function vetoRestaurant(restaurant) {
    const vetos = { ...currentRound.vetos };
    vetos[currentUser] = restaurant;

    const { error } = await supabase
        .from('rounds')
        .update({ vetos })
        .eq('id', currentRound.id);

    if (!error) {
        currentRound.vetos = vetos;
        renderVetoList();
    }
}

async function completeVetoPhase() {
    const suggestions = currentRound.suggestions || [];
    const vetos = Object.values(currentRound.vetos || {});
    const vetoed = [...new Set(vetos)]; // Get unique restaurants that were vetoed

    // Find the winner (not vetoed)
    let winner = suggestions.find(s => !vetoed.includes(s));

    // If all vetoed, picker wins by default
    if (!winner) winner = currentRound.picker;

    // Save to history
    await supabase.from('history').insert({
        round_id: currentRound.id,
        date: new Date().toISOString().split('T')[0],
        picker: currentRound.picker,
        winner: winner,
        suggestions: JSON.stringify(suggestions),
        vetos: JSON.stringify(vetos)
    });

    // Update round
    const { error } = await supabase
        .from('rounds')
        .update({ phase: 'winner', winner })
        .eq('id', currentRound.id);

    if (!error) {
        currentRound.phase = 'winner';
        currentRound.winner = winner;
        updateDashboard();
        loadHistory();
    }
}

// ============ RESTAURANTS ============

async function loadRestaurants() {
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .order('name');

    renderRestaurantList(data || []);
}

function renderRestaurantList(restaurants) {
    const container = document.getElementById('restaurant-list');
    container.innerHTML = restaurants.map(r => `
        <div class="restaurant-item">
            <span>${r.name}</span>
            <span class="delete" onclick="deleteRestaurant('${r.id}')">✕</span>
        </div>
    `).join('');
}

async function addRestaurant() {
    const input = document.getElementById('new-restaurant');
    const name = input.value.trim();

    if (!name) return;

    const { error } = await supabase
        .from('restaurants')
        .insert({ name });

    if (!error) {
        input.value = '';
        loadRestaurants();
    }
}

async function deleteRestaurant(id) {
    const { error } = await supabase
        .from('restaurants')
        .delete()
        .eq('id', id);

    if (!error) {
        loadRestaurants();
    }
}

// ============ HISTORY ============

async function loadHistory() {
    const { data, error } = await supabase
        .from('history')
        .select('*')
        .order('date', { ascending: false });

    renderHistory(data || []);
}

function renderHistory(history) {
    const container = document.getElementById('history-list');

    if (history.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No lunch history yet!</p>';
        return;
    }

    container.innerHTML = history.map(h => `
        <div class="history-item">
            <div class="history-date">${h.date}</div>
            <div class="history-winner">🏆 ${h.winner}</div>
            <div class="history-picker">Picker: ${h.picker}</div>
        </div>
    `).join('');
}

async function clearHistory() {
    if (!confirm('Clear all history? This cannot be undone.')) return;

    const { error } = await supabase
        .from('history')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (!error) {
        loadHistory();
    }
}

// ============ SUBSCRIPTIONS ============

// Real-time updates
supabase
    .channel('public:lunch-tracker')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rounds' }, () => {
        loadCurrentRound();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurants' }, () => {
        loadRestaurants();
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'history' }, () => {
        loadHistory();
    })
    .subscribe();
