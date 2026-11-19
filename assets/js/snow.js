/* Wind interpolation and particle wrapping adapted from Cahil Foley's react-snowfall (MIT).
 * https://github.com/cahilfoley/react-snowfall — see assets/licenses/react-snowfall.txt. */
(() => {
    'use strict';

    const canvas = document.getElementById('snowCanvas');
    const stage = canvas?.closest('.hero');
    const context = canvas?.getContext('2d');
    if (!stage || !context) return;

    const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = matchMedia('(pointer: fine)');
    const pointer = { x: -1000, y: -1000, vx: 0, vy: 0, down: false, active: false };
    let width = 1;
    let height = 1;
    let flakes = [];
    let frame = 0;
    let previousTime = 0;
    let visible = true;
    let enabled = !motionPreference.matches;
    let elapsed = 0;
    const random = (min, max) => min + Math.random() * (max - min);

    const sprites = [0, 1, 2].map((layer) => {
        const sprite = document.createElement('canvas');
        sprite.width = sprite.height = 32;
        const ctx = sprite.getContext('2d');
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(244, 248, 255, 1)');
        gradient.addColorStop(layer === 2 ? 0.24 : 0.55, 'rgba(235, 243, 255, .85)');
        gradient.addColorStop(1, 'rgba(225, 239, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        return sprite;
    });

    class Snowflake {
        constructor() {
            const depth = Math.random();
            this.layer = depth < 0.55 ? 0 : depth < 0.9 ? 1 : 2;
            this.depth = [0.45, 0.8, 1.35][this.layer];
            this.radius = random(0.7, 1.8) * this.depth;
            this.x = random(-20, width + 20);
            this.y = random(-20, height);
            this.speed = random(15, 32) * this.depth;
            this.wind = random(-8, 12);
            this.nextWind = random(-10, 14);
            this.nextChange = random(2, 6);
            this.phase = random(0, Math.PI * 2);
            this.opacity = random(0.3, 0.75) * (this.layer === 0 ? 0.65 : 1);
            this.vx = 0;
            this.vy = 0;
        }

        update(dt) {
            this.nextChange -= dt;
            if (this.nextChange <= 0) {
                this.nextWind = random(-12, 16);
                this.nextChange = random(3, 7);
            }
            this.wind += (this.nextWind - this.wind) * (1 - Math.exp(-dt * 0.6));
            if (pointer.active) {
                const dx = this.x - pointer.x;
                const dy = this.y - pointer.y;
                const distance = Math.hypot(dx, dy);
                const radius = pointer.down ? 190 : 125;
                if (distance < radius) {
                    const influence = (1 - distance / radius) ** 2 * this.depth;
                    const strength = pointer.down ? 180 : 40;
                    this.vx += ((dx / Math.max(distance, 1)) * strength + pointer.vx * 0.16) * influence * dt;
                    this.vy += ((dy / Math.max(distance, 1)) * strength + pointer.vy * 0.12) * influence * dt;
                }
            }
            const drag = Math.exp(-dt * 1.7);
            this.vx *= drag;
            this.vy *= drag;
            this.x += (this.wind + Math.sin(elapsed * 0.5 + this.phase) * 8 + this.vx) * dt;
            this.y += (this.speed + this.vy) * dt;
            if (this.y > height + 12) { this.y = -12; this.x = random(-12, width + 12); }
            if (this.y < -24) this.y = height + 8;
            if (this.x > width + 24) this.x = -24;
            if (this.x < -24) this.x = width + 24;
        }

        draw() {
            context.globalAlpha = this.opacity;
            const size = this.radius * (this.layer === 2 ? 5 : 3);
            context.drawImage(sprites[this.layer], this.x - size / 2, this.y - size / 2, size, size);
        }
    }

    function render(time) {
        frame = 0;
        const dt = previousTime ? Math.min((time - previousTime) / 1000, 0.04) : 1 / 60;
        previousTime = time;
        elapsed += dt;
        context.clearRect(0, 0, width, height);
        flakes.forEach((flake) => { flake.update(dt); flake.draw(); });
        context.globalAlpha = 1;
        pointer.vx *= Math.exp(-dt * 7);
        pointer.vy *= Math.exp(-dt * 7);
        frame = requestAnimationFrame(render);
    }

    function sync() {
        cancelAnimationFrame(frame);
        frame = 0;
        previousTime = 0;
        canvas.dataset.state = enabled ? 'running' : 'paused';
        if (!enabled) context.clearRect(0, 0, width, height);
        if (enabled && visible && !document.hidden) frame = requestAnimationFrame(render);
    }

    function resize() {
        const bounds = stage.getBoundingClientRect();
        width = bounds.width;
        height = bounds.height;
        const dpr = Math.min(devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        const count = Math.min(finePointer.matches ? 220 : 90, Math.max(40, Math.round(width * height / 6500)));
        flakes = Array.from({ length: count }, () => new Snowflake());
        sync();
    }

    stage.addEventListener('pointermove', (event) => {
        if (!enabled || !finePointer.matches || event.pointerType === 'touch') return;
        const bounds = stage.getBoundingClientRect();
        const x = event.clientX - bounds.left;
        const y = event.clientY - bounds.top;
        if (pointer.active) {
            pointer.vx = Math.max(-600, Math.min(600, (x - pointer.x) * 20));
            pointer.vy = Math.max(-600, Math.min(600, (y - pointer.y) * 20));
        }
        pointer.x = x;
        pointer.y = y;
        pointer.active = true;
    }, { passive: true });
    stage.addEventListener('pointerdown', (event) => {
        if (event.button === 0 && event.pointerType !== 'touch' && !event.target.closest('a, button')) pointer.down = true;
    }, { passive: true });
    window.addEventListener('pointerup', () => { pointer.down = false; }, { passive: true });
    window.addEventListener('pointercancel', () => { pointer.down = false; }, { passive: true });
    stage.addEventListener('pointerleave', () => { pointer.active = false; pointer.down = false; }, { passive: true });
    motionPreference.addEventListener('change', (event) => { enabled = !event.matches; sync(); });
    document.addEventListener('visibilitychange', sync);
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }, { threshold: 0 }).observe(stage);
    new ResizeObserver(resize).observe(stage);
    resize();
})();
