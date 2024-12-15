async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch('/.netlify/functions/api/auth-status', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            return data.isAuthenticated;
        } catch (error) {
            console.error('Error checking auth status:', error);
            return false;
        }
    }
    return false;
}

async function fetchUserInfo() {
    const token = localStorage.getItem('token');
    try {
        const response = await fetch('/.netlify/functions/api/user-info', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (response.ok) {
            return await response.json();
        } else {
            throw new Error('Failed to fetch user info');
        }
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/user.html';
}

// Add this function to handle form submissions
async function handleFormSubmit(url, formData) {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(Object.fromEntries(formData))
        });
        const result = await response.json();
        return { ok: response.ok, result };
    } catch (error) {
        console.error('Error:', error);
        return { ok: false, result: { message: 'An error occurred' } };
    }
}

