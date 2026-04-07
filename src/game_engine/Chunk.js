import * as THREE from 'three';

const chunkSize = 16;
const chunkHeight = 16;
const stoneLevel = 8;
const airHeight = 16;

const tileSize = 1 / 2;

class Chunk {
  constructor(scene, x, z) {
    this.mesh = null;
    this.scene = scene;
    this.blocks = [];
    this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: false });
  }

  generate() {
    this.blocks = [];

    for (let x = 0; x < chunkSize; x++) {
      const column = [];

      for (let y = 0; y < chunkHeight + airHeight; y++) {
        const row = [];

        for (let z = 0; z < chunkSize; z++) {

          if (y <= stoneLevel) row.push(2);
          else if (y < chunkHeight - 1) row.push(3);
          else if (y === chunkHeight - 1) row.push(1);
          else row.push(0);

        }

        column.push(row);
      }

      this.blocks.push(column);
    }
  }

  render() {
    if (!this.blocks) {
      console.warn(`Cannot find blocks during chunk [${this.x}, ${this.y}] generation`)
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

    for (let x = 0; x < chunkSize; x++) {
      for (let y = 0; y < chunkHeight + airHeight; y++) {
        for (let z = 0; z < chunkSize; z++) {

          const block = this.blocks[x][y][z];
          if (!block) continue;

          for (let face of faces) {
            const nx = x + face.dir[0];
            const ny = y + face.dir[1];
            const nz = z + face.dir[2];

            const neighbour = this.blocks[nx]?.[ny]?.[nz];
            if (neighbour) continue;

            for (const corner of face.corners) {
              vertices.push(
                x + corner[0],
                y + corner[1],
                z + corner[2]
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
    
    const texture = new THREE.TextureLoader().load('/textures/atlas.png');

    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.colorSpace = THREE.SRGBColorSpace;

    this.material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.scene.add(this.mesh);
  }
}

export default Chunk;