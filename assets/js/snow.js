(() => {
    'use strict';

    const canvas = document.getElementById('snowCanvas');
    const stage = canvas?.closest('.hero');
    const mountainPage = canvas?.closest('.mountain-page');
    const context = canvas?.getContext('2d');

    if (!canvas || !stage || !mountainPage || !context) return;

    const EMPTY = 0;
    const LOOSE = 1;
    const COMPACT = 2;
    const FRESH = 3;
    const MIN_CELL_SCALE = 1.6;
    const MAX_SIM_CELLS = 520000;
    const MAX_CANVAS_PIXELS = 10000000;
    const FIXED_STEP = 1 / 60;
    const MAX_FIXED_STEPS = 4;
    const REPOSE_ANGLE = 35;
    const COHESION = 0.58;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let simWidth = 1;
    let simHeight = 1;
    let viewWidth = 1;
    let viewHeight = 1;
    let dpr = 1;
    let material = new Uint8Array(1);
    let moved = new Uint8Array(1);
    let staticNoise = new Uint8Array(1);
    let pixels = new Uint8ClampedArray(4);
    let sandLayer = document.createElement('canvas');
    let sandContext = sandLayer.getContext('2d');
    let shadowLayer = document.createElement('canvas');
    let shadowContext = shadowLayer.getContext('2d');
    let emitRemainder = 0;
    let spawnLaneCount = 16;
    let spawnLanes = [];
    let spawnLaneCursor = 0;
    let elapsedTime = 0;
    let fixedAccumulator = 0;
    let frame = 0;
    let active = true;
    let animationFrame = 0;
    let previousTime = performance.now();

    function index(x, y) {
        return y * simWidth + x;
    }

    function clamp(value, minimum, maximum) {
        return Math.max(minimum, Math.min(maximum, value));
    }

    function random(minimum, maximum) {
        return minimum + Math.random() * (maximum - minimum);
    }

    function randomInt(minimum, maximum) {
        return Math.floor(random(minimum, maximum + 1));
    }

    function hash8(value) {
        value ^= value >>> 16;
        value = Math.imul(value, 0x7feb352d);
        value ^= value >>> 15;
        value = Math.imul(value, 0x846ca68b);
        value ^= value >>> 16;
        return value & 255;
    }

    function shuffleSpawnLanes() {
        for (let i = spawnLanes.length - 1; i > 0; i -= 1) {
            const swapIndex = randomInt(0, i);
            [spawnLanes[i], spawnLanes[swapIndex]] = [spawnLanes[swapIndex], spawnLanes[i]];
        }
        spawnLaneCursor = 0;
    }

    function isEmpty(x, y) {
        if (x < 0 || x >= simWidth || y < 0 || y >= simHeight) return false;
        return material[index(x, y)] === EMPTY;
    }

    function move(from, to) {
        material[to] = material[from];
        material[from] = EMPTY;
        moved[to] = 1;
    }

    function rebuildSimulation() {
        const bounds = stage.getBoundingClientRect();
        viewWidth = Math.max(1, Math.round(bounds.width));
        viewHeight = Math.max(1, Math.round(bounds.height));
        const pixelBudgetDpr = Math.sqrt(MAX_CANVAS_PIXELS / (viewWidth * viewHeight));
        dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2.5, pixelBudgetDpr));
        const cellScale = Math.max(
            MIN_CELL_SCALE,
            Math.sqrt((viewWidth * viewHeight) / MAX_SIM_CELLS)
        );
        simWidth = Math.max(128, Math.ceil(viewWidth / cellScale));
        simHeight = Math.max(180, Math.ceil(viewHeight / cellScale));

        canvas.width = Math.round(viewWidth * dpr);
        canvas.height = Math.round(viewHeight * dpr);

        sandLayer = document.createElement('canvas');
        sandLayer.width = simWidth;
        sandLayer.height = simHeight;
        sandContext = sandLayer.getContext('2d', { willReadFrequently: true });

        shadowLayer = document.createElement('canvas');
        shadowLayer.width = simWidth;
        shadowLayer.height = simHeight;
        shadowContext = shadowLayer.getContext('2d');

        material = new Uint8Array(simWidth * simHeight);
        moved = new Uint8Array(simWidth * simHeight);
        staticNoise = new Uint8Array(simWidth * simHeight);

        const image = sandContext.createImageData(simWidth, simHeight);
        pixels = image.data;
        sandLayer.imageData = image;

        for (let i = 0; i < staticNoise.length; i += 1) {
            staticNoise[i] = hash8(i);
        }

        emitRemainder = 0;
        spawnLaneCount = clamp(Math.round(viewWidth / 46), 14, 40);
        spawnLanes = Array.from({ length: spawnLaneCount }, (_, lane) => lane);
        shuffleSpawnLanes();
        elapsedTime = 0;
        fixedAccumulator = 0;
        frame = 0;
        seedAirborneSnow();
        renderMaterial();
        draw();
    }

    function seedAirborneSnow() {
        const count = clamp(Math.round(simWidth * 0.18), 28, 100);

        for (let i = 0; i < count; i += 1) {
            const x = randomInt(2, simWidth - 3);
            const y = randomInt(1, Math.max(2, Math.floor(simHeight * 0.74)));
            if (!isEmpty(x, y)) continue;
            material[index(x, y)] = Math.random() > 0.2 ? FRESH : LOOSE;
        }
    }

    function emitSnow(deltaSeconds) {
        const rate = clamp(simWidth * 0.16, 34, 118);
        emitRemainder += rate * deltaSeconds;

        while (emitRemainder >= 1) {
            if (spawnLaneCursor >= spawnLanes.length) shuffleSpawnLanes();
            const lane = spawnLanes[spawnLaneCursor];
            spawnLaneCursor += 1;
            const base = (lane + 0.5) / spawnLaneCount;
            const drift =
                Math.sin(elapsedTime * 0.31 + lane * 1.73) * 0.016 +
                Math.sin(elapsedTime * 0.13 + lane * 0.61) * 0.01;
            const jitter = random(-0.42, 0.42) / spawnLaneCount;
            const normalizedX = ((base + drift + jitter) % 1 + 1) % 1;
            const x = clamp(Math.floor(normalizedX * simWidth), 2, simWidth - 3);
            const y = randomInt(1, 3);
            const cell = index(x, y);

            if (material[cell] === EMPTY) {
                material[cell] = Math.random() < 0.78 ? FRESH : LOOSE;
            }

            emitRemainder -= 1;
        }
    }

    function simulate() {
        moved.fill(0);
        const flowChance = clamp((50 - REPOSE_ANGLE) / 22, 0.12, 0.95);

        for (let y = simHeight - 2; y >= 1; y -= 1) {
            const leftToRight = ((frame + y) & 1) === 0;

            for (let iteration = 1; iteration < simWidth - 1; iteration += 1) {
                const x = leftToRight ? iteration : simWidth - 1 - iteration;
                const current = index(x, y);
                const type = material[current];

                if (type === EMPTY || moved[current] === 1) continue;

                if (type === COMPACT) {
                    const unsupported = isEmpty(x, y + 1);
                    if (!unsupported || Math.random() > 0.035 * (1 - COHESION)) continue;
                    material[current] = LOOSE;
                }

                const below = index(x, y + 1);
                if (material[below] === EMPTY) {
                    const fallY = y + 2 < simHeight && isEmpty(x, y + 2) ? y + 2 : y + 1;
                    const windDirection = (hash8(current + frame * 13) % 3) - 1;
                    const windTargetX = x + windDirection;

                    if (
                        windDirection !== 0 &&
                        Math.random() < 0.075 &&
                        windTargetX > 0 &&
                        windTargetX < simWidth - 1 &&
                        isEmpty(windTargetX, fallY)
                    ) {
                        move(current, index(windTargetX, fallY));
                    } else {
                        move(current, index(x, fallY));
                    }
                    continue;
                }

                const preferLeft = (hash8(current + frame * 17) & 1) === 0;
                const firstDirection = preferLeft ? -1 : 1;
                const secondDirection = -firstDirection;
                const firstDiagonal = index(x + firstDirection, y + 1);
                const secondDiagonal = index(x + secondDirection, y + 1);

                if (material[firstDiagonal] === EMPTY && Math.random() < flowChance) {
                    move(current, firstDiagonal);
                    continue;
                }

                if (material[secondDiagonal] === EMPTY && Math.random() < flowChance) {
                    move(current, secondDiagonal);
                    continue;
                }

                const firstSide = index(x + firstDirection, y);
                const secondSide = index(x + secondDirection, y);
                if (material[firstSide] === EMPTY && Math.random() < flowChance * 0.032) {
                    move(current, firstSide);
                } else if (material[secondSide] === EMPTY && Math.random() < flowChance * 0.032) {
                    move(current, secondSide);
                }
            }
        }

        compactSettledSnow();
    }

    function compactSettledSnow() {
        const attempts = Math.min(360, Math.round(simWidth * 0.62));

        for (let attempt = 0; attempt < attempts; attempt += 1) {
            const x = randomInt(2, simWidth - 3);
            const y = randomInt(Math.floor(simHeight * 0.58), simHeight - 2);
            const current = index(x, y);
            const type = material[current];
            if (type !== LOOSE && type !== FRESH) continue;

            const supported = material[index(x, y + 1)] !== EMPTY;
            const surrounded =
                material[index(x - 1, y)] !== EMPTY &&
                material[index(x + 1, y)] !== EMPTY;

            if (supported && surrounded && Math.random() < 0.018 * COHESION) {
                material[current] = COMPACT;
            } else if (type === FRESH && supported && Math.random() < 0.035) {
                material[current] = LOOSE;
            }
        }
    }

    function renderMaterial() {
        const image = sandLayer.imageData;

        for (let y = 0; y < simHeight; y += 1) {
            for (let x = 0; x < simWidth; x += 1) {
                const cell = index(x, y);
                const offset = cell * 4;
                const type = material[cell];

                if (type === EMPTY) {
                    pixels[offset + 3] = 0;
                    continue;
                }

                const noise = staticNoise[cell];
                const leftEmpty = x === 0 || material[index(x - 1, y)] === EMPTY;
                const rightEmpty = x === simWidth - 1 || material[index(x + 1, y)] === EMPTY;
                const upEmpty = y === 0 || material[index(x, y - 1)] === EMPTY;
                const downEmpty = y === simHeight - 1 || material[index(x, y + 1)] === EMPTY;
                let shade = 0.9 + (noise - 128) * 0.00135;

                if (leftEmpty) shade += 0.07;
                if (upEmpty) shade += 0.08;
                if (rightEmpty) shade -= 0.04;
                if (downEmpty) shade -= 0.025;
                if (!leftEmpty && !rightEmpty && !upEmpty && !downEmpty) shade *= 0.95;
                if ((noise & 31) === 0) shade *= 1.12;
                if ((noise & 27) === 0) shade *= 0.78;
                shade = clamp(shade, 0.56, 1.16);

                const base = type === COMPACT
                    ? [207, 220, 232]
                    : type === FRESH
                        ? [247, 251, 255]
                        : [230, 240, 248];

                pixels[offset] = clamp(Math.round(base[0] * shade), 0, 255);
                pixels[offset + 1] = clamp(Math.round(base[1] * shade), 0, 255);
                pixels[offset + 2] = clamp(Math.round(base[2] * shade), 0, 255);
                pixels[offset + 3] = type === COMPACT ? 208 : type === FRESH ? 172 : 190;
            }
        }

        sandContext.putImageData(image, 0, 0);

        shadowContext.clearRect(0, 0, simWidth, simHeight);
        shadowContext.drawImage(sandLayer, 0, 0);
        shadowContext.globalCompositeOperation = 'source-in';
        shadowContext.fillStyle = 'rgba(18, 29, 43, 0.72)';
        shadowContext.fillRect(0, 0, simWidth, simHeight);
        shadowContext.globalCompositeOperation = 'source-over';
    }

    function draw() {
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        context.imageSmoothingEnabled = false;

        context.save();
        context.globalAlpha = 0.1;
        context.filter = 'blur(0.75px)';
        context.drawImage(shadowLayer, 0, 1.5, viewWidth, viewHeight);
        context.restore();

        context.drawImage(sandLayer, 0, 0, viewWidth, viewHeight);
    }

    function tick(now) {
        animationFrame = 0;
        const deltaSeconds = Math.min((now - previousTime) / 1000, 0.1);
        previousTime = now;
        fixedAccumulator += deltaSeconds;

        let steps = 0;
        while (fixedAccumulator >= FIXED_STEP && steps < MAX_FIXED_STEPS) {
            elapsedTime += FIXED_STEP;
            frame += 1;
            emitSnow(FIXED_STEP);
            simulate();
            fixedAccumulator -= FIXED_STEP;
            steps += 1;
        }

        if (steps === MAX_FIXED_STEPS) {
            fixedAccumulator = 0;
        }

        if (steps > 0) {
            renderMaterial();
            draw();
        }

        if (active && !reducedMotion) {
            animationFrame = window.requestAnimationFrame(tick);
        }
    }

    function start() {
        if (reducedMotion || animationFrame) return;
        previousTime = performance.now();
        fixedAccumulator = 0;
        animationFrame = window.requestAnimationFrame(tick);
    }

    function stop() {
        if (!animationFrame) return;
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
    }

    if ('IntersectionObserver' in window) {
        const visibilityObserver = new IntersectionObserver((entries) => {
            active = entries[0]?.isIntersecting ?? false;
            if (active) start();
            else stop();
        }, { rootMargin: '10% 0px' });
        visibilityObserver.observe(mountainPage);
    }

    if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(rebuildSimulation);
        resizeObserver.observe(stage);
    } else {
        window.addEventListener('resize', rebuildSimulation, { passive: true });
    }

    rebuildSimulation();
    start();
})();
