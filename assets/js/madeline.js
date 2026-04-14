(function() {
    const illoElem = document.querySelector('.illo');
    if (!illoElem) return;

    const w = 400;
    const h = 250;
    const zoom = 1.8;
    illoElem.setAttribute('width', w);
    illoElem.setAttribute('height', h);
    illoElem.style.width = w + 'px';
    illoElem.style.height = h + 'px';

    const TAU = Zdog.TAU;
    let isSpinning = true;
    const illo = new Zdog.Illustration({
        element: illoElem,
        zoom: zoom,
        rotate: { y: -TAU/4 },
        dragRotate: true,
        onDragStart: function() {
            isSpinning = false;
        },
    });

    const madColor = {
        skin: '#FD9',
        hair: '#D53',
        parkaLight: '#67F',
        parkaDark: '#35D',
        tight: '#742',
        eye: '#333',
    };
    const badColor = {
        skin: '#EBC',
        hair: '#D4B',
        parkaLight: '#85A',
        parkaDark: '#527',
        tight: '#412',
        eye: '#D02',
    };

    const glow = 'hsla(60, 100%, 80%, 0.3)';
    const featherGold = '#FE5';

    const BokehShape = Zdog.Shape.subclass({
        bokehSize: 5,
        bokehLimit: 64,
    });

    BokehShape.prototype.updateBokeh = function() {
        this.bokeh = Math.abs(this.sortValue) / this.bokehLimit;
        this.bokeh = Math.max(0, Math.min(1, this.bokeh));
        return this.bokeh;
    };

    BokehShape.prototype.getLineWidth = function() {
        return this.stroke + this.bokehSize * this.bokeh * this.bokeh;
    };

    BokehShape.prototype.getBokehAlpha = function() {
        let alpha = 1 - this.bokeh;
        alpha *= alpha;
        return alpha * 0.8 + 0.2;
    };

    BokehShape.prototype.renderCanvasDot = function(ctx) {
        this.updateBokeh();
        ctx.globalAlpha = this.getBokehAlpha();
        Zdog.Shape.prototype.renderCanvasDot.apply(this, arguments);
        ctx.globalAlpha = 1;
    };

    BokehShape.prototype.renderPath = function(ctx, renderer) {
        this.updateBokeh();
        if (renderer.isCanvas) {
            ctx.globalAlpha = this.getBokehAlpha();
        }
        Zdog.Shape.prototype.renderPath.apply(this, arguments);
        if (renderer.isCanvas) {
            ctx.globalAlpha = 1;
        }
    };

    function makeMadeline(isGood, colors, options) {
        const rotor = new Zdog.Anchor(options);
        const body = new Zdog.Group({
            addTo: rotor,
            rotate: { x: -TAU/8 },
            translate: { z: -48 },
            updateSort: true,
        });
        const head = new Zdog.Anchor({
            addTo: body,
            translate: { y: -11, z: -2 },
            rotate: { x: TAU/8 },
        });
        const face = new Zdog.Ellipse({
            diameter: 6,
            addTo: head,
            translate: { z: 4 },
            stroke: 8,
            color: colors.skin,
        });
        const eyeGroup = new Zdog.Group({
            addTo: face,
            translate: { z: face.stroke/2 - 0.5 },
        });
        [-1, 1].forEach(xSide => {
            if (isGood) {
                new Zdog.Ellipse({
                    width: 2,
                    height: 1.3,
                    addTo: eyeGroup,
                    translate: { x: 4.5 * xSide, y: 3, z: -1 },
                    rotate: { y: -TAU/16 * xSide },
                    stroke: 1,
                    color: '#FA8',
                    fill: true,
                });
            }
            const eyeX = 3.5 * xSide;
            new Zdog.Ellipse({
                width: 0.75,
                height: 1.5,
                addTo: eyeGroup,
                color: colors.eye,
                translate: { x: eyeX },
                stroke: 2,
                fill: true,
            });
            new Zdog.Ellipse({
                addTo: eyeGroup,
                height: 3,
                width: 1.2,
                quarters: 2,
                translate: { x: eyeX, y: -3 },
                rotate: { z: -TAU/4 + 0.15 * xSide * (isGood ? 1 : -1) },
                color: colors.hair,
                stroke: 1,
                fill: false,
                closed: true,
            });
        });
        new Zdog.Shape({
            path: [{ x: -1 }, { x: 1 }, { z: -4 }],
            addTo: head,
            translate: { y: -4, z: -1 },
            stroke: 18,
            color: colors.hair,
        });
        const bang = new Zdog.Shape({
            path: [{}, { arc: [{ z: 4, y: 4 }, { z: 0, y: 8 }] }],
            addTo: head,
            translate: { x: 2, y: -7.5, z: 6 },
            rotate: { x: 0.5, z: -0.5 },
            stroke: 4,
            color: colors.hair,
            closed: false,
        });
        bang.copy({ translate: { x: 5, y: -6, z: 5 }, rotate: { x: -0.3, z: -0.5 } });
        bang.copy({ translate: { x: 5, y: -6, z: 3 }, rotate: { y: -0.7, z: -1 } });
        bang.copy({ translate: { x: -2, y: -7.5, z: 6 }, rotate: { x: 0, z: TAU/16 * 6 } });
        bang.copy({ translate: { x: -5, y: -6, z: 5 }, rotate: { x: 0, z: TAU/4 } });
        bang.copy({ translate: { x: -5, y: -6, z: 3 }, rotate: { y: 0.7, z: 1 } });
        new Zdog.Shape({
            path: [{ x: -3 }, { x: 3 }],
            addTo: head,
            stroke: 7,
            translate: { y: -8, z: 5 },
            color: colors.hair,
        });
        const trailLock = new Zdog.Shape({
            path: [{ y: -4, z: 0 }, { bezier: [{ y: -10, z: -14 }, { y: 0, z: -16 }, { y: 0, z: -26 }] }],
            addTo: head,
            translate: { z: -4, y: 0 },
            stroke: 10,
            color: colors.hair,
            closed: false,
        });
        trailLock.copy({ translate: { x: -3, z: -4 }, rotate: { z: -TAU/8 }, stroke: 8 });
        trailLock.copy({ translate: { x: 3, z: -4 }, rotate: { z: TAU/8 }, stroke: 8 });
        trailLock.copy({ translate: { y: 2 }, scale: { y: 0.5 }, stroke: 8 });

        const torsoRib = new Zdog.Ellipse({
            width: 12, height: 10, addTo: body, rotate: { x: -TAU/4 }, translate: { y: -1 }, stroke: 6,
            color: colors.parkaLight, fill: true,
        });
        torsoRib.copy({ width: 6, height: 6, translate: { y: -5 } });
        torsoRib.copy({ translate: { y: 3 } });
        torsoRib.copy({ translate: { y: 7 }, color: colors.parkaDark });
        new Zdog.Ellipse({
            width: 10, height: 8, addTo: body, rotate: { x: -TAU/4 }, translate: { y: 11 }, stroke: 4,
            color: colors.tight, fill: true,
        });
        [-1, 1].forEach(xSide => {
            const isLeft = xSide === 1;
            new Zdog.Shape({
                addTo: body, stroke: 6, translate: { x: 6 * xSide, y: -5, z: -1 }, color: colors.parkaLight,
            });
            const shoulderJoint = new Zdog.Anchor({
                addTo: body, translate: { x: 9 * xSide, y: -3, z: -2 },
                rotate: isLeft ? { x: TAU/8 * 3, z: -TAU/32 } : { z: TAU/16 * 2, x: -TAU/16 * 2 },
            });
            const armRib = new Zdog.Ellipse({
                diameter: 2, rotate: { x: -TAU/4 }, addTo: shoulderJoint, translate: { x: 0 }, stroke: 6,
                color: colors.parkaLight, fill: true,
            });
            armRib.copy({ translate: { y: 4 } });
            const elbowJoint = new Zdog.Anchor({
                addTo: shoulderJoint, translate: { y: 8 }, rotate: isLeft ? {} : { z: TAU/8 },
            });
            armRib.copy({ addTo: elbowJoint, translate: { x: 0, y: 0 } });
            armRib.copy({ addTo: elbowJoint, translate: { y: 4 }, color: colors.parkaDark });
            new Zdog.Shape({ addTo: elbowJoint, translate: { y: 9, z: -1 }, stroke: 8, color: colors.skin });
            const knee = { y: 7 };
            const thigh = new Zdog.Shape({
                path: [{ y: 0 }, knee], addTo: body, translate: { x: 4 * xSide, y: 13 },
                rotate: isLeft ? {} : { x: TAU/16 * 3, z: TAU/16 }, stroke: 8, color: colors.tight,
            });
            new Zdog.Shape({
                path: [{ y: 0 }, { y: 8 }], addTo: thigh, stroke: 6, translate: knee,
                rotate: isLeft ? {} : { x: -TAU/16 * 5 }, color: colors.tight,
            });
        });
        new Zdog.Shape({
            path: [{ x: -3 }, { x: 3 }], visible: false, addTo: body, translate: { y: 11, z: -2 },
            stroke: 8, color: colors.tight,
        });
    }

    function makeBird(options) {
        const spin = options.spin || 0;
        const arrow = new Zdog.Anchor({
            addTo: options.addTo, scale: 2/3, rotate: { z: spin },
        });
        const bird = new Zdog.Group({
            addTo: arrow, translate: { x: 87 }, rotate: { x: -spin },
        });
        new Zdog.Shape({
            path: [
                { x: -3, y: 0 },
                { arc: [{ x: -2, y: 1.5 }, { x: 0, y: 1.5 }] },
                { arc: [{ x: 2, y: 1.5 }, { x: 2, y: 0 }] },
            ],
            addTo: bird, translate: { x: 0.5 }, stroke: 3, color: options.color, fill: true,
        });
        new Zdog.Shape({ translate: { x: 4, y: -1 }, addTo: bird, stroke: 4, color: options.color });
        new Zdog.Shape({
            path: [{ x: 0, y: -1 }, { x: 3, y: 0 }, { x: 0, y: 1 }],
            addTo: bird, translate: { x: 5, y: -1 }, stroke: 1, color: options.color, fill: true,
        });
        new Zdog.Shape({
            path: [{ x: -3, z: -2 }, { x: 0, z: 0 }, { x: -3, z: 2 }],
            addTo: bird, translate: { x: -4, y: 0 }, stroke: 2, color: options.color, fill: true,
        });
        const wing = new Zdog.Shape({
            path: [
                { x: 3, y: 0 },
                { x: -1, y: -9 },
                { arc: [{ x: -5, y: -4 }, { x: -3, y: 0 }] },
            ],
            addTo: bird, translate: { z: -1.5 }, rotate: { x: TAU/8 }, stroke: 1, color: options.color, fill: true,
        });
        wing.copy({ translate: { z: 1.5 }, scale: { z: -1 }, rotate: { x: -TAU/8 } });
    }

    makeMadeline(true, madColor, { addTo: illo });
    makeMadeline(false, badColor, { addTo: illo, rotate: { y: TAU/2 } });

    const feather = new Zdog.Group({ addTo: illo, rotate: { y: -TAU/4 } });
    (function() {
        const featherPartCount = 8;
        const radius = 12;
        const angleX = (TAU / featherPartCount) / 2;
        const sector = (TAU * radius) / 2 / featherPartCount;
        for (let i = 0; i < featherPartCount; i++) {
            const curve = Math.cos((i / featherPartCount) * TAU * 3/4 + TAU * 1/4);
            const x = 4 - curve * 2;
            const y0 = sector / 2;
            const isLast = i === featherPartCount - 1;
            const y3 = isLast ? sector * -1 : -y0;
            const z1 = -radius + 2 + curve * -1.5;
            const z2 = isLast ? -radius : -radius;
            const barb = new Zdog.Shape({
                path: [
                    { x: 0, y: y0, z: -radius },
                    { x: x, y: -sector/2, z: z1 },
                    { x: x, y: -sector*3/4, z: z1 },
                    { x: 0, y: y3, z: z2 },
                ],
                addTo: feather,
                rotate: { x: angleX * -i + TAU/8 },
                stroke: 1,
                color: featherGold,
                fill: true,
            });
            barb.copy({ scale: { x: -1 } });
        }
        const rachis = new Zdog.Ellipse({
            addTo: feather, diameter: radius * 2, quarters: 2, rotate: { y: -TAU/4 }, stroke: 2, color: featherGold,
        });
        rachis.copy({ stroke: 8, color: glow, rotate: { y: -TAU/4, x: -0.5 } });
    })();

    (function() {
        const rodCount = 14;
        for (let i = 0; i < rodCount; i++) {
            const zRotor = new Zdog.Anchor({ addTo: illo, rotate: { z: TAU / rodCount * i } });
            const y0 = 32;
            const y1 = y0 + 2 + Math.random() * 24;
            new BokehShape({
                path: [{ y: y0 }, { y: y1 }],
                addTo: zRotor,
                rotate: { x: (Math.random() * 2 - 1) * TAU/8 },
                color: madColor.skin,
                stroke: 1,
                bokehSize: 6,
                bokehLimit: 70,
            });
        }
    })();

    (function() {
        const dotCount = 64;
        for (let i = 0; i < dotCount; i++) {
            const yRotor = new Zdog.Anchor({ addTo: illo, rotate: { y: TAU / dotCount * i } });
            new BokehShape({
                path: [{ z: 40 * (1 - Math.random() * Math.random()) + 32 }],
                addTo: yRotor,
                rotate: { x: (Math.random() * 2 - 1) * TAU * 3/16 },
                color: badColor.skin,
                stroke: 1 + Math.random(),
                bokehSize: 6,
                bokehLimit: 74,
            });
        }
    })();

    const birdRotor = new Zdog.Anchor({ addTo: illo, rotate: { y: TAU * -1/8 } });
    makeBird({ addTo: birdRotor, color: madColor.parkaLight, spin: TAU/2 });
    makeBird({ addTo: birdRotor, color: featherGold, spin: -TAU * 3/8 });
    makeBird({ addTo: birdRotor, color: 'white', spin: -TAU/4 });
    makeBird({ addTo: birdRotor, color: madColor.hair, spin: -TAU/8 });
    makeBird({ addTo: birdRotor, color: madColor.parkaDark, spin: TAU/8 });

    let rotateSpeed = -TAU/60;
    let xClock = 0;
    let then = new Date() - 1/60;

    function animate() {
        const now = new Date();
        const delta = now - then;
        if (isSpinning) {
            const theta = rotateSpeed / 60 * delta * -1;
            illo.rotate.y += theta;
            xClock += theta / 4;
            illo.rotate.x = Math.sin(xClock) * TAU/12;
        }
        illo.updateGraph();
        illo.renderGraph();
        then = now;
        requestAnimationFrame(animate);
    }
    animate();
})();