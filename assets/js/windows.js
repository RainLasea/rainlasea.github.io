(function () {
    'use strict';

    const windowElements = Array.from(document.querySelectorAll('[data-page-window]'));
    const openers = Array.from(document.querySelectorAll('[data-open-page-window]'));
    const screen = document.querySelector('.computer-screen');
    const computer = document.querySelector('.computer');
    if (!screen || !windowElements.length) return;

    const states = new WeakMap();
    let topLayer = 30;
    let activeWindow = windowElements[0];
    const sounds = new Map(Object.entries({
        open: ['pop-open', 0.32],
        close: ['pop-close', 0.28],
        reset: ['pop-reset', 0.25],
        drop: ['pop-drop', 0.2],
        click: ['pop-click', 0.24]
    }).map(([kind, [name, volume]]) => {
        const audio = new Audio(`assets/audio/${name}.wav`);
        audio.preload = 'auto';
        audio.volume = volume;
        return [kind, audio];
    }));
    let soundEnabled = true;
    let currentSound = null;
    const chimeVoices = new Set();
    const chimeBuffers = new Map();
    let chimeContext = null;
    let lastChimeAt = -Infinity;
    let lastSoundAt = -Infinity;
    try { soundEnabled = localStorage.getItem('abysslasea-sound') !== 'off'; } catch (_) { /* Settings remain usable without storage. */ }

    const playUiSound = (kind) => {
        const audio = sounds.get(kind === 'link' || kind === 'card' ? 'click' : kind);
        const now = performance.now();
        if (!audio || !soundEnabled || now - lastSoundAt < 90) return;
        lastSoundAt = now;
        currentSound?.pause();
        audio.currentTime = 0;
        currentSound = audio;
        audio.play().catch((error) => {
            if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') console.warn('UI sound could not play:', error);
        });
    };

    const releaseChime = (voice) => {
        const time = chimeContext.currentTime;
        const level = voice.gain.gain.value;
        voice.gain.gain.cancelScheduledValues(time);
        voice.gain.gain.setValueAtTime(level, time);
        voice.gain.gain.linearRampToValueAtTime(0, time + .018);
        voice.source.stop(time + .025);
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

    const getBaseBounds = (windowElement) => ({
        left: windowElement.offsetLeft,
        top: windowElement.offsetTop,
        width: windowElement.offsetWidth,
        height: windowElement.offsetHeight
    });

    const constrainPosition = (nextX, nextY, baseBounds) => {
        const inset = 8;
        const minX = inset - baseBounds.left;
        const minY = inset - baseBounds.top;
        const maxX = Math.max(minX, screen.clientWidth - inset - baseBounds.left - baseBounds.width);
        const maxY = Math.max(minY, screen.clientHeight - inset - baseBounds.top - baseBounds.height);

        return {
            x: Math.min(Math.max(nextX, minX), maxX),
            y: Math.min(Math.max(nextY, minY), maxY)
        };
    };

    const openWindow = (windowElement, opener) => {
        if (!windowElement) return;
        playUiSound('open');
        const state = states.get(windowElement);
        clearAnimationTimer(state);
        windowElement.classList.remove('is-opening', 'is-closing');
        windowElement.classList.add('is-open');
        windowElement.setAttribute('aria-hidden', 'false');
        const position = constrainPosition(state.offsetX, state.offsetY, getBaseBounds(windowElement));
        state.offsetX = position.x;
        state.offsetY = position.y;
        renderPosition(windowElement, state);
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
        playUiSound('close');
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
                getBaseBounds(windowElement)
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
            const baseBounds = getBaseBounds(windowElement);
            const screenRect = screen.getBoundingClientRect();
            const scaleX = screen.clientWidth / screenRect.width;
            const scaleY = screen.clientHeight / screenRect.height;
            let hasMoved = false;
            handle.setPointerCapture(event.pointerId);
            windowElement.classList.add('is-dragging');
            computer.classList.add('is-window-dragging');

            const move = (moveEvent) => {
                if (Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY) > 4) hasMoved = true;
                const position = constrainPosition(
                    startOffsetX + (moveEvent.clientX - startX) * scaleX,
                    startOffsetY + (moveEvent.clientY - startY) * scaleY,
                    baseBounds
                );
                state.offsetX = position.x;
                state.offsetY = position.y;
                renderPosition(windowElement, state);
            };

            const stop = () => {
                windowElement.classList.remove('is-dragging');
                computer.classList.remove('is-window-dragging');
                if (hasMoved) playUiSound('drop');
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
            playUiSound('reset');
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
            openWindow(document.getElementById(opener.dataset.openPageWindow), opener);
        });
    });

    windowElements.forEach((windowElement) => {
        windowElement.addEventListener('click', (event) => {
            if (!(event.target instanceof Element)) return;
            const link = event.target.closest('a[href]');
            if (!link) return;
            playUiSound(link.classList.contains('game-card') ? 'card' : 'link');
        });
    });

    document.querySelectorAll('[data-tool-chime]').forEach((button) => {
        const step = Number(button.dataset.chimeStep);
        const baseStep = step >= 5 ? 7 : 0;
        const sample = baseStep === 7 ? 'G' : 'C';
        const playbackRate = 2 ** ((step - baseStep) / 12);
        let voice = null;
        let ringTimer = 0;
        const playChime = async () => {
            const now = performance.now();
            if (!soundEnabled || now - lastChimeAt < 90) return;
            lastChimeAt = now;
            try {
                if (!chimeContext) chimeContext = new AudioContext();
                await chimeContext.resume();
                if (!chimeBuffers.has(sample)) {
                    chimeBuffers.set(sample, fetch(`assets/audio/marimba/${sample}.wav`)
                        .then((response) => response.arrayBuffer())
                        .then((data) => chimeContext.decodeAudioData(data)));
                }
                const buffer = await chimeBuffers.get(sample);
                if (voice) releaseChime(voice);

                const source = chimeContext.createBufferSource();
                const gain = chimeContext.createGain();
                const time = chimeContext.currentTime;
                const duration = buffer.duration / playbackRate;
                source.buffer = buffer;
                source.playbackRate.value = playbackRate;
                gain.gain.setValueAtTime(0, time);
                gain.gain.linearRampToValueAtTime(.2, time + .012);
                gain.gain.setValueAtTime(.2, time + duration - .18);
                gain.gain.linearRampToValueAtTime(0, time + duration);
                source.connect(gain);
                gain.connect(chimeContext.destination);

                const note = { source, gain };
                voice = note;
                chimeVoices.add(note);
                source.onended = () => {
                    source.disconnect();
                    gain.disconnect();
                    chimeVoices.delete(note);
                    if (voice === note) voice = null;
                };
                source.start(time);
                button.classList.add('is-ringing');
                clearTimeout(ringTimer);
                ringTimer = setTimeout(() => button.classList.remove('is-ringing'), 170);
            } catch (error) {
                if (error.name !== 'NotAllowedError' && error.name !== 'AbortError') console.warn('Chime sample could not play:', error);
            }
        };
        button.addEventListener('pointerenter', (event) => {
            if (event.pointerType === 'mouse') playChime();
        });
        button.addEventListener('click', playChime);
        button.addEventListener('focus', playChime);
    });

    document.getElementById('languageToggle')?.addEventListener('click', () => playUiSound('click'));

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && activeWindow?.hasAttribute('data-secondary-window')) closeWindow(activeWindow);
    });

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) return;
        currentSound?.pause();
        chimeVoices.forEach(releaseChime);
    });

    const boundsObserver = new ResizeObserver(() => {
        windowElements.forEach((windowElement) => {
            if (windowElement.getAttribute('aria-hidden') === 'true') return;
            const state = states.get(windowElement);
            const position = constrainPosition(state.offsetX, state.offsetY, getBaseBounds(windowElement));
            state.offsetX = position.x;
            state.offsetY = position.y;
            renderPosition(windowElement, state);
        });
    });
    boundsObserver.observe(screen);
    windowElements.forEach((windowElement) => boundsObserver.observe(windowElement));
})();
