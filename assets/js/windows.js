(function () {
    'use strict';

    const windowElements = Array.from(document.querySelectorAll('[data-page-window]'));
    const openers = Array.from(document.querySelectorAll('[data-open-page-window]'));
    const toolButtons = Array.from(document.querySelectorAll('[data-tool-chime]'));
    if (!windowElements.length) return;

    const states = new WeakMap();
    let topLayer = 30;
    let activeWindow = windowElements[0];
    let audioContext = null;
    let audioOutput = null;
    let lastSoundAt = 0;

    const unlockAudio = () => {
        const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextConstructor) return null;
        if (!audioContext) {
            audioContext = new AudioContextConstructor();
            audioOutput = audioContext.createGain();
            audioOutput.gain.value = 0.28;
            audioOutput.connect(audioContext.destination);
        }
        if (audioContext.state === 'suspended') void audioContext.resume().catch(() => {});
        return audioContext;
    };

    const canPlaySound = (minimumGap = 45) => {
        const nowMs = window.performance.now();
        if (nowMs - lastSoundAt < minimumGap) return false;
        lastSoundAt = nowMs;
        return true;
    };

    const playTone = ({ frequency, frequencyEnd, delay = 0, duration = 0.12, volume = 0.12, type = 'sine' }) => {
        if (!audioContext || !audioOutput) return;

        const startedAt = audioContext.currentTime + delay;
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, startedAt);
        if (frequencyEnd) oscillator.frequency.exponentialRampToValueAtTime(frequencyEnd, startedAt + duration);
        gain.gain.setValueAtTime(0.0001, startedAt);
        gain.gain.exponentialRampToValueAtTime(volume, startedAt + Math.min(0.008, duration / 3));
        gain.gain.exponentialRampToValueAtTime(0.0001, startedAt + duration);
        oscillator.connect(gain);
        gain.connect(audioOutput);
        oscillator.start(startedAt);
        oscillator.stop(startedAt + duration + 0.02);
    };

    const playUiSound = (kind) => {
        unlockAudio();
        if (!canPlaySound()) return;

        if (kind === 'open') {
            playTone({ frequency: 523.25, frequencyEnd: 659.25, duration: 0.13, volume: 0.15, type: 'triangle' });
            playTone({ frequency: 783.99, delay: 0.065, duration: 0.16, volume: 0.1 });
            return;
        }

        if (kind === 'close') {
            playTone({ frequency: 587.33, frequencyEnd: 349.23, duration: 0.16, volume: 0.13, type: 'triangle' });
            return;
        }

        if (kind === 'reset') {
            playTone({ frequency: 392, frequencyEnd: 659.25, duration: 0.1, volume: 0.12, type: 'triangle' });
            playTone({ frequency: 783.99, delay: 0.075, duration: 0.11, volume: 0.09 });
            return;
        }

        if (kind === 'pickup') {
            playTone({ frequency: 440, frequencyEnd: 554.37, duration: 0.075, volume: 0.07, type: 'triangle' });
            return;
        }

        if (kind === 'drop') {
            playTone({ frequency: 174.61, frequencyEnd: 130.81, duration: 0.11, volume: 0.1, type: 'sine' });
            playTone({ frequency: 523.25, delay: 0.025, duration: 0.08, volume: 0.045, type: 'triangle' });
            return;
        }

        if (kind === 'card') {
            playTone({ frequency: 659.25, frequencyEnd: 783.99, duration: 0.09, volume: 0.12, type: 'triangle' });
            playTone({ frequency: 1046.5, delay: 0.055, duration: 0.14, volume: 0.09 });
            return;
        }

        playTone({ frequency: 698.46, frequencyEnd: 880, duration: 0.085, volume: 0.1, type: 'triangle' });
    };

    const playToolChime = (button) => {
        if (!audioContext || audioContext.state !== 'running' || !canPlaySound(80)) return;

        const baseFrequency = Number(button.dataset.chimeNote) || 659.25;
        const partials = [
            { ratio: 1, volume: 0.16, duration: 0.55 },
            { ratio: 2.01, volume: 0.07, duration: 0.36 },
            { ratio: 4.12, volume: 0.025, duration: 0.2 }
        ];

        partials.forEach(({ ratio, volume, duration }) => {
            playTone({ frequency: baseFrequency * ratio, duration, volume });
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
        playUiSound('open');
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
            let hasMoved = false;
            handle.setPointerCapture(event.pointerId);
            windowElement.classList.add('is-dragging');
            playUiSound('pickup');

            const move = (moveEvent) => {
                if (Math.abs(moveEvent.clientX - startX) + Math.abs(moveEvent.clientY - startY) > 4) hasMoved = true;
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
