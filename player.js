import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.124/build/three.module.js';
import { FBXLoader } from 'https://cdn.jsdelivr.net/npm/three@0.124/examples/jsm/loaders/FBXLoader.js';

export const player = (() => {
  class Player {
    constructor(params) {
      this.position_ = new THREE.Vector3(0, 0, 0);
      this.velocity_ = 0.0;
      this.playerBox_ = new THREE.Box3();
      this.params_ = params;

      // Inicializar las interacciones del usuario
      this.InitInput_();

      // Crear la interfaz de selección de dinosaurios
      this.createDinosaurSelection();

      // Agregar música al juego
      this.initAudio_();
    }

    // Método para inicializar el audio
    initAudio_() {
      // Crear un elemento de audio HTML
      this.audioElement_ = new Audio('./resources/audio/background_music.mp3');
      this.audioElement_.loop = true; // Repetir la música
      this.audioElement_.volume = 0.5; // Volumen de la música (0 a 1)

      // Reproducir la música
      this.audioElement_.play().catch(function(error) {
        console.log("Error al reproducir música:", error);
      });
    }

    // Método para crear la interfaz de selección de dinosaurios
    createDinosaurSelection() {
      const selectionContainer = document.createElement('div');
      selectionContainer.style.position = 'absolute';
      selectionContainer.style.top = '20px';
      selectionContainer.style.left = '20px';
      selectionContainer.style.zIndex = '1000';
      selectionContainer.style.display = 'flex';
      selectionContainer.style.flexDirection = 'row';
      selectionContainer.style.gap = '10px';

      const dinosaurs = ['Velociraptor', 'Trex', 'Triceratops', 'Stegosaurus', 'Parasaurolophus', 'Apatosaurus'];
      dinosaurs.forEach(dino => {
        const button = document.createElement('button');
        button.textContent = dino;
        button.style.padding = '10px';
        button.addEventListener('click', () => {
          this.LoadModel_(dino + '.fbx'); // Cargar el modelo del dinosaurio seleccionado
          selectionContainer.remove(); // Ocultar la interfaz de selección después de elegir
        });
        selectionContainer.appendChild(button);
      });

      document.body.appendChild(selectionContainer);
    }

    // Método para cargar el modelo del dinosaurio
    LoadModel_(modelName) {
      const loader = new FBXLoader();
      loader.setPath('./resources/Dinosaurs/FBX/');
      loader.load(modelName, (fbx) => {
        fbx.scale.setScalar(0.0010);
        fbx.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);

        if (this.mesh_) {
          this.params_.scene.remove(this.mesh_);
        }

        this.mesh_ = fbx;
        this.params_.scene.add(this.mesh_);

        fbx.traverse(c => {
          let materials = c.material;
          if (!(c.material instanceof Array)) {
            materials = [c.material];
          }
  
          for (let m of materials) {
            if (m) {
              m.specular = new THREE.Color(0x000000);
              m.color.offsetHSL(0, 0, 0.25);
            }
          }    
          c.castShadow = true;
          c.receiveShadow = true;
        });

        const m = new THREE.AnimationMixer(fbx);
        this.mixer_ = m;

        for (let i = 0; i < fbx.animations.length; ++i) {
          if (fbx.animations[i].name.includes('Run')) {
            const clip = fbx.animations[i];
            const action = this.mixer_.clipAction(clip);
            action.play();
          }
        }
      });
    }

    // Inicializar las interacciones del usuario
    InitInput_() {
      this.keys_ = {
          spacebar: false,
      };
      this.oldKeys = {...this.keys_};

      document.addEventListener('keydown', (e) => this.OnKeyDown_(e), false);
      document.addEventListener('keyup', (e) => this.OnKeyUp_(e), false);
    }

    // Evento al presionar una tecla
    OnKeyDown_(event) {
      switch(event.keyCode) {
        case 32:
          this.keys_.space = true;
          break;
      }
    }

    // Evento al soltar una tecla
    OnKeyUp_(event) {
      switch(event.keyCode) {
        case 32:
          this.keys_.space = false;
          break;
      }
    }

    // Verificar colisiones
    CheckCollisions_() {
      const colliders = this.params_.world.GetColliders();

      this.playerBox_.setFromObject(this.mesh_);

      for (let c of colliders) {
        const cur = c.collider;

        if (cur.intersectsBox(this.playerBox_)) {
          this.gameOver = true;
        }
      }
    }

    // Actualizar la posición y animaciones
    Update(timeElapsed) {
      if (this.keys_.space && this.position_.y == 0.0) {
        this.velocity_ = 30;
      }

      const acceleration = -75 * timeElapsed;

      this.position_.y += timeElapsed * (this.velocity_ + acceleration * 0.5);
      this.position_.y = Math.max(this.position_.y, 0.0);

      this.velocity_ += acceleration;
      this.velocity_ = Math.max(this.velocity_, -100);

      if (this.mesh_) {
        this.mixer_.update(timeElapsed);
        this.mesh_.position.copy(this.position_);
        this.CheckCollisions_();
      }
    }
  };

  return {
      Player: Player,
  };
})();


