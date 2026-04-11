import * as THREE from 'three';

const INTERACTION_DISTANCE = 6;
const PLAYER_HITBOX = new THREE.Vector3(0.5, 2, 0.3);


class Player {
  constructor(camera, canvas, scene, chunkmanager) {
    this.camera = camera;
    this.canvas = canvas;
    this.scene = scene;
    this.chunkmanager = chunkmanager;
    this.keys = {};
    this.mousePos = new THREE.Vector2(0, 0);
    this.pointerLocked = false;
    this.placePos = null;
    this.updatePos = null;
    this.selectionPlane = null;
    this.selectionNormal = new THREE.Vector3(0, 0, 0);
    this.isGrounded = true;

    this.object = new THREE.Object3D();
    this.pitchObject = new THREE.Object3D();
    this.object.add(this.pitchObject);
    this.pitchObject.add(this.camera);
    this.pitchObject.position.set(0, -0.4, 0);

    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.gravity = 25;
    this.speed = 2;
    this.jumpSpeed = 8;
    this.rotationSpeed = 0.002;
  }

  start() {
    this.selectionPlane = this.createSelectionPlane();

    document.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
    });

    document.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.canvas.addEventListener('click', (e) => {
      if(!this.pointerLocked) {
        this.canvas.requestPointerLock();
      } else {
        if (e.button == 0 && this.breakPos) {
          this.chunkmanager.setBlock(0, this.breakPos.x, this.breakPos.y, this.breakPos.z);
        }
        else if (e.button == 2 && this.placePos) {
          if (!this.isInsidePlayerBlock(this.placePos)) {
            this.chunkmanager.setBlock(3, this.placePos.x, this.placePos.y, this.placePos.z);
          }
        }
      }
    });

    document.addEventListener('pointerlockchange', () => {
      if (document.pointerLockElement !== this.canvas) {
        this.keys = {};
        this.pointerLocked = false;
      } else {
        this.pointerLocked = true;
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
    if (dir.length() > 0) dir.normalize();

    this.isGrounded = this.checkGround() && this.velocity.y <= 0;

    if (this.keys['Space'] && this.isGrounded) {
      this.velocity.y = this.jumpSpeed;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.velocity.y -= this.gravity * delta;
    }
    
    //update rotation
    dir.applyEuler(new THREE.Euler(0, this.object.rotation.y, 0));
    const move = dir.multiplyScalar(this.speed * delta);
    //update x
    if (this.canGo(new THREE.Vector3(move.x * this.speed, 0, 0))) {
      this.position.x += move.x * this.speed;
    }
    //update y
    this.position.y += this.velocity.y * delta;
    //update z
    if (this.canGo(new THREE.Vector3(0, 0, move.z * this.speed))) {
      this.position.z += move.z * this.speed;
    }
    //update cursor
    this.updateCursorPos();

    this.isGrounded = this.checkGround() && this.velocity.y <= 0;
    if (this.isGrounded && this.velocity.y < 0) {
      this.velocity.y = 0;
      this.position.y = Math.floor(this.position.y) + 1;
    }

    if (this.checkCeil() && this.velocity.y > 0) {
      this.velocity.y = 0;
      this.position.y = Math.floor(this.position.y + PLAYER_HITBOX.y) - PLAYER_HITBOX.y;
    }

    if (!this.isGrounded) console.log(this.position.y);

    this.object.position.set(this.position.x, this.position.y + PLAYER_HITBOX.y, this.position.z);

    //Chunk check
    const chunkX = Math.floor(this.position.x / 16);
    const chunkZ = Math.floor(this.position.z / 16);

    if (chunkX !== this.lastChunkX || chunkZ !== this.lastChunkZ) {
      this.lastChunkX = chunkX;
      this.lastChunkZ = chunkZ;

      this.chunkmanager.generateAround(this.position.x, this.position.z);
    }
  }

  respawn(radius) {
    this.position.x = (Math.random() * 2 * radius) - radius;
    this.position.z = (Math.random() * 2 * radius) - radius;
    this.position.y = this.chunkmanager.getUpperBlockY(Math.floor(this.position.x), Math.floor(this.position.z));

    console.log(`Player spawned on x=${this.position.x}, y=${this.position.y}, z=${this.position.z}`);
  }

  createSelectionPlane() {
    const geometry = new THREE.PlaneGeometry(1.01, 1.01);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
      depthTest: true
    });

    const mesh = new THREE.Mesh(geometry, material);
    this.scene.add(mesh);

    return mesh;
  }

  getSelectedMesh() {
    const origin = this.camera.getWorldPosition(new THREE.Vector3());
    const direction = new THREE.Vector3();

    this.camera.getWorldDirection(direction);

    const raycaster = new THREE.Raycaster(origin, direction, 0.1, INTERACTION_DISTANCE);

    const intersects = raycaster.intersectObjects(this.chunkmanager.chunkMeshes.children, true);

    const hit = intersects.find(i => i.distance > 0);
    return hit;
  }

  updateCursorPos() {
    const hit = this.getSelectedMesh();
    if (!hit) {
      this.selectionPlane.visible = false;
      this.breakPos = null;
      this.placePos = null;
      return;
    }
    this.selectionPlane.visible = true;

    const normal = hit.face.normal.clone();
    this.selectionNormal = normal;

    this.breakPos = hit.point.clone().add(normal.clone().multiplyScalar(-0.01)).floor();
    this.placePos = hit.point.clone().add(normal.clone().multiplyScalar(0.5)).floor();

    const pos = hit.point.clone().add(normal.clone().multiplyScalar(0.01)).floor();
    pos.addScalar(0.5);
    pos.addScaledVector(normal, -0.49);

    this.selectionPlane.position.copy(pos);

    this.selectionPlane.lookAt(pos.clone().add(normal));
  }

  checkGround() {
    const x = this.position.x;
    const y = this.position.y - 0.01;
    const z = this.position.z;

    const offsets = [
      [0, 0],
      [PLAYER_HITBOX.x/2, PLAYER_HITBOX.z/2],
      [-PLAYER_HITBOX.x/2, PLAYER_HITBOX.z/2],
      [PLAYER_HITBOX.x/2, -PLAYER_HITBOX.z/2],
      [-PLAYER_HITBOX.x/2, -PLAYER_HITBOX.z/2],
    ];

    for (let offset of offsets) {
      if (this.chunkmanager.getBlock(Math.floor(x + offset[0]), Math.floor(y), Math.floor(z + offset[1])) !== 0) {
        return true;
      }
    }
    return false;
  }

  checkCeil() {
    const x = this.position.x;
    const y = this.position.y + PLAYER_HITBOX.y;
    const z = this.position.z;

    const offsets = [
      [0, 0],
      [PLAYER_HITBOX.x/2, PLAYER_HITBOX.z/2],
      [-PLAYER_HITBOX.x/2, PLAYER_HITBOX.z/2],
      [PLAYER_HITBOX.x/2, -PLAYER_HITBOX.z/2],
      [-PLAYER_HITBOX.x/2, -PLAYER_HITBOX.z/2],
    ];

    for (let offset of offsets) {
      if (this.chunkmanager.getBlock(Math.floor(x + offset[0]), Math.floor(y), Math.floor(z + offset[1])) !== 0) {
        return true;
      }
    }
    return false;
  }

  canGo(move) {
    const pos = this.position.clone().add(move);

    const x = pos.x;
    const z = pos.z;

    const points = [
      [PLAYER_HITBOX.x/2, PLAYER_HITBOX.z/2],
      [-PLAYER_HITBOX.x/2, PLAYER_HITBOX.z/2],
      [PLAYER_HITBOX.x/2, -PLAYER_HITBOX.z/2],
      [-PLAYER_HITBOX.x/2, -PLAYER_HITBOX.z/2],
    ];

    for (let [dx, dz] of points) {
      if (
        (this.chunkmanager.getBlock(
        Math.floor(x + dx), 
        Math.floor(pos.y), 
        Math.floor(z + dz)
        ) !== 0) ||
        (this.chunkmanager.getBlock(
        Math.floor(x + dx), 
        Math.floor(pos.y + 1), 
        Math.floor(z + dz)
        ) !== 0)) 
      {
        return false;
      }
    }

    return true;
  }

  isInsidePlayerBlock(pos) {
    const minX = this.position.x - PLAYER_HITBOX.x / 2;
    const maxX = this.position.x + PLAYER_HITBOX.x / 2;

    const minY = this.position.y;
    const maxY = this.position.y + PLAYER_HITBOX.y;

    const minZ = this.position.z - PLAYER_HITBOX.z / 2;
    const maxZ = this.position.z + PLAYER_HITBOX.z / 2;

    return (
      pos.x + 1 > minX &&
      pos.x < maxX &&
      pos.y + 1 > minY &&
      pos.y < maxY &&
      pos.z + 1 > minZ &&
      pos.z < maxZ
    );
  }
}

export default Player;