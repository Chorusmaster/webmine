import * as THREE from 'three';
import BlockRenderer from './blocks/BlockRenderer.js';

const chunkSize = 16;
const chunkHeight = 16;
const stoneLevel = 8;

class Generator {
  constructor(scene) {
    this.scene = scene;
    this.blockRenderers = {
      1: new BlockRenderer(1),
      2: new BlockRenderer(2),
      3: new BlockRenderer(3),
    }
  }

  generateChunk(x, z) {
    for (let i = 0; i < chunkSize; i++) {
      for (let j = 0; j < chunkSize; j++) {
        for (let k = 0; k < chunkHeight; k++) {
          if (k == chunkHeight - 1) {
            const block = this.blockRenderers[2].render(x + i, k, z + j);
            this.scene.add(block);
          } else if (k < stoneLevel) {
            const block = this.blockRenderers[3].render(x + i, k, z + j);
            this.scene.add(block);
          } else {
            const block = this.blockRenderers[1].render(x + i, k, z + j);
            this.scene.add(block);
          }
        }
      }
    }
  }
}

export default Generator;