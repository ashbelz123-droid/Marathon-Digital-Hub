const canvas = document.getElementById("network");

if (canvas) {
    const ctx = canvas.getContext("2d");
    let particlesArray = [];
    let animationFrameId;

    class Particle {
        constructor(x, y, directionX, directionY, size) {
            this.x = x;
            this.y = y;
            this.directionX = directionX;
            this.directionY = directionY;
            this.size = size;
        }

        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
            ctx.fillStyle = "#00c3ff";
            ctx.fill();
        }

        update() {
            if (this.x > window.innerWidth || this.x < 0) {
                this.directionX = -this.directionX;
            }
            if (this.y > window.innerHeight || this.y < 0) {
                this.directionY = -this.directionY;
            }

            this.x += this.directionX;
            this.y += this.directionY;

            this.draw();
        }
    }

    function resizeCanvas() {
        const pixelRatio = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;

        canvas.width = width * pixelRatio;
        canvas.height = height * pixelRatio;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function init() {
        particlesArray = [];
        const particleCount = Math.min(
            Math.floor((window.innerHeight * window.innerWidth) / 9000),
            120
        );

        for (let i = 0; i < particleCount; i++) {
            const size = (Math.random() * 2) + 1;
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            const directionX = (Math.random() * 0.4) - 0.2;
            const directionY = (Math.random() * 0.4) - 0.2;

            particlesArray.push(new Particle(x, y, directionX, directionY, size));
        }
    }

    function connect() {
        for (let a = 0; a < particlesArray.length; a++) {
            for (let b = a + 1; b < particlesArray.length; b++) {
                const distance =
                    ((particlesArray[a].x - particlesArray[b].x) *
                    (particlesArray[a].x - particlesArray[b].x))
                    +
                    ((particlesArray[a].y - particlesArray[b].y) *
                    (particlesArray[a].y - particlesArray[b].y));

                if (distance < (window.innerWidth / 7) * (window.innerHeight / 7)) {
                    const opacityValue = 1 - (distance / 20000);
                    ctx.strokeStyle = `rgba(0,195,255,${opacityValue})`;
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                    ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                    ctx.stroke();
                }
            }
        }
    }

    function animate() {
        animationFrameId = requestAnimationFrame(animate);
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

        for (let i = 0; i < particlesArray.length; i++) {
            particlesArray[i].update();
        }

        connect();
    }

    window.addEventListener("resize", function () {
        cancelAnimationFrame(animationFrameId);
        resizeCanvas();
        init();
        animate();
    });

    resizeCanvas();
    init();
    animate();
}
