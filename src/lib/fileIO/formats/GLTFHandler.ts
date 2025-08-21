import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { BaseFormatHandler } from '../core/BaseFormatHandler'
import { FileType, ImportResult, ExportResult, ImportOptions, ExportOptions } from '../types'
import { SceneObject } from '@/types/scene'
import { v4 as uuidv4 } from 'uuid'

export class GLTFHandler extends BaseFormatHandler {
  type = FileType.GLTF
  extensions = ['gltf', 'glb', 'GLTF', 'GLB']
  mimeTypes = ['model/gltf+json', 'model/gltf-binary']
  canImport = true
  canExport = true

  // glTF 가져오기
  protected async doImport(file: File | Blob, options?: ImportOptions): Promise<ImportResult> {
    try {
      const loader = new GLTFLoader()
      const arrayBuffer = await this.readFileAsArrayBuffer(file)
      
      return new Promise((resolve) => {
        loader.parse(arrayBuffer, '', (gltf) => {
          const objects: SceneObject[] = []
          
          // GLTF 씬을 순회하며 메시 추출
          gltf.scene.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              // 지오메트리를 BufferGeometry로 변환
              const geometry = child.geometry.clone()
              
              // 중심 맞추기
              if (options?.center !== false) {
                geometry.center()
              }
              
              // 스케일 적용
              if (options?.scale && options?.scale !== 1) {
                geometry.scale(options.scale, options.scale, options.scale)
              }
              
              // 재질 처리
              const material = child.material instanceof THREE.Material 
                ? child.material.clone()
                : new THREE.MeshStandardMaterial({ color: '#888888' })
              
              // SceneObject 생성
              const object: SceneObject = {
                id: uuidv4(),
                type: 'custom',
                name: child.name || `${(file as File).name?.replace(/\.(gltf|glb)$/i, '') || 'GLTF'}_${objects.length + 1}`,
                position: [child.position.x, child.position.y, child.position.z],
                rotation: [child.rotation.x, child.rotation.y, child.rotation.z],
                scale: [child.scale.x, child.scale.y, child.scale.z],
                color: material instanceof THREE.MeshStandardMaterial 
                  ? `#${material.color.getHexString()}`
                  : '#888888',
                visible: true,
                customGeometry: geometry,
                customMaterial: material
              }
              
              objects.push(object)
            }
          })
          
          if (objects.length === 0) {
            resolve({
              success: false,
              error: 'No meshes found in GLTF file'
            })
            return
          }
          
          resolve({
            success: true,
            objects,
            warnings: gltf.animations?.length > 0 
              ? ['Animations found but not supported'] 
              : undefined
          })
        }, (error) => {
          resolve({
            success: false,
            error: `Failed to parse GLTF: ${error.message}`
          })
        })
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during GLTF import'
      }
    }
  }

  // glTF 내보내기
  protected async doExport(objects: SceneObject[], options?: ExportOptions): Promise<ExportResult> {
    try {
      const exporter = new GLTFExporter()
      const scene = new THREE.Scene()
      
      // 객체들을 씬에 추가
      objects.forEach((obj, index) => {
        let geometry: THREE.BufferGeometry
        let material: THREE.Material
        
        if (obj.customGeometry && obj.customMaterial) {
          geometry = obj.customGeometry
          material = obj.customMaterial
        } else {
          // 기본 프리미티브 생성
          switch (obj.type) {
            case 'box':
              geometry = new THREE.BoxGeometry(2, 2, 2)
              break
            case 'sphere':
              geometry = new THREE.SphereGeometry(1, 32, 32)
              break
            case 'cylinder':
              geometry = new THREE.CylinderGeometry(1, 1, 2, 32)
              break
            case 'cone':
              geometry = new THREE.ConeGeometry(1, 2, 32)
              break
            default:
              geometry = new THREE.BoxGeometry(1, 1, 1)
          }
          
          material = new THREE.MeshStandardMaterial({ 
            color: obj.color,
            name: `${obj.name}_material`
          })
        }
        
        const mesh = new THREE.Mesh(geometry, material)
        mesh.name = obj.name
        mesh.position.set(...obj.position)
        mesh.rotation.set(...obj.rotation)
        mesh.scale.set(...obj.scale)
        
        scene.add(mesh)
      })
      
      return new Promise((resolve) => {
        const exportOptions = {
          binary: options?.binary !== false, // 기본값: GLB (바이너리)
          embedImages: true,
          animations: [],
          onlyVisible: true,
        }
        
        exporter.parse(scene, (result) => {
          try {
            const filename = options?.filename || `fluxcad-export-${Date.now()}.${exportOptions.binary ? 'glb' : 'gltf'}`
            
            if (exportOptions.binary) {
              // GLB (바이너리) 형식
              const blob = new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' })
              this.downloadBlob(blob, filename)
            } else {
              // GLTF (JSON) 형식
              const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'model/gltf+json' })
              this.downloadBlob(blob, filename)
            }
            
            resolve({ success: true })
          } catch (error) {
            resolve({
              success: false,
              error: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            })
          }
        }, (error) => {
          resolve({
            success: false,
            error: `GLTF export failed: ${error.message}`
          })
        }, exportOptions)
      })
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during GLTF export'
      }
    }
  }
}