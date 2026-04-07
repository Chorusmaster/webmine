import * as THREE from 'three';

const chunkSize = 16;
const chunkHeight = 16;
const stoneLevel = 8;
const airHeight = 16;

class Generator {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.chunksData = {};
  }

  generateChunk(x, z) {
    const chunkKey = `${x},${z}`;

    if (this.chunksData[chunkKey]) {
      console.warn(`Chunk at (${x}, ${z}) already exists.`);
      return;
    } 

    const blocks = [];

    for (let ly = 0; ly < chunkHeight + airHeight; ly++) {

      const layer = [];
      for (let lx = 0; lx < chunkSize; lx++) {

        const row = [];
        for (let lz = 0; lz < chunkSize; lz++) {

          if (ly <= stoneLevel) {
            row.push(2); // Stone
          } else if (ly < chunkHeight - 1) {
            row.push(3); // Dirt
          } else if (ly == chunkHeight - 1) {
            row.push(1); // Grass
          }else {
            row.push(0); // Air
          }

        }
        layer.push(row);

      }
      blocks.push(layer);

    }

    this.chunksData[chunkKey] = blocks;
  }

  renderChunk() {
    
  }
}

export default Generator;