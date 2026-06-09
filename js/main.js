/* ==========================================================================
   WINTER STUDIO - RETRO GAMING PORTFOLIO SCRIPT
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- State Variables ---
    let currentLevel = 1;
    const totalLevels = 4;
    let coins = 0;
    let hp = 99;
    let isMuted = false;
    let crtEnabled = false;
    let audioCtx = null;
    let currentClass = 'dev';

    // --- DOM Elements ---
    const levels = document.querySelectorAll('.game-level');
    const coinCounter = document.getElementById('coin-counter');
    const hpBar = document.getElementById('hp-bar');
    const hpText = document.getElementById('hp-text');
    
    // Gamepad Buttons
    const btnDpadLeft = document.getElementById('btn-dpad-left');
    const btnDpadRight = document.getElementById('btn-dpad-right');
    const btnDpadUp = document.getElementById('btn-dpad-up');
    const btnDpadDown = document.getElementById('btn-dpad-down');
    const btnSelect = document.getElementById('btn-select');
    const btnStart = document.getElementById('btn-start');
    const btnActionA = document.getElementById('btn-action-a');
    const btnActionB = document.getElementById('btn-action-b');
    const coinSlot = document.getElementById('coin-slot-trigger');
    const crtOverlay = document.getElementById('crt-overlay');
    
    // Level 1: Class selection
    const classButtons = document.querySelectorAll('.class-selector button');
    const classTitle = document.getElementById('class-title');
    const avatarSprite = document.getElementById('avatar-sprite');
    
    // Level 2: Carousel
    const carouselThumbs = document.querySelectorAll('.carousel-thumb');
    const currentCarouselImg = document.getElementById('current-carousel-img');
    const carouselCaption = document.getElementById('carousel-caption');

    // Level 3: Cartridges
    const cartridgeItems = document.querySelectorAll('.cartridge-item');
    const projectTitle = document.getElementById('project-title');
    const projectDesc = document.getElementById('project-desc');
    const projectPlatform = document.getElementById('project-platform');
    const projectStatus = document.getElementById('project-status');
    const projectYear = document.getElementById('project-year');
    const projectLinksArea = document.getElementById('project-links-area');
    
    // Level 4: Form
    const questForm = document.getElementById('quest-form');
    const formSuccessMsg = document.getElementById('form-success-msg');
    
    // Toast Notification
    const toast = document.getElementById('game-toast');
    const toastMsg = document.getElementById('toast-message');

    // --- Web Audio API retro synthesizer ---
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playSound(type) {
        if (isMuted) return;
        try {
            initAudio();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            const now = audioCtx.currentTime;

            if (type === 'coin') {
                // Short double bleep (retro coin sound)
                osc.type = 'square';
                osc.frequency.setValueAtTime(587.33, now); // D5
                osc.frequency.setValueAtTime(880, now + 0.08); // A5
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } 
            else if (type === 'select') {
                // Short low blip
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(330, now); // E4
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } 
            else if (type === 'laser') {
                // Descending pitch sweep (retro gun/shoot sound)
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.start(now);
                osc.stop(now + 0.25);
            } 
            else if (type === 'jump') {
                // Ascending sweep
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(600, now + 0.2);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } 
            else if (type === 'powerup') {
                // Happy fast scale
                osc.type = 'square';
                const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
                notes.forEach((freq, idx) => {
                    osc.frequency.setValueAtTime(freq, now + idx * 0.07);
                });
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.setValueAtTime(0.08, now + 0.2);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            }
            else if (type === 'damage') {
                // Low noise-like rumble
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(120, now);
                osc.frequency.linearRampToValueAtTime(40, now + 0.3);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            }
        } catch (e) {
            console.warn("Audio Context failed to play sound: ", e);
        }
    }

    // --- Toast / Notification Manager ---
    function showToast(message) {
        toastMsg.textContent = message;
        toast.classList.remove('hidden');
        playSound('powerup');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 2500);
    }

    // --- Level Navigation ---
    function setLevel(lvlNum) {
        if (lvlNum < 1 || lvlNum > totalLevels) return;
        
        // Play click sound
        playSound('select');
        
        // Remove active class from current level
        document.querySelector(`.game-level.active`)?.classList.remove('active');
        
        // Set new level
        currentLevel = lvlNum;
        const newLvlEl = document.getElementById(`level-1`); // Fallback
        const actualLvlEl = document.getElementById(`level-${lvlNum}`);
        if (actualLvlEl) {
            actualLvlEl.classList.add('active');
        }
        
        // Update HUD stats (XP / Level indicator)
        const hudLvl = document.querySelector('.hud-level .hud-value');
        if (hudLvl) {
            hudLvl.textContent = String(lvlNum).padStart(2, '0');
        }
        
        // Custom level transition triggers
        if (lvlNum === 2) {
            addCoins(10); // Reward for viewing featured game
        }
    }

    function nextLevel() {
        let target = currentLevel + 1;
        if (target > totalLevels) target = 1;
        setLevel(target);
    }

    function prevLevel() {
        let target = currentLevel - 1;
        if (target < 1) target = totalLevels;
        setLevel(target);
    }

    // --- Score / Coins Systems ---
    function addCoins(amount) {
        coins += amount;
        coinCounter.textContent = String(coins).padStart(6, '0');
        playSound('coin');
    }

    function handleDamage(amount) {
        hp = Math.max(0, hp - amount);
        hpText.textContent = `${hp}/99`;
        hpBar.style.width = `${(hp / 99) * 100}%`;
        playSound('damage');

        if (hp <= 0) {
            showToast("GAME OVER! INSERT COIN");
            setTimeout(() => {
                hp = 99;
                hpText.textContent = `${hp}/99`;
                hpBar.style.width = '100%';
                addCoins(-Math.min(coins, 50)); // Penalty
            }, 3000);
        }
    }

    // --- Level 1: RPG Class Configuration ---
    const classStats = {
        dev: {
            title: 'DEVSMITH',
            color: 'bg-cyan',
            skills: ['95%', '85%', '90%', '99%'],
            avatar: 'dev-class'
        },
        opt: {
            title: 'OPTMAGE',
            color: 'bg-green',
            skills: ['80%', '99%', '85%', '99%'],
            avatar: 'opt-class'
        },
        phys: {
            title: 'PHYSTECH',
            color: 'bg-yellow',
            skills: ['90%', '80%', '99%', '99%']
        }
    };

    function setClass(className) {
        if (!classStats[className]) return;
        currentClass = className;
        playSound('select');
        
        // Update Active Button state
        classButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-class="${className}"]`)?.classList.add('active');

        // Update titles
        classTitle.textContent = classStats[className].title;
        
        // Update stats progress bars
        const statBars = document.querySelectorAll('.rpg-stats .stat-bar');
        const statVals = document.querySelectorAll('.rpg-stats .stat-val');
        const stats = classStats[className].skills;
        
        statBars.forEach((bar, idx) => {
            bar.style.width = stats[idx];
            // Remove previous color classes
            bar.className = 'stat-bar ' + classStats[className].color;
            statVals[idx].textContent = stats[idx];
        });

        // Update Avatar visual class
        avatarSprite.className = `pixel-avatar ${className}-sprite`;
        
        // Add random coins
        addCoins(2);
    }

    classButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cls = e.target.getAttribute('data-class');
            setClass(cls);
        });
    });

    // Draw initial simple pixel representations in the avatar sprite container
    // We can set background CSS in code to show awesome pixel shapes
    function renderPixelAvatars() {
        // We define background sprites inline via SVG data-uris to keep the project completely dependency-free
        const devSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' width='120' height='120' style='image-rendering:pixelated'%3E%3Crect width='16' height='16' fill='none'/%3E%3C!-- Face --%3E%3Crect x='4' y='3' width='8' height='8' fill='%23ffdbac'/%3E%3C!-- Hair --%3E%3Crect x='3' y='2' width='10' height='2' fill='%233b2219'/%3E%3Crect x='3' y='4' width='2' height='4' fill='%233b2219'/%3E%3Crect x='11' y='4' width='2' height='4' fill='%233b2219'/%3E%3C!-- Glasses (Devsmith) --%3E%3Crect x='4' y='5' width='3' height='2' fill='%2300f0ff'/%3E%3Crect x='9' y='5' width='3' height='2' fill='%2300f0ff'/%3E%3Crect x='7' y='5' width='2' height='1' fill='%23000'/%3E%3C!-- Mouth --%3E%3Crect x='6' y='9' width='4' height='1' fill='%23e0a899'/%3E%3C!-- Body / Clothes --%3E%3Crect x='3' y='11' width='10' height='5' fill='%231e3a8a'/%3E%3Crect x='5' y='11' width='6' height='5' fill='%2300f0ff'/%3E%3C/svg%3E")`;
        
        const optSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' width='120' height='120' style='image-rendering:pixelated'%3E%3Crect width='16' height='16' fill='none'/%3E%3C!-- Wizard Face --%3E%3Crect x='5' y='5' width='6' height='6' fill='%23ffdbac'/%3E%3C!-- Wizard Hat (Optmage) --%3E%3Cpath d='M7 0h2v1H7zm-1 1h4v1H6zm-1 2h6v1H5zm-1 1h8v1H4z' fill='%2300ff66'/%3E%3Crect x='3' y='4' width='10' height='1' fill='%23ffd700'/%3E%3C!-- Eyes (Glowing Green) --%3E%3Crect x='6' y='7' width='1' height='1' fill='%2300ff66'/%3E%3Crect x='9' y='7' width='1' height='1' fill='%2300ff66'/%3E%3C!-- Beard --%3E%3Cpath d='M5 9h6v1H5zm1 1h4v1H6zm2 1v1H8z' fill='%23e2e8f0'/%3E%3C!-- Body / Robe --%3E%3Crect x='3' y='11' width='10' height='5' fill='%230d1527'/%3E%3Crect x='4' y='11' width='8' height='5' fill='%2300ff66'/%3E%3C/svg%3E")`;
        
        const physSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' width='120' height='120' style='image-rendering:pixelated'%3E%3Crect width='16' height='16' fill='none'/%3E%3C!-- Mech Face --%3E%3Crect x='4' y='4' width='8' height='7' fill='%2364748b'/%3E%3Crect x='5' y='5' width='6' height='5' fill='%2394a3b8'/%3E%3C!-- Visor (Phystech) --%3E%3Crect x='5' y='6' width='6' height='2' fill='%23ff3e3e'/%3E%3C!-- Shoulders / Plate --%3E%3Crect x='2' y='11' width='12' height='5' fill='%23334155'/%3E%3Crect x='4' y='12' width='8' height='4' fill='%23ffd700'/%3E%3Crect x='1' y='9' width='2' height='4' fill='%23ff3e3e'/%3E%3Crect x='13' y='9' width='2' height='4' fill='%23ff3e3e'/%3E%3C/svg%3E")`;

        // Inject in stylesheets or inline style
        const style = document.createElement('style');
        style.textContent = `
            .dev-sprite { background-image: ${devSvg}; }
            .opt-sprite { background-image: ${optSvg}; }
            .phys-sprite { background-image: ${physSvg}; }
        `;
        document.head.appendChild(style);
        
        // Initial setup
        avatarSprite.classList.add('dev-sprite');
    }

    renderPixelAvatars();

    // --- Level 2: Screenshot Carousel ---
    carouselThumbs.forEach(thumb => {
        thumb.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const imgSrc = btn.getAttribute('data-img');
            const imgCaption = btn.getAttribute('title');

            playSound('select');
            
            // Set thumbnail active
            carouselThumbs.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');

            // Change image and caption
            currentCarouselImg.style.opacity = 0;
            setTimeout(() => {
                currentCarouselImg.setAttribute('src', imgSrc);
                currentCarouselImg.setAttribute('alt', imgCaption);
                carouselCaption.textContent = imgCaption;
                currentCarouselImg.style.opacity = 1;
            }, 150);

            // Add coins
            addCoins(1);
        });
    });

    // --- Level 3: Cartridges & Portfolio ---
    const projects = {
        poly: {
            title: "POLY MERCENARIOS",
            desc: "El juego principal publicado por Winter Studio en Google Play Store. Un shooter de supervivencia zombie en 3D con un detallado estilo visual Low-Poly. Integra daño localizado (dismembramiento físico), sistema de combos masivos y un inventario táctico espacial donde debes ordenar tus armas, cargadores y salud para sobrevivir.",
            platform: "Google Play Store / Android",
            status: "Publicado",
            year: "2026",
            tags: ['Unity 3D', 'C#', 'Android'],
            link: "https://play.google.com/store/apps/details?id=com.WinterStudio.PolyMercenarios"
        }
    };

    function loadProject(projKey) {
        if (!projects[projKey]) return;
        const p = projects[projKey];
        
        playSound('coin'); // Insert tape sound!

        // Update active cartridge
        cartridgeItems.forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-project="${projKey}"]`)?.classList.add('active');

        // Update detail panel with animation
        const panel = document.getElementById('project-details-panel');
        panel.style.transform = 'scale(0.97)';
        panel.style.opacity = 0.5;

        setTimeout(() => {
            projectTitle.textContent = p.title;
            projectDesc.textContent = p.desc;
            projectPlatform.textContent = p.platform;
            projectStatus.textContent = p.status;
            projectYear.textContent = p.year;

            // Generate Tags
            const tagContainer = panel.querySelector('.project-tags');
            tagContainer.innerHTML = '';
            
            const badges = ['badge-cyan', 'badge-green', 'badge-red'];
            p.tags.forEach((tag, idx) => {
                const b = document.createElement('span');
                b.className = `badge ${badges[idx % badges.length]}`;
                b.textContent = tag;
                tagContainer.appendChild(b);
            });

            // Update Link Button
            projectLinksArea.innerHTML = `<a href="${p.link}" target="_blank" rel="noopener noreferrer" class="btn-retro btn-sm text-glow">ABRIR QUEST LINK</a>`;

            // Reset animation styles
            panel.style.transform = 'scale(1)';
            panel.style.opacity = 1;
        }, 150);
    }

    cartridgeItems.forEach(item => {
        item.addEventListener('click', (e) => {
            const key = e.currentTarget.getAttribute('data-project');
            loadProject(key);
        });
    });

    // --- Level 4: Dialog Box & Form ---
    const dialogTexts = [
        "¡Hola! Soy Winter_Bot. ¿Deseas iniciar una partida cooperativa con Saoc o contratarlo para tu próximo proyecto Unity?",
        "Por favor completa el registro del Quest para enviarle una transmisión directa.",
        "También puedes revisar su LinkedIn en /in/saoc. ¡Responde rápido!",
        "¿Sabías que Poly Mercenarios tiene físicas de desmembramiento? ¡Está brutal!"
    ];
    let dialogIndex = 0;
    const dialogTextEl = document.getElementById('dialog-text');

    // Make avatar click trigger dialog text changes
    document.querySelector('.speaker-avatar')?.addEventListener('click', () => {
        playSound('select');
        dialogIndex = (dialogIndex + 1) % dialogTexts.length;
        dialogTextEl.textContent = dialogTexts[dialogIndex];
    });

    questForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        playSound('powerup');
        
        // Show success
        questForm.classList.add('hidden');
        formSuccessMsg.classList.remove('hidden');

        // Award massive coins!
        addCoins(100);
        showToast("QUEST COMPLETE: TRANSMISSION SENT!");

        // Simulate network reset
        setTimeout(() => {
            questForm.reset();
            questForm.classList.remove('hidden');
            formSuccessMsg.classList.add('hidden');
        }, 8000);
    });

    // --- Arcade Gamepad Interaction ---
    
    // Direction Pad navigates levels
    btnDpadLeft.addEventListener('click', () => {
        prevLevel();
    });
    btnDpadRight.addEventListener('click', () => {
        nextLevel();
    });
    btnDpadUp.addEventListener('click', () => {
        prevLevel();
    });
    btnDpadDown.addEventListener('click', () => {
        nextLevel();
    });

    // CRT Scanlines Overlay Switch
    btnSelect.addEventListener('click', () => {
        crtEnabled = !crtEnabled;
        playSound('select');
        if (crtEnabled) {
            crtOverlay.classList.remove('disabled');
            showToast("CRT MONITOR: ON");
        } else {
            crtOverlay.classList.add('disabled');
            showToast("CRT MONITOR: OFF");
        }
    });

    // Audio sound toggle (Mute / Unmute)
    btnStart.addEventListener('click', () => {
        isMuted = !isMuted;
        if (isMuted) {
            showToast("AUDIO: MUTED");
        } else {
            initAudio();
            showToast("AUDIO: UNMUTED");
            playSound('powerup');
        }
    });

    // Action A Button: Jump (Add coins/points)
    btnActionA.addEventListener('click', () => {
        playSound('jump');
        addCoins(1);
        
        // Dynamic HP heal easter egg!
        if (hp < 99) {
            hp = Math.min(99, hp + 1);
            hpText.textContent = `${hp}/99`;
            hpBar.style.width = `${(hp / 99) * 100}%`;
        }
        
        // Trigger small visual jump in avatar
        avatarSprite.style.transform = 'translateY(-15px)';
        setTimeout(() => {
            avatarSprite.style.transform = 'translateY(0)';
        }, 150);
    });

    // Action B Button: Laser/Action (Damage test easter egg!)
    btnActionB.addEventListener('click', () => {
        playSound('laser');
        
        // Damage self for fun
        handleDamage(5);
        
        // Show flash screen effect
        const screen = document.querySelector('.arcade-screen');
        screen.style.boxShadow = 'inset 0 0 40px rgba(255, 62, 62, 0.4)';
        setTimeout(() => {
            screen.style.boxShadow = 'inset 0 0 30px rgba(0, 0, 0, 0.95)';
        }, 150);
    });

    // Coin slot trigger
    coinSlot.addEventListener('click', () => {
        addCoins(25);
        showToast("CREDIT INSERTED: +25 COINS");
    });

    // --- Keyboard Event Listeners for Gamepad emulation ---
    window.addEventListener('keydown', (e) => {
        // Prevent scrolling with arrows/space in game shell
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) > -1) {
            e.preventDefault();
        }

        switch (e.key) {
            case 'ArrowLeft':
            case 'a':
            case 'A':
                btnDpadLeft.click();
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                btnDpadRight.click();
                break;
            case 'ArrowUp':
            case 'w':
            case 'W':
                btnDpadUp.click();
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                btnDpadDown.click();
                break;
            case 'Enter': // Start button mapping
                btnStart.click();
                break;
            case ' ': // Select button mapping
                btnSelect.click();
                break;
            case 'z':
            case 'Z': // Action A mapping
                btnActionA.click();
                break;
            case 'x':
            case 'X': // Action B mapping
                btnActionB.click();
                break;
        }
    });

    // --- Snowfall Animation (Canvas-based) ---
    const canvas = document.getElementById('snow-canvas');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    let particles = [];
    const maxParticles = 65;
    let wind = 0;
    let mouse = { x: -1000, y: -1000 };

    class Snowflake {
        constructor() {
            this.reset();
        }

        reset() {
            this.x = Math.random() * width;
            this.y = Math.random() * -height;
            this.r = Math.random() * 2.5 + 0.8; // Snowflake size
            this.d = Math.random() * maxParticles; // Density index
            this.vy = Math.random() * 1.5 + 0.8; // Fall velocity
            this.vx = Math.random() * 0.5 - 0.25; // Wobble velocity
            this.opacity = Math.random() * 0.6 + 0.2;
        }

        update() {
            this.y += this.vy;
            this.x += this.vx + wind;

            // Wobble
            this.vx += Math.sin(this.y / 20) * 0.02;

            // Mouse repulsion
            const dx = this.x - mouse.x;
            const dy = this.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 80) {
                const forceX = dx / dist;
                const forceY = dy / dist;
                const strength = (80 - dist) / 80;
                this.x += forceX * strength * 4;
                this.y += forceY * strength * 2;
            }

            // Loop boundaries
            if (this.y > height || this.x < 0 || this.x > width) {
                this.reset();
                this.y = 0;
            }
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(226, 232, 240, ${this.opacity})`;
            ctx.fill();
        }
    }

    // Initialize snow particles
    for (let i = 0; i < maxParticles; i++) {
        particles.push(new Snowflake());
    }

    function animateSnow() {
        ctx.clearRect(0, 0, width, height);
        
        // Subtle wind drift adjustment
        wind += (Math.random() - 0.5) * 0.01;
        wind = Math.max(-0.4, Math.min(0.4, wind));

        particles.forEach(p => {
            p.update();
            p.draw();
        });

        requestAnimationFrame(animateSnow);
    }

    // Resize listener
    window.addEventListener('resize', () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    });

    // Track mouse
    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = -1000;
        mouse.y = -1000;
    });

    // Start snowfall
    animateSnow();

    // --- Tutorial Modal Logic ---
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    const btnCloseTutorial = document.getElementById('btn-close-tutorial');

    if (!localStorage.getItem('winter_studio_visited')) {
        tutorialOverlay.classList.remove('hidden');
    }

    btnCloseTutorial.addEventListener('click', () => {
        // Init audio on click to satisfy browser user-interaction rules
        initAudio();
        playSound('powerup');
        tutorialOverlay.classList.add('hidden');
        localStorage.setItem('winter_studio_visited', 'true');
        
        setTimeout(() => {
            showToast("GAME START: WINTER STUDIO PORTFOLIO!");
        }, 300);
    });

    // Welcome start bleep melody if not showing tutorial
    if (localStorage.getItem('winter_studio_visited') && window.location.hash !== '#privacy') {
        setTimeout(() => {
            showToast("GAME START: WINTER STUDIO PORTFOLIO!");
        }, 1200);
    }

    // --- Privacy Policy Modal Logic ---
    const privacyOverlay = document.getElementById('privacy-overlay');
    const btnClosePrivacy = document.getElementById('btn-close-privacy');

    function checkHash() {
        if (window.location.hash === '#privacy') {
            privacyOverlay.classList.remove('hidden');
        } else {
            privacyOverlay.classList.add('hidden');
        }
    }

    btnClosePrivacy.addEventListener('click', () => {
        playSound('select');
        window.location.hash = ''; // Clear hash
    });

    window.addEventListener('hashchange', checkHash);
    checkHash();

});
