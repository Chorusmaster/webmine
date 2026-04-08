import * as THREE from 'three';
import Chunk from './Chunk.js';

const renderDistance = 3;

class СhunkManager {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.chunks = {};
  }

  generateChunk(x, z) {
    const key = `${x},${z}`;
    if (key in this.chunks) {
      return 0;
    }

    const newChunk = new Chunk(this.scene, x, z, this);
    newChunk.generate();
    this.chunks[key] = newChunk;

    this.updateChunkRender(x, z);
    return 1;
  }

  updateChunkRender(x, z) {
    for (let i = x - 1; i <= x + 1; i++) {
      for (let j = z - 1; j <= z + 1; j++) {
        const key = `${i},${j}`;
        if (this.chunks[key]) this.chunks[key].render();
      }
    }
  }

  generateAround(x, z) {
    for (let cx = -renderDistance + 1; cx < renderDistance; cx++) {
      for (let cz = -renderDistance + 1; cz < renderDistance; cz++) {
        this.generateChunk(Math.floor(x / 16) + cx, Math.floor(z / 16) + cz);
      }
    }

    this.unloadAround(x, z);
  }

  unloadAround(x, z) {
    const centerX = Math.floor(x / 16);
    const centerZ = Math.floor(z / 16);

    for (const key in this.chunks) {
      const [cx, cz] = key.split(',').map(Number);

      if (
        Math.abs(cx - centerX) > renderDistance ||
        Math.abs(cz - centerZ) > renderDistance
      ) {
        this.chunks[key].unload();
        delete this.chunks[key];
      }
    }
  }

  getBlock(worldX, worldY, worldZ) {
    const chunkId = `${Math.floor(worldX / 16)},${Math.floor(worldZ / 16)}`;

    if (!this.chunks[chunkId]) {
      console.warn(`Unable to find block, chunk [${chunkId}] does not exist`);
      return -1;
    }

    const currentChunk = this.chunks[chunkId];

    return currentChunk.getBlock(this.toLocal(worldX), this.toLocal(worldY), this.toLocal(worldZ));
  }

  getBlockByLocalCoords(chunkX, chunkZ, x, y, z) { 
    const chunkId = `${chunkX},${chunkZ}`; //Non safe function
    if (!this.chunks[chunkId]) {
      return undefined;
    }
    return this.chunks[chunkId].getBlock(x, y, z);
  }

  getUpperBlockY(worldX, worldZ) {
    const chunkId = `${Math.floor(worldX / 16)},${Math.floor(worldZ / 16)}`;
    const currentChunk = this.chunks[chunkId];

    return currentChunk.getUpperBlockY(this.toLocal(worldX), this.toLocal(worldZ));
  }

  toLocal(coord) {
    return ((coord % 16) + 16) % 16;
  }
}

export default СhunkManager;