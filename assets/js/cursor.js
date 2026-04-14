(function() {
    const SMOOTHING = 0.2;
    let cursor = null;
    let cursorDot = null;
    let pos = { curr: null, prev: null };
    let animationFrameId = null;
    let pointerTargets = new Set();

    function isTouchDevice() {
        return window.matchMedia("(pointer: coarse)").matches || 
               /AppWebKit.*Mobile.*/.test(window.navigator.userAgent);
    }

    function moveCursor(x, y) {
        if (cursor) {
            cursor.style.left = x + 'px';
            cursor.style.top = y + 'px';
        }
    }

    function moveDot(x, y) {
        if (cursorDot) {
            cursorDot.style.left = x + 'px';
            cursorDot.style.top = y + 'px';
        }
    }

    function targetUsesPointerCursor(target) {
        let el = target instanceof Element ? target : null;
        while (el) {
            if (pointerTargets.has(el)) return true;
            el = el.parentElement;
        }
        return false;
    }

    function collectPointerTargets() {
        pointerTargets.clear();
        const allElements = document.body.getElementsByTagName('*');
        for (const el of allElements) {
            if (window.getComputedStyle(el).cursor === 'pointer') {
                pointerTargets.add(el);
            }
        }
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

    function destroy() {
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseenter', handleMouseEnter);
        document.removeEventListener('mouseleave', handleMouseLeave);
        document.removeEventListener('mousedown', handleMouseDown);
        document.removeEventListener('mouseup', handleMouseUp);
        if (cursor) cursor.remove();
        if (cursorDot) cursorDot.remove();
        cursor = null;
        cursorDot = null;
        pointerTargets.clear();
        pos = { curr: null, prev: null };
    }

    function handleMouseMove(e) {
        if (!cursor || !cursorDot) return;
        moveDot(e.clientX, e.clientY);
        if (pos.curr === null) {
            moveCursor(e.clientX, e.clientY);
        }
        pos.curr = { x: e.clientX, y: e.clientY };
        cursor.classList.remove('hidden');
        cursorDot.classList.remove('hidden');
        cursor.classList.toggle('hover', targetUsesPointerCursor(e.target));
    }

    function handleMouseEnter() {
        if (cursor) cursor.classList.remove('hidden');
        if (cursorDot) cursorDot.classList.remove('hidden');
    }

    function handleMouseLeave() {
        if (cursor) cursor.classList.add('hidden');
        if (cursorDot) cursorDot.classList.add('hidden');
    }

    function handleMouseDown() {
        if (cursor) cursor.classList.add('active');
    }

    function handleMouseUp() {
        if (cursor) cursor.classList.remove('active');
    }

    function render() {
        if (pos.curr && pos.prev) {
            pos.prev.x = (1 - SMOOTHING) * pos.prev.x + SMOOTHING * pos.curr.x;
            pos.prev.y = (1 - SMOOTHING) * pos.prev.y + SMOOTHING * pos.curr.y;
            moveCursor(pos.prev.x, pos.prev.y);
        } else if (pos.curr) {
            pos.prev = { ...pos.curr };
        }
        animationFrameId = requestAnimationFrame(render);
    }

    function mount() {
        if (isTouchDevice()) {
            destroy();
            return;
        }
        ensureElements();
        collectPointerTargets();
        const observer = new MutationObserver(() => collectPointerTargets());
        observer.observe(document.body, { childList: true, subtree: true });
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseenter', handleMouseEnter);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        render();
    }
    mount();
})();