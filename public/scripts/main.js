// Helper function to construct API URLs
function getApiUrl(endpoint) {
    return `/.netlify/functions/api/${endpoint}`;
}

// Helper function to handle API responses
async function handleApiResponse(response) {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
    }
    return data;
}

async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const response = await fetch(getApiUrl('auth-status'), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await handleApiResponse(response);
        return data.isAuthenticated;
    } catch (error) {
        console.error('Auth status check failed:', error);
        return false;
    }
}

async function login(email, password) {
    try {
        const response = await fetch(getApiUrl('login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        const data = await handleApiResponse(response);
        if (data.token) {
            localStorage.setItem('token', data.token);
        }
        return { success: true, data };
    } catch (error) {
        console.error('Login failed:', error);
        return { success: false, error: error.message };
    }
}

async function signup(userData) {
    try {
        const response = await fetch(getApiUrl('signup'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData)
        });
        const data = await handleApiResponse(response);
        return { success: true, data };
    } catch (error) {
        console.error('Signup failed:', error);
        return { success: false, error: error.message };
    }
}

async function fetchUserInfo() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const response = await fetch(getApiUrl('user-info'), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return await handleApiResponse(response);
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
}

async function makeReservation(reservationData) {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('Not authenticated');
    }

    try {
        const response = await fetch(getApiUrl('reserve'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(reservationData)
        });
        return await handleApiResponse(response);
    } catch (error) {
        console.error('Reservation failed:', error);
        throw error;
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/user.html';
}

// Helper function to show notifications
function showNotification(element, message, type = 'error') {
    element.textContent = message;
    element.className = `notification ${type}`;
    element.style.display = 'block';
}

