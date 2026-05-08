(function() {
    // 生成星空
    const starsContainer = document.getElementById('starsContainer');
    if (starsContainer) {
        const starCount = 140;
        for (let i = 0; i < starCount; i++) {
            const star = document.createElement('div');
            star.classList.add('star');
            const size = Math.random() * 2.2 + 1;
            star.style.width = size + 'px';
            star.style.height = size + 'px';
            star.style.left = Math.random() * 100 + '%';
            star.style.top = Math.random() * 70 + '%';
            star.style.animationDelay = Math.random() * 6 + 's';
            star.style.animationDuration = Math.random() * 4 + 2 + 's';
            star.style.opacity = 0.3 + Math.random() * 0.6;
            starsContainer.appendChild(star);
        }
    }

    // 山脉鼠标视差
    const backRange = document.getElementById('backRange');
    const frontRange = document.getElementById('frontRange');
    if (backRange && frontRange) {
        let lastMouseX = window.innerWidth / 2;
        let lastMouseY = window.innerHeight / 2;

        function applyParallax(x, y) {
            const moveX = (x / window.innerWidth) - 0.5;
            const moveY = (y / window.innerHeight) - 0.5;
            frontRange.style.transform = `translate(${moveX * -28}px, ${moveY * -8}px)`;
            backRange.style.transform = `translate(${moveX * -14}px, ${moveY * -4}px)`;
        }

        window.addEventListener('mousemove', (e) => {
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
            applyParallax(lastMouseX, lastMouseY);
        });
        window.addEventListener('load', () => {
            applyParallax(lastMouseX, lastMouseY);
        });
        window.addEventListener('resize', () => {
            applyParallax(lastMouseX, lastMouseY);
        });
    }

    // Keep the Game Boy pinned to the viewport's top-right corner.
    function fixGameboyPosition() {
        const gameboy = document.getElementById('gameboyBtn');
        if (!gameboy) return;

        if (gameboy.parentElement !== document.body) {
            document.body.appendChild(gameboy);
        }

        gameboy.style.setProperty('position', 'fixed', 'important');
        gameboy.style.setProperty('top', '20px', 'important');
        gameboy.style.setProperty('right', '20px', 'important');
        gameboy.style.setProperty('left', 'auto', 'important');
        gameboy.style.setProperty('bottom', 'auto', 'important');
        gameboy.style.setProperty('margin', '0', 'important');
        gameboy.style.setProperty('transform', 'none', 'important');
        gameboy.style.setProperty('z-index', '2147483647', 'important');
        gameboy.style.setProperty('display', 'block', 'important');
        gameboy.style.setProperty('pointer-events', 'auto', 'important');
    }

    fixGameboyPosition();

    const gameboyObserver = new MutationObserver(() => {
        fixGameboyPosition();
    });

    gameboyObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style']
    });

    window.addEventListener('resize', fixGameboyPosition, { passive: true });
    window.addEventListener('load', fixGameboyPosition);
})();
