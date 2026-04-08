import * as THREE from 'three';

class Player {
  constructor(camera, canvas, chunkmanager) {
    this.camera = camera;
    this.canvas = canvas;
    this.chunkmanager = chunkmanager;
    this.keys = {};
    this.mousePos = new THREE.Vector2(0, 0);

    this.object = new THREE.Object3D();
    this.pitchObject = new THREE.Object3D();
    this.object.add(this.pitchObject);
    this.pitchObject.add(this.camera);

    this.speed = 3;
    this.rotationSpeed = 0.002;
  }

  start() {
    console.log('Player canvas:', this.canvas);

    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('click', () => {
      this.canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== this.canvas) {
        this.keys = {};
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === this.canvas) {

        this.object.rotation.y -= e.movementX * this.rotationSpeed;

        this.pitchObject.rotation.x -= e.movementY * this.rotationSpeed;
        const maxPitch = Math.PI / 2 - 0.01;
        const minPitch = -Math.PI / 2 + 0.01;
        this.pitchObject.rotation.x = Math.max(minPitch, Math.min(maxPitch, this.pitchObject.rotation.x));
      }
    });
  }

  update(delta) {

    const dir = new THREE.Vector3();
    if (this.keys['KeyW']) dir.z = -1;
    if (this.keys['KeyS']) dir.z = 1;
    if (this.keys['KeyA']) dir.x = -1;
    if (this.keys['KeyD']) dir.x = 1;
    if (this.keys['Space']) {
      if (this.keys['ShiftLeft'] || this.keys['ShiftRight']) dir.y = -1;
      else dir.y = 1;
    }
    if (dir.length() > 0) dir.normalize();

    dir.applyEuler(new THREE.Euler(0, this.object.rotation.y, 0));
    this.object.position.addScaledVector(dir, this.speed * delta);

    const chunkX = Math.floor(this.object.position.x / 16);
    const chunkZ = Math.floor(this.object.position.z / 16);

    if (chunkX !== this.lastChunkX || chunkZ !== this.lastChunkZ) {
      this.lastChunkX = chunkX;
      this.lastChunkZ = chunkZ;

      this.chunkmanager.generateAround(this.object.position.x, this.object.position.z);
    }
  }

  respawn(radius) {
    this.object.position.x = (Math.random() * 2 * radius) - radius;
    this.object.position.z = (Math.random() * 2 * radius) - radius;
    this.object.position.y = this.chunkmanager.getUpperBlockY(Math.floor(this.object.position.x), Math.floor(this.object.position.z)) + 2;

    console.log(`Player spawned on x=${this.object.position.x}, y=${this.object.position.y}, z=${this.object.position.z}`);
  }
}

export default Player;