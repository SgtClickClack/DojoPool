/**
 * Game visualization module for real-time game display
 */

class GameVisualization {
    constructor(canvasId, options = {}) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.options = {
            tableColor: '#076324',
            railColor: '#654321',
            pocketColor: '#000000',
            ballRadius: 15,
            ...options
        };
        
        // Game state
        this.ballPositions = {};
        this.lastShot = null;
        this.pocketLocations = [];
        this.tableCorners = [];
        
        // Animation state
        this.isAnimating = false;
        this.animationFrame = null;
        
        // Initialize
        this.setupCanvas();
        this.setupEventListeners();
    }
    
    setupCanvas() {
        // Make canvas responsive
        const resize = () => {
            const parent = this.canvas.parentElement;
            this.canvas.width = parent.clientWidth;
            this.canvas.height = parent.clientWidth * 0.5; // 2:1 aspect ratio
            this.render();
        };
        
        window.addEventListener('resize', resize);
        resize();
    }
    
    setupEventListeners() {
        // Add mouse/touch interaction if needed
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleMouseMove(x, y);
        });
    }
    
    updateBallPositions(positions) {
        this.ballPositions = positions;
        this.render();
    }
    
    updateShot(shotData) {
        this.lastShot = shotData;
        this.startShotAnimation();
    }
    
    updatePockets(pocketLocations) {
        this.pocketLocations = pocketLocations;
        this.render();
    }
    
    updateTableCorners(corners) {
        this.tableCorners = corners;
        this.render();
    }
    
    startShotAnimation() {
        if (!this.lastShot) return;
        
        this.isAnimating = true;
        const startTime = performance.now();
        const duration = 1000; // 1 second animation
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.render(progress);
            
            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.isAnimating = false;
                this.lastShot = null;
            }
        };
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        this.animationFrame = requestAnimationFrame(animate);
    }
    
    render(animationProgress = 0) {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw table
        this.drawTable();
        
        // Draw pockets
        this.drawPockets();
        
        // Draw balls
        this.drawBalls(animationProgress);
        
        // Draw shot animation if active
        if (this.isAnimating && this.lastShot) {
            this.drawShotAnimation(animationProgress);
        }
    }
    
    drawTable() {
        if (this.tableCorners.length !== 4) return;
        
        // Draw felt
        this.ctx.fillStyle = this.options.tableColor;
        this.ctx.beginPath();
        this.ctx.moveTo(this.tableCorners[0].x, this.tableCorners[0].y);
        for (let i = 1; i < 4; i++) {
            this.ctx.lineTo(this.tableCorners[i].x, this.tableCorners[i].y);
        }
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw rails
        this.ctx.strokeStyle = this.options.railColor;
        this.ctx.lineWidth = 20;
        this.ctx.stroke();
    }
    
    drawPockets() {
        this.ctx.fillStyle = this.options.pocketColor;
        for (const pocket of this.pocketLocations) {
            this.ctx.beginPath();
            this.ctx.arc(pocket.x, pocket.y, this.options.ballRadius * 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    drawBalls(progress) {
        for (const [ballId, position] of Object.entries(this.ballPositions)) {
            const color = this.getBallColor(parseInt(ballId));
            const { x, y } = position;
            
            // Draw ball shadow
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            this.ctx.shadowBlur = 5;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;
            
            // Draw ball
            this.ctx.fillStyle = color;
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.options.ballRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Reset shadow
            this.ctx.shadowColor = 'transparent';
            
            // Draw ball number
            this.ctx.fillStyle = this.getBallNumberColor(parseInt(ballId));
            this.ctx.font = `${this.options.ballRadius}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(ballId.toString(), x, y);
        }
    }
    
    drawShotAnimation(progress) {
        if (!this.lastShot) return;
        
        const { ball_id, velocity, direction } = this.lastShot;
        const ball = this.ballPositions[ball_id];
        if (!ball) return;
        
        // Draw shot line
        const lineLength = velocity * 50; // Scale for visualization
        const endX = ball.x + direction.x * lineLength;
        const endY = ball.y + direction.y * lineLength;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, ' + (1 - progress) + ')';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(ball.x, ball.y);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();
    }
    
    getBallColor(ballId) {
        if (ballId === 0) return '#FFFFFF'; // Cue ball
        if (ballId === 8) return '#000000'; // 8 ball
        if (ballId < 8) return '#FFD700'; // Solids
        return '#FF0000'; // Stripes
    }
    
    getBallNumberColor(ballId) {
        if (ballId === 0) return '#000000';
        if (ballId === 8) return '#FFFFFF';
        if (ballId < 8) return '#000000';
        return '#FFFFFF';
    }
    
    handleMouseMove(x, y) {
        // Implement mouse interaction if needed
    }
    
    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        window.removeEventListener('resize', this.setupCanvas);
        this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    }
}

export default GameVisualization; 