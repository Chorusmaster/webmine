import * as THREE from 'three';
import Player from './Player.js';
import BlockRenderer from './blocks/BlockRenderer.js';
import Generator from './Generator.js';

class Game {
  constructor(canvas) {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas });
    this.cube = null;
    this.scripts = [];
    this.lastTime = 0;
  }

  add(script) {
    this.scripts.push(script);
  }

  start() {
    console.log('Game started');
    
    // World generation
    const generator = new Generator(this.scene);
    generator.generateChunk(0, 0);

    // Player setup
    const player = new Player(this.camera, this.canvas);
    this.add(player);
    this.scene.add(player.object);
    player.start();

    window.addEventListener('resize', () => this.onResize(), false);
    this.onResize();

    requestAnimationFrame(() => this.animate(0));
  }
  
  animate(time) {
    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.renderer.render( this.scene, this.camera );

    this.scripts.forEach(obj => obj.update(delta));
    requestAnimationFrame((t) => this.animate(t));
  }

  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.renderer.setSize(width, height);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}

export default Game;