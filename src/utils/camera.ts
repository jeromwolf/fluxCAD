import * as THREE from 'three'

export const cameraPresets = {
  home: {
    position: new THREE.Vector3(10, 10, 10),
    target: new THREE.Vector3(0, 0, 0),
  },
  front: {
    position: new THREE.Vector3(0, 0, 10),
    target: new THREE.Vector3(0, 0, 0),
  },
  back: {
    position: new THREE.Vector3(0, 0, -10),
    target: new THREE.Vector3(0, 0, 0),
  },
  left: {
    position: new THREE.Vector3(-10, 0, 0),
    target: new THREE.Vector3(0, 0, 0),
  },
  right: {
    position: new THREE.Vector3(10, 0, 0),
    target: new THREE.Vector3(0, 0, 0),
  },
  top: {
    position: new THREE.Vector3(0, 10, 0),
    target: new THREE.Vector3(0, 0, 0),
  },
  bottom: {
    position: new THREE.Vector3(0, -10, 0),
    target: new THREE.Vector3(0, 0, 0),
  },
  isometric: {
    position: new THREE.Vector3(10, 10, 10),
    target: new THREE.Vector3(0, 0, 0),
  },
}