import * as THREE from 'three';
import blocksRegistry from './blocks_registry.json';

const loader = new THREE.TextureLoader();

function loadTexture(path) {
  const texture = loader.load(`/textures/${path}`);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  return texture;
}

class BlockRenderer {
  constructor(id) {
    const blockData = blocksRegistry.find(block => block.id === id);

    if (!blockData) {
      throw new Error(`Block with id ${id} not found`);
    }

    if (blockData.texture_type === '3-sided') {
      const side = loadTexture(blockData.textures["side"]);
      const top = loadTexture(blockData.textures["top"]);
      const bottom = loadTexture(blockData.textures["bottom"]);

      this.materials = [
        new THREE.MeshBasicMaterial({ map: side }),
        new THREE.MeshBasicMaterial({ map: side }),
        new THREE.MeshBasicMaterial({ map: top }),
        new THREE.MeshBasicMaterial({ map: bottom }),
        new THREE.MeshBasicMaterial({ map: side }),
        new THREE.MeshBasicMaterial({ map: side }),
      ];
    } else {
      const texture = loadTexture(blockData.texture);

      this.materials = Array(6).fill(
        new THREE.MeshBasicMaterial({ map: texture })
      );
    }
  }

  render(x, y, z) {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      this.materials
    );

    cube.position.set(x, y, z);
    return cube;
  }
}

export default BlockRenderer;