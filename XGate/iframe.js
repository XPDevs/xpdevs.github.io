(function() {
    // Check if the page is being framed or embedded
    if (window.self !== window.top) {
        // Create the absolute blocking overlay
        const overlay = document.createElement('div');
        overlay.id = 'security-shield';
        
        // Visual Styling
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100vw',
            height: '100vh',
            backgroundColor: '#0a0a0a', // Deep dark background
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: '2147483647', // Maximum possible z-index
            fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif',
            userSelect: 'none', // Prevents highlighting/selecting text
            webkitUserSelect: 'none',
            msUserSelect: 'none'
        });

        // Block Right-Click Context Menu
        overlay.oncontextmenu = (e) => {
            e.preventDefault();
            return false;
        };

        // Your secret authorization key
        const secretKey = "XP742"; 

        overlay.innerHTML = `
            <div style="padding: 40px; border-radius: 15px; background: #181818; border: 1px solid #333; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                <h2 style="margin-top: 0; font-weight: 500;">Access Restricted</h2>
                <p style="color: #aaa; margin-bottom: 25px;">Unauthorized framing detected. Please provide authorization.</p>
                
                <input type="password" id="authCode" placeholder="Enter Code" 
                    style="width: 80%; padding: 12px; border-radius: 10px; border: 1px solid #444; background: #222; color: white; outline: none; margin-bottom: 15px; text-align: center;">
                
                <button id="submitBtn" 
                    style="width: 80%; padding: 12px; border-radius: 10px; border: none; background: #0078d4; color: white; cursor: pointer; font-weight: bold; transition: background 0.2s;">
                    Authorize
                </button>
                
                <p id="errorMsg" style="color: #ff5555; margin-top: 20px; font-size: 0.9em; display: none;">
                    Invalid code. The platform remains locked.
                </p>
            </div>
        `;

        // Add to the very top of the document
        document.documentElement.appendChild(overlay);

        // Interaction Logic
        setTimeout(() => {
            const btn = document.getElementById('submitBtn');
            const input = document.getElementById('authCode');
            const error = document.getElementById('errorMsg');

            btn.onclick = () => {
                if (input.value === secretKey) {
                    overlay.remove();
                    // Re-enable interactions if necessary, though removing the div handles it
                } else {
                    error.style.display = 'block';
                    input.value = '';
                }
            };

            // Allow "Enter" key to submit
            input.onkeydown = (e) => {
                if (e.key === 'Enter') btn.onclick();
            };
        }, 100);
    }
})();
