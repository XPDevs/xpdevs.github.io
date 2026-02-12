/* XPDevs Gatekeeper System 
   Architect: James Turner
*/

const Gatekeeper = {
    init: function(onSuccessCallback) {
        this.createOverlay(onSuccessCallback);
    },

    createOverlay: function(callback) {
        // Create Overlay Container
        const overlay = document.createElement('div');
        overlay.id = 'gk-overlay';
        overlay.style = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(8px);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999; font-family: sans-serif;
        `;

        // Create the Rounded Card
        const card = document.createElement('div');
        card.style = `
            background: #1e1e1e; padding: 30px; border-radius: 25px;
            width: 320px; text-align: center; color: white;
            border: 1px solid #333; box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        `;
        card.innerHTML = `<h3 style="margin-bottom: 20px;">Security Verification</h3>`;

        // THE HONEYPOT (Invisible to humans)
        const honeyPot = document.createElement('input');
        honeyPot.type = 'text';
        honeyPot.id = 'gk-hp';
        honeyPot.style = 'display:none !important;'; 
        honeyPot.autocomplete = 'off';
        card.appendChild(honeyPot);

        // THE SLIDER TRACK
        const track = document.createElement('div');
        track.style = `
            width: 100%; height: 50px; background: #333; 
            border-radius: 50px; position: relative; overflow: hidden;
        `;

        // THE SLIDER HANDLE
        const handle = document.createElement('div');
        handle.style = `
            width: 60px; height: 100%; background: #fff; 
            border-radius: 50px; cursor: pointer; position: absolute;
            left: 0; top: 0; display: flex; align-items: center; 
            justify-content: center; color: #000; font-weight: bold;
            transition: background 0.3s;
        `;
        handle.innerHTML = '→';

        const trackText = document.createElement('span');
        trackText.innerText = "Slide to Verify";
        trackText.style = "position: absolute; width: 100%; left: 0; line-height: 50px; color: #888; pointer-events: none;";
        
        track.appendChild(trackText);
        track.appendChild(handle);
        card.appendChild(track);
        overlay.appendChild(card);
        document.body.appendChild(overlay);

        // SLIDER LOGIC
        let isDragging = false;
        const startDrag = () => { isDragging = true; };
        const endDrag = () => { isDragging = false; };

        const moveDrag = (e) => {
            if (!isDragging) return;
            let x = (e.touches ? e.touches[0].clientX : e.clientX) - track.getBoundingClientRect().left;
            let maxX = track.clientWidth - handle.clientWidth;
            
            if (x < 0) x = 0;
            if (x > maxX) {
                x = maxX;
                this.validate(callback);
                isDragging = false;
            }
            handle.style.left = x + 'px';
        };

        handle.addEventListener('mousedown', startDrag);
        handle.addEventListener('touchstart', startDrag);
        window.addEventListener('mousemove', moveDrag);
        window.addEventListener('touchmove', moveDrag);
        window.addEventListener('mouseup', endDrag);
        window.addEventListener('touchend', endDrag);
    },

    validate: function(callback) {
        const hp = document.getElementById('gk-hp').value;
        if (hp === "") {
            // Human verified!
            document.getElementById('gk-overlay').remove();
            if (callback) callback();
        } else {
            // Bot detected
            alert("System Error: Access Denied.");
            location.reload(); 
        }
    }
};

// This is the function you call to trigger the security
function verifyer(action) {
    Gatekeeper.init(action);
}
