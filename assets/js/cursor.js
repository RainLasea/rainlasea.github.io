(function () {
    'use strict';

    const LOGIC_STEP = 1000 / 60;
    const FOLLOW_SMOOTHING = 0.2;
    const MAX_FRAME_DELTA = 100;

    let cursor = null;
    let cursorDot = null;
    let animationFrameId = null;
    let previousFrameTime = null;
    let accumulator = 0;
    let pointerTarget = null;
    let hoverState = false;

    const input = { x: 0, y: 0, ready: false };
    const dotState = {
        previous: { x: 0, y: 0 },
        current: { x: 0, y: 0 }
    };
    const ringState = {
        previous: { x: 0, y: 0 },
        current: { x: 0, y: 0 }
    };

    function isTouchDevice() {
        return window.matchMedia('(pointer: coarse)').matches ||
            /AppWebKit.*Mobile.*/.test(window.navigator.userAgent);
    }

    function setPosition(element, x, y) {
        if (!element) return;
        element.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) translate(-50%, -50%)`;
    }

    function interpolate(previous, current, alpha) {
        return {
            x: previous.x + (current.x - previous.x) * alpha,
            y: previous.y + (current.y - previous.y) * alpha
        };
    }

    function targetUsesPointerCursor(target) {
        return target instanceof Element && Boolean(target.closest('a, button, [role="button"], input, select, textarea'));
    }

    function ensureElements() {
        if (!cursor) {
            cursor = document.getElementById('cursor');
            if (!cursor) {
                cursor = document.createElement('div');
                cursor.id = 'cursor';
                cursor.classList.add('hidden');
                document.body.appendChild(cursor);
            }
        }

        if (!cursorDot) {
            cursorDot = document.getElementById('cursor-dot');
            if (!cursorDot) {
                cursorDot = document.createElement('div');
                cursorDot.id = 'cursor-dot';
                cursorDot.classList.add('hidden');
                document.body.appendChild(cursorDot);
            }
        }
    }

    function resetState() {
        input.x = 0;
        input.y = 0;
        input.ready = false;
        dotState.previous.x = 0;
        dotState.previous.y = 0;
        dotState.current.x = 0;
        dotState.current.y = 0;
        ringState.previous.x = 0;
        ringState.previous.y = 0;
        ringState.current.x = 0;
        ringState.current.y = 0;
        pointerTarget = null;
        hoverState = false;
        previousFrameTime = null;
        accumulator = 0;
    }

    function destroy() {
        if (animationFrameId !== null) {
            window.cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('mouseenter', handleMouseEnter);
        document.removeEventListener('mouseleave', handleMouseLeave);
        document.removeEventListener('pointerdown', handlePointerDown);
        document.removeEventListener('pointerup', handlePointerUp);
        document.removeEventListener('pointercancel', handlePointerUp);

        if (cursor) cursor.remove();
        if (cursorDot) cursorDot.remove();
        cursor = null;
        cursorDot = null;
        resetState();
    }

    function showCursor() {
        if (cursor) cursor.classList.remove('hidden');
        if (cursorDot) cursorDot.classList.remove('hidden');
    }

    function handlePointerMove(event) {
        input.x = event.clientX;
        input.y = event.clientY;
        pointerTarget = event.target;
        const nearBottomEdge = event.clientY >= window.innerHeight - 14;
        if (cursor) cursor.classList.toggle('near-bottom-edge', nearBottomEdge);
        if (cursorDot) cursorDot.classList.toggle('near-bottom-edge', nearBottomEdge);

        if (!input.ready) {
            input.ready = true;
            dotState.previous.x = input.x;
            dotState.previous.y = input.y;
            dotState.current.x = input.x;
            dotState.current.y = input.y;
            ringState.previous.x = input.x;
            ringState.previous.y = input.y;
            ringState.current.x = input.x;
            ringState.current.y = input.y;
            setPosition(cursorDot, input.x, input.y);
            setPosition(cursor, input.x, input.y);
            showCursor();
        }
    }

    function handleMouseEnter() {
        if (input.ready) showCursor();
    }

    function handleMouseLeave() {
        if (cursor) cursor.classList.add('hidden');
        if (cursorDot) cursorDot.classList.add('hidden');
    }

    function handlePointerDown() {
        if (cursor) cursor.classList.add('active');
    }

    function handlePointerUp() {
        if (cursor) cursor.classList.remove('active');
    }

    function updateLogic() {
        if (!input.ready) return;

        dotState.previous.x = dotState.current.x;
        dotState.previous.y = dotState.current.y;
        dotState.current.x = input.x;
        dotState.current.y = input.y;

        ringState.previous.x = ringState.current.x;
        ringState.previous.y = ringState.current.y;
        ringState.current.x += (input.x - ringState.current.x) * FOLLOW_SMOOTHING;
        ringState.current.y += (input.y - ringState.current.y) * FOLLOW_SMOOTHING;

        const nextHoverState = targetUsesPointerCursor(pointerTarget);
        if (nextHoverState !== hoverState && cursor) {
            hoverState = nextHoverState;
            cursor.classList.toggle('hover', hoverState);
        }
    }

    function render(timestamp) {
        animationFrameId = window.requestAnimationFrame(render);

        if (previousFrameTime === null) {
            previousFrameTime = timestamp;
            return;
        }

        const frameDelta = Math.min(timestamp - previousFrameTime, MAX_FRAME_DELTA);
        previousFrameTime = timestamp;
        accumulator += frameDelta;

        while (accumulator >= LOGIC_STEP) {
            updateLogic();
            accumulator -= LOGIC_STEP;
        }

        if (!input.ready) return;

        const alpha = accumulator / LOGIC_STEP;
        const dotPosition = interpolate(dotState.previous, dotState.current, alpha);
        const ringPosition = interpolate(ringState.previous, ringState.current, alpha);
        setPosition(cursorDot, dotPosition.x, dotPosition.y);
        setPosition(cursor, ringPosition.x, ringPosition.y);
    }

    function mount() {
        if (isTouchDevice()) {
            destroy();
            return;
        }

        ensureElements();
        document.addEventListener('pointermove', handlePointerMove, { passive: true });
        document.addEventListener('mouseenter', handleMouseEnter);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('pointerdown', handlePointerDown, { passive: true });
        document.addEventListener('pointerup', handlePointerUp, { passive: true });
        document.addEventListener('pointercancel', handlePointerUp, { passive: true });
        animationFrameId = window.requestAnimationFrame(render);
    }

    mount();
})();
