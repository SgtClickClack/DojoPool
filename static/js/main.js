document.addEventListener('DOMContentLoaded', () => {
    const apiStatus = document.getElementById('api-status');
    const wsStatus = document.getElementById('ws-status');
    const dbStatus = document.getElementById('db-status');

    // Check API Status
    async function checkApiStatus() {
        try {
            const response = await fetch('/api/health');
            if (response.ok) {
                apiStatus.textContent = '✅ Connected';
                apiStatus.style.color = '#00ff9d';
            } else {
                throw new Error('API not responding');
            }
        } catch (error) {
            apiStatus.textContent = '❌ Disconnected';
            apiStatus.style.color = '#ff4444';
        }
    }

    // Check WebSocket Status
    function checkWebSocketStatus() {
        const ws = new WebSocket('ws://' + window.location.host + '/ws');

        ws.onopen = () => {
            wsStatus.textContent = '✅ Connected';
            wsStatus.style.color = '#00ff9d';
        };

        ws.onclose = () => {
            wsStatus.textContent = '❌ Disconnected';
            wsStatus.style.color = '#ff4444';
        };

        ws.onerror = () => {
            wsStatus.textContent = '❌ Error';
            wsStatus.style.color = '#ff4444';
        };
    }

    // Check Database Status
    async function checkDbStatus() {
        try {
            const response = await fetch('/api/health/db');
            if (response.ok) {
                dbStatus.textContent = '✅ Connected';
                dbStatus.style.color = '#00ff9d';
            } else {
                throw new Error('Database not responding');
            }
        } catch (error) {
            dbStatus.textContent = '❌ Disconnected';
            dbStatus.style.color = '#ff4444';
        }
    }

    // Initial checks
    checkApiStatus();
    checkWebSocketStatus();
    checkDbStatus();

    // Periodic checks
    setInterval(checkApiStatus, 30000);
    setInterval(checkDbStatus, 30000);
}); 