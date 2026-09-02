(function () {
    const root = document.documentElement;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    if (!reducedMotion && finePointer) {
        let frame = 0;
        let targetX = 0;
        let targetY = 0;

        const renderParallax = () => {
            frame = 0;
            root.style.setProperty('--far-x', `${(-targetX * 7).toFixed(2)}px`);
            root.style.setProperty('--far-y', `${(3 - targetY * 3).toFixed(2)}px`);
            root.style.setProperty('--mid-x', `${(-targetX * 13).toFixed(2)}px`);
            root.style.setProperty('--mid-y', `${(5 - targetY * 5).toFixed(2)}px`);
            root.style.setProperty('--front-x', `${(-targetX * 20).toFixed(2)}px`);
            root.style.setProperty('--front-y', `${(7 - targetY * 7).toFixed(2)}px`);
        };

        window.addEventListener('pointermove', (event) => {
            targetX = (event.clientX / window.innerWidth - 0.5) * 2;
            targetY = (event.clientY / window.innerHeight - 0.5) * 2;

            if (!frame) {
                frame = window.requestAnimationFrame(renderParallax);
            }
        }, { passive: true });
    }

    const revealItems = Array.from(document.querySelectorAll('.reveal'));
    if (!reducedMotion && 'IntersectionObserver' in window && revealItems.length) {
        root.classList.add('has-reveal');
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

        revealItems.forEach((item) => observer.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add('is-visible'));
    }
})();
