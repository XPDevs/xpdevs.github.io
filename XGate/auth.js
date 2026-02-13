const Gatekeeper = {
    movements: 0,
    verified: false,

    init: function(onSuccessCallback) {
        this.movements = 0;
        this.verified = false;
        this.injectStyles();
        this.createOverlay(onSuccessCallback);
        
        // Track mouse movements for "bot detection"
        document.addEventListener('mousemove', () => {
            this.movements++;
        });
    },

    injectStyles: function() {
        if (document.getElementById('gk-styles')) return;
        const style = document.createElement('style');
        style.id = 'gk-styles';
        style.innerHTML = `
            @keyframes rc-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes draw-check { to { stroke-dashoffset: 0; } }
            @keyframes gk-fadein { from { opacity: 0; } to { opacity: 1; } }

            #gk-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(255, 255, 255, 0.95);
                display: flex; align-items: center; justify-content: center;
                z-index: 9999; font-family: Roboto, helvetica, arial, sans-serif;
                animation: gk-fadein 0.3s ease-out;
            }

            .rc-anchor {
                background: #f9f9f9;
                border: 1px solid #d3d3d3;
                color: #000;
                width: 304px;
                height: 78px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 12px;
                border-radius: 3px;
                box-shadow: 0 0 4px 1px rgba(0,0,0,0.08);
                cursor: pointer;
                user-select: none;
                position: relative;
                transition: opacity 0.4s ease;
            }
            .rc-anchor:hover { border: 1px solid #b2b2b2; }

            .rc-content { display: flex; align-items: center; gap: 12px; }

            .rc-checkbox-container { width: 28px; height: 28px; position: relative; background: #fff; border-radius: 2px; }
            .rc-checkbox {
                width: 100%; height: 100%; border: 2px solid #c1c1c1; border-radius: 2px;
                background: #fff; transition: border-color 0.2s;
            }
            .rc-anchor:hover .rc-checkbox { border-color: #b2b2b2; }

            .rc-spinner {
                display: none; width: 24px; height: 24px;
                border: 3px solid #4d90fe; border-right-color: transparent;
                border-radius: 50%; position: absolute; top: 2px; left: 2px;
                animation: rc-spin 0.6s linear infinite;
            }

            .rc-checkmark {
                display: none; position: absolute; top: -5px; left: -2px; width: 38px; height: 38px;
            }
            .checkmark-path {
                stroke: #00964b; stroke-width: 4; stroke-dasharray: 48; stroke-dashoffset: 48;
                fill: none; animation: draw-check 0.4s ease-in-out forwards;
            }

            .rc-label { font-size: 14px; color: #000; font-weight: 400; }

            .rc-brand { display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0.5; }
            .rc-logo {
                width: 32px; height: 32px;
                background: url('https://www.gstatic.com/recaptcha/api2/logo_48.png');
                background-size: contain; background-repeat: no-repeat;
            }
            .rc-policy { font-size: 10px; color: #555; margin-top: 4px; line-height: 1.2; text-align: center; }

            /* State Classes */
            .processing .rc-checkbox { display: none; }
            .processing .rc-spinner { display: block; }
            
            .success .rc-checkbox { display: none; }
            .success .rc-spinner { display: none; }
            .success .rc-checkmark { display: block; }

            .gk-trap-layer {
                position: absolute; opacity: 0; top: 0; left: 0; height: 0; width: 0; z-index: -1; overflow: hidden;
            }
        `;
        document.head.appendChild(style);
    },

    createOverlay: function(callback) {
        const overlay = document.createElement('div');
        overlay.id = 'gk-overlay';

        // Trap Field
        const trapLayer = document.createElement('div');
        trapLayer.className = 'gk-trap-layer';
        trapLayer.innerHTML = `
            <label for="secondary_email_check">Please leave this field empty</label>
            <input type="text" id="secondary_email_check" name="secondary_email_check" tabindex="-1" autocomplete="off">
        `;
        overlay.appendChild(trapLayer);

        // Anchor Box
        const anchor = document.createElement('div');
        anchor.className = 'rc-anchor';
        anchor.id = 'gk-anchor';
        
        anchor.innerHTML = `
            <div class="rc-content">
                <div class="rc-checkbox-container">
                    <div class="rc-checkbox"></div>
                    <div class="rc-spinner"></div>
                    <svg class="rc-checkmark" viewBox="0 0 52 52">
                        <path class="checkmark-path" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                    </svg>
                </div>
                <span class="rc-label">I'm not a robot</span>
            </div>
            <div class="rc-brand">
                <div class="rc-logo"></div>
                <div class="rc-policy">reCAPTCHA<br>Privacy - Terms</div>
            </div>
        `;

        // Click Handler
        anchor.onclick = () => {
            if (this.verified) return;
            
            const trapField = document.getElementById('secondary_email_check');
            if (trapField.value !== "") {
                window.location.reload();
                return;
            }

            this.verified = true;
            anchor.classList.add('processing');

            setTimeout(() => {
                // Check movements (simple bot check)
                if (this.movements > 1 && trapField.value === "") {
                    anchor.classList.remove('processing');
                    anchor.classList.add('success');
                    anchor.style.cursor = 'default';
                    
                    // Success sequence
                    setTimeout(() => {
                        overlay.style.transition = 'opacity 0.4s ease';
                        overlay.style.opacity = '0';
                        setTimeout(() => {
                            overlay.remove();
                            if (callback) callback();
                        }, 400);
                    }, 1000);
                } else {
                    // Failed check
                    window.location.reload();
                }
            }, 1500); // Fake processing delay
        };

        overlay.appendChild(anchor);
        document.body.appendChild(overlay);
    }
};

// This is the function you call to trigger the security
function verifyer(action) {
    Gatekeeper.init(action);
}
