import * as THREE from 'three';

const chunkSize = 16;
const chunkHeight = 100;
const stoneLevel = 92;
const airHeight = 16;

const tileSize = 1 / 2;

class Chunk {
  constructor(scene, x, z, chunkManager) {
    this.mesh = null;
    this.scene = scene;
    this.blocks = [];
    this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: false });
    this.x = x;
    this.z = z;
    this.loaded = false;
    this.chunkManager = chunkManager;

    this.texture = new THREE.TextureLoader().load('/textures/atlas.png');
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    this.texture.colorSpace = THREE.SRGBColorSpace;
  }

  generate() {
    this.blocks = [];

    for (let lx = 0; lx < chunkSize; lx++) {
      const column = [];

      for (let ly = 0; ly < chunkHeight + airHeight; ly++) {
        const row = [];

        for (let lz = 0; lz < chunkSize; lz++) {

          if (ly <= stoneLevel) row.push(2);
          else if (ly < chunkHeight - 1) row.push(3);
          else if (ly === chunkHeight - 1) row.push(1);
          else row.push(0);

        }

        column.push(row);
      }

      this.blocks.push(column);
    }
  }

  render() {
    if (!this.blocks) {
      console.warn(`Cannot find blocks during chunk [${this.x},${this.y}] generation`)
    }

    if (this.mesh != null) {
      this.scene.remove(this.mesh);
    }

    const vertices = [];
    const indices = [];
    const uvs = [];
    let indexOffset = 0;

    const faces = [
      { name:"right", dir: [1, 0, 0], corners: [[1,0,0],[1,1,0],[1,1,1],[1,0,1]] },
      { name:"left", dir: [-1,0,0], corners: [[0,0,1],[0,1,1],[0,1,0],[0,0,0]] }, 
      { name:"top", dir: [0,1,0], corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] }, 
      { name:"bottom", dir: [0,-1,0], corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] }, 
      { name:"front", dir: [0,0,1], corners: [[1,0,1],[1,1,1],[0,1,1],[0,0,1]] }, 
      { name:"back", dir: [0,0,-1], corners: [[0,0,0],[0,1,0],[1,1,0],[1,0,0]] },
    ];

    function getUV(tileX, tileY) {
      const u = tileX * tileSize;
      const v = tileY * tileSize;

      return [
        u + tileSize, v,
        u + tileSize, v + tileSize,
        u, v + tileSize,
        u, v
      ];
    }

    function getBlockUV(blockId, face) {
      if (blockId === 1) { // grass
        if (face === 'top') return getUV(1, 1);
        if (face === 'bottom') return getUV(0, 1);
        return getUV(0, 0); // side
      }

      if (blockId === 2) return getUV(1, 0); // stone
      if (blockId === 3) return getUV(0, 1); // dirt
    }

    for (let lx = 0; lx < chunkSize; lx++) {
      for (let ly = 0; ly < chunkHeight + airHeight; ly++) {
        for (let lz = 0; lz < chunkSize; lz++) {

          const block = this.blocks[lx][ly][lz];
          if (!block) continue;

          for (let face of faces) {
            const nx = lx + face.dir[0];
            const ny = ly + face.dir[1];
            const nz = lz + face.dir[2];

            let neighbour;

            if (nx < 0) {
              neighbour = this.chunkManager.getBlockByLocalCoords(this.x - 1, this.z, chunkSize - 1, ny, nz);
            } else if (nx >= chunkSize) {
              neighbour = this.chunkManager.getBlockByLocalCoords(this.x + 1, this.z, 0, ny, nz);
            } else if (nz < 0) {
              neighbour = this.chunkManager.getBlockByLocalCoords(this.x, this.z - 1, nx, ny, chunkSize - 1);
            } else if (nz >= chunkSize) {
              neighbour = this.chunkManager.getBlockByLocalCoords(this.x, this.z + 1, nx, ny, 0);
            } else {
              neighbour = this.blocks[nx]?.[ny]?.[nz];
            }

            if (neighbour !== 0 && neighbour !== undefined) continue;

            for (const corner of face.corners) {
              vertices.push(
                this.x * chunkSize + lx + corner[0],
                ly + corner[1],
                this.z * chunkSize + lz + corner[2]
              );
            }

            const faceName = face.name;
            const uv = getBlockUV(block, faceName);

            uvs.push(...uv);

            indices.push(
              indexOffset, indexOffset+1, indexOffset+2,
              indexOffset, indexOffset+2, indexOffset+3
            );

            indexOffset += 4;
          }
        }
      }

      this.loaded = true;
    }

    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(vertices, 3)
    );

    geometry.setAttribute(
      'uv',
      new THREE.Float32BufferAttribute(uvs, 2)
    );

    geometry.setIndex(indices);
    geometry.computeVertexNormals();

    this.material = new THREE.MeshBasicMaterial({ map: this.texture, side: THREE.DoubleSide });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
  }

  unload() {
    this.scene.remove(this.mesh);
    this.loaded = false;
  }

  isLoaded() {
    return this.loaded;
  }

  getBlock(localX, localY, localZ) {
    if ((localX < 0) || (localX >= this.blocks.length) || (localY < 0) || (localY >= this.blocks[0].length) || (localZ < 0) || (localZ >= this.blocks[0][0].length)) {
      console.warn(`Local coords x=${localX}, y=${localY}, z=${localZ} are out of boundary`)
      return -1;
    }
    return this.blocks[localX][localY][localZ];
  }

  setBlock(block, localX, localY, localZ) {
    if ((localX < 0) || (localX >= this.blocks.length) || (localY < 0) || (localY >= this.blocks[0].length) || (localZ < 0) || (localZ >= this.blocks[0][0].length)) {
      console.warn(`Local coords x=${localX}, y=${localY}, z=${localZ} are out of boundary`)
      return 0;
    }
    this.blocks[localX][localY][localZ] = block;
    return 1;
  }

  getUpperBlockY(localX, localZ) {
    if ((localX < 0) || (localX >= this.blocks.length) || (localZ < 0) || (localZ >= this.blocks[0][0].length)) {
      console.warn(`Local coords x=${localX}, z=${localZ} are out of boundary`)
      return 0;
    }

    for(let i = this.blocks[0].length - 1; i >= 0; i--) {
      if (this.blocks[localX][i][localZ] != 0) {
        return i + 1;
      }
    }

    return -1;
  }
}

export default Chunk;