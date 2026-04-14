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
})();