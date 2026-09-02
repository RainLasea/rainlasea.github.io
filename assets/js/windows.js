(function () {
    'use strict';

    const windowElements = Array.from(document.querySelectorAll('[data-page-window]'));
    const openers = Array.from(document.querySelectorAll('[data-open-page-window]'));
    const toolButtons = Array.from(document.querySelectorAll('[data-tool-chime]'));
    if (!windowElements.length) return;

    const states = new WeakMap();
    let topLayer = 30;
    let activeWindow = windowElements[0];
    let chimeContext = null;
    let lastChimeAt = 0;

    const unlockChime = () => {
        const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextConstructor) return null;
        if (!chimeContext) chimeContext = new AudioContextConstructor();
        if (chimeContext.state === 'suspended') void chimeContext.resume().catch(() => {});
        return chimeContext;
    };

    const playToolChime = (button) => {
        const nowMs = window.performance.now();
        if (nowMs - lastChimeAt < 80) return;

        const audioContext = unlockChime();
        if (!audioContext) return;
        lastChimeAt = nowMs;

        const startedAt = audioContext.currentTime;
        const baseFrequency = Number(button.dataset.chimeNote) || 659.25;
        const partials = [
            { ratio: 1, volume: 0.16, duration: 0.55 },
            { ratio: 2.01, volume: 0.07, duration: 0.36 },
            { ratio: 4.12, volume: 0.025, duration: 0.2 }
        ];

        partials.forEach(({ ratio, volume, duration }) => {
            const oscillator = audioContext.createOscillator();
            const gain = audioContext.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(baseFrequency * ratio, startedAt);
            gain.gain.setValueAtTime(0.0001, startedAt);
            gain.gain.exponentialRampToValueAtTime(volume, startedAt + 0.006);
            gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + duration);
            oscillator.connect(gain);
            gain.connect(audioContext.destination);
            oscillator.start(startedAt);
            oscillator.stop(startedAt + duration + 0.02);
        });

        button.classList.add('is-ringing');
        window.setTimeout(() => button.classList.remove('is-ringing'), 160);
    };

    const bringToFront = (windowElement) => {
        topLayer += 1;
        windowElement.style.zIndex = String(topLayer);
        activeWindow = windowElement;
    };

    const renderPosition = (windowElement, state) => {
        windowElement.style.setProperty('--window-x', `${state.offsetX}px`);
        windowElement.style.setProperty('--window-y', `${state.offsetY}px`);
        windowElement.classList.toggle('is-moved', state.offsetX !== 0 || state.offsetY !== 0);
    };

    const setAnimationOrigin = (windowElement, opener) => {
        if (!opener) {
            windowElement.style.setProperty('--window-origin-x', '50%');
            windowElement.style.setProperty('--window-origin-y', '50%');
            return;
        }

        const windowRect = windowElement.getBoundingClientRect();
        const openerRect = opener.getBoundingClientRect();
        const originX = openerRect.left + openerRect.width / 2 - windowRect.left;
        const originY = openerRect.top + openerRect.height / 2 - windowRect.top;
        windowElement.style.setProperty('--window-origin-x', `${originX}px`);
        windowElement.style.setProperty('--window-origin-y', `${originY}px`);
    };

    const clearAnimationTimer = (state) => {
        if (!state?.animationTimer) return;
        window.clearTimeout(state.animationTimer);
        state.animationTimer = null;
    };

    const getBaseBounds = (windowElement, state) => {
        const rect = windowElement.getBoundingClientRect();
        return {
            left: rect.left + window.scrollX - state.offsetX,
            top: rect.top + window.scrollY - state.offsetY,
            width: rect.width,
            height: rect.height
        };
    };

    const constrainPosition = (nextX, nextY, baseBounds) => {
        const pageWidth = Math.max(document.documentElement.clientWidth, document.documentElement.scrollWidth);
        const pageHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
        const minX = -baseBounds.left;
        const minY = -baseBounds.top;
        const maxX = Math.max(minX, pageWidth - baseBounds.left - baseBounds.width);
        const maxY = Math.max(minY, pageHeight - baseBounds.top - baseBounds.height);

        return {
            x: Math.min(Math.max(nextX, minX), maxX),
            y: Math.min(Math.max(nextY, minY), maxY)
        };
    };

    const openWindow = (windowElement, opener) => {
        if (!windowElement) return;
        const state = states.get(windowElement);
        clearAnimationTimer(state);
        windowElement.classList.remove('is-opening', 'is-closing');
        windowElement.classList.add('is-open');
        windowElement.setAttribute('aria-hidden', 'false');
        setAnimationOrigin(windowElement, opener);
        void windowElement.offsetWidth;
        windowElement.classList.add('is-opening');
        if (state) {
            const animationTime = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 20 : 380;
            state.animationTimer = window.setTimeout(() => {
                windowElement.classList.remove('is-opening');
                state.animationTimer = null;
            }, animationTime);
        }
        bringToFront(windowElement);
        window.requestAnimationFrame(() => {
            windowElement.querySelector('[data-page-window-drag]')?.focus({ preventScroll: true });
        });
    };

    const closeWindow = (windowElement) => {
        if (!windowElement?.hasAttribute('data-secondary-window')) return;
        const state = states.get(windowElement);
        const opener = openers.find((item) => item.dataset.openPageWindow === windowElement.id);
        clearAnimationTimer(state);
        windowElement.classList.remove('is-opening', 'is-dragging');
        setAnimationOrigin(windowElement, opener);
        void windowElement.offsetWidth;
        windowElement.classList.add('is-closing');
        windowElement.setAttribute('aria-hidden', 'true');
        opener?.focus({ preventScroll: true });
        activeWindow = windowElements[0];
        bringToFront(activeWindow);

        const animationTime = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 20 : 280;
        if (state) {
            state.animationTimer = window.setTimeout(() => {
                windowElement.classList.remove('is-open', 'is-closing');
                state.animationTimer = null;
            }, animationTime);
        }
    };

    windowElements.forEach((windowElement, index) => {
        const handle = windowElement.querySelector('[data-page-window-drag]');
        const resetButton = windowElement.querySelector('[data-page-window-reset]');
        const closeButton = windowElement.querySelector('[data-page-window-close]');
        const state = { offsetX: 0, offsetY: 0, animationTimer: null };
        states.set(windowElement, state);
        windowElement.style.zIndex = String(30 + index);
        if (!handle) return;

        windowElement.addEventListener('pointerdown', () => bringToFront(windowElement));

        const moveBy = (deltaX, deltaY) => {
            const position = constrainPosition(
                state.offsetX + deltaX,
                state.offsetY + deltaY,
                getBaseBounds(windowElement, state)
            );
            state.offsetX = position.x;
            state.offsetY = position.y;
            renderPosition(windowElement, state);
        };

        handle.addEventListener('pointerdown', (event) => {
            if (event.button !== 0 || event.target.closest('button, a')) return;
            event.preventDefault();
            bringToFront(windowElement);

            const startX = event.clientX;
            const startY = event.clientY;
            const startOffsetX = state.offsetX;
            const startOffsetY = state.offsetY;
            const baseBounds = getBaseBounds(windowElement, state);
            handle.setPointerCapture(event.pointerId);
            windowElement.classList.add('is-dragging');

            const move = (moveEvent) => {
                const position = constrainPosition(
                    startOffsetX + moveEvent.clientX - startX,
                    startOffsetY + moveEvent.clientY - startY,
                    baseBounds
                );
                state.offsetX = position.x;
                state.offsetY = position.y;
                renderPosition(windowElement, state);
            };

            const stop = () => {
                windowElement.classList.remove('is-dragging');
                handle.removeEventListener('pointermove', move);
                handle.removeEventListener('pointerup', stop);
                handle.removeEventListener('pointercancel', stop);
            };

            handle.addEventListener('pointermove', move);
            handle.addEventListener('pointerup', stop);
            handle.addEventListener('pointercancel', stop);
        });

        handle.addEventListener('keydown', (event) => {
            if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
            event.preventDefault();
            const step = event.shiftKey ? 4 : 16;
            moveBy(
                event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0,
                event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0
            );
            bringToFront(windowElement);
        });

        resetButton?.addEventListener('click', () => {
            state.offsetX = 0;
            state.offsetY = 0;
            windowElement.classList.add('is-resetting');
            renderPosition(windowElement, state);
            window.setTimeout(() => windowElement.classList.remove('is-resetting'), 220);
            handle.focus({ preventScroll: true });
        });

        closeButton?.addEventListener('click', () => closeWindow(windowElement));
    });

    openers.forEach((opener) => {
        opener.addEventListener('click', () => {
            if (opener.dataset.openPageWindow === 'work-window') unlockChime();
            openWindow(document.getElementById(opener.dataset.openPageWindow), opener);
        });
    });

    toolButtons.forEach((button) => {
        button.addEventListener('pointerenter', (event) => {
            if (event.pointerType && event.pointerType !== 'mouse') return;
            playToolChime(button);
        });
        button.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
        });
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && activeWindow?.hasAttribute('data-secondary-window')) closeWindow(activeWindow);
    });

    window.addEventListener('resize', () => {
        windowElements.forEach((windowElement) => {
            if (windowElement.getAttribute('aria-hidden') === 'true') return;
            const state = states.get(windowElement);
            const position = constrainPosition(state.offsetX, state.offsetY, getBaseBounds(windowElement, state));
            state.offsetX = position.x;
            state.offsetY = position.y;
            renderPosition(windowElement, state);
        });
    }, { passive: true });
})();
