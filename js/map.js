export class MapManager {
    constructor(game) {
        this.game = game;
        this.mapWidth = 6000;
        this.mapHeight = 6000;
        this.tileSize = 1000;
        this.tileRows = this.mapHeight / this.tileSize;
        this.tileCols = this.mapWidth / this.tileSize;
        this.tilesLoaded = 0;
        this.totalTiles = this.tileRows * this.tileCols;
        this.mapTiles = [];
        this.mapPreRendered = false;
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.width = this.mapWidth;
        this.bgCanvas.height = this.mapHeight;
        this.bgCtx = this.bgCanvas.getContext('2d');
        this.loadTiles();
    }
    loadTiles() {
        for (let i = 0; i < this.totalTiles; i++) {
            const img = new Image();
            const fileIndex = i + 1;
            img.src = `assets/background/background${fileIndex}.png`;
            img.onload = () => {
                this.tilesLoaded++;
                if (this.tilesLoaded === this.totalTiles) {
                    this.createOffscreenMap();
                    this.game.onMapLoaded();
                }
            };
            this.mapTiles[i] = img;
        }
    }
    createOffscreenMap() {
        if (this.mapPreRendered) return;
        let tileIndex = 0;
        for (let y = 0; y < this.tileRows; y++) {
            for (let x = 0; x < this.tileCols; x++) {
                const tile = this.mapTiles[tileIndex];
                if (tile && tile.complete) {
                    const drawX = x * this.tileSize;
                    const drawY = y * this.tileSize;
                    this.bgCtx.drawImage(tile, drawX, drawY, this.tileSize, this.tileSize);
                }
                tileIndex++;
            }
        }
        this.mapPreRendered = true;
        this.mapTiles = null;
    }
    draw(ctx) { 
        if (!this.mapPreRendered) {
            const canvasWidthUnscaled = this.game.canvas.width / this.game.cameraZoom;
            const canvasHeightUnscaled = this.game.canvas.height / this.game.cameraZoom;
            ctx.fillStyle = "#111";
            ctx.fillRect(this.game.cameraX, this.game.cameraY, canvasWidthUnscaled, canvasHeightUnscaled);
            ctx.fillStyle = "white";
            ctx.font = "20px Arial";
            ctx.textAlign = "center";
            ctx.fillText(
                `Loading Map: ${Math.floor((this.tilesLoaded / this.totalTiles) * 100)}%`, 
                this.game.cameraX + canvasWidthUnscaled / 2, 
                this.game.cameraY + canvasHeightUnscaled / 2  
            );
            ctx.font = "30px Arial";
            return;
        }
        ctx.drawImage(
            this.bgCanvas, 
            0, 
            0, 
            this.mapWidth, 
            this.mapHeight, 
            0, 
            0, 
            this.mapWidth, 
            this.mapHeight 
        );
    }
}