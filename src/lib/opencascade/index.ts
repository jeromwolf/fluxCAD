let ocInstance: any = null
let initPromise: Promise<any> | null = null

export interface OpenCascadeInstance {
  oc: any
  ready: boolean
}

declare global {
  interface Window {
    initOpenCascade: any
    opencascade: any
  }
}

export const initializeOpenCascade = async (): Promise<OpenCascadeInstance> => {
  if (ocInstance) {
    return { oc: ocInstance, ready: true }
  }

  if (initPromise) {
    await initPromise
    return { oc: ocInstance, ready: true }
  }

  initPromise = (async () => {
    try {
      // window.opencascade가 로드될 때까지 대기
      let attempts = 0
      while (!window.opencascade && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }
      
      if (!window.opencascade) {
        throw new Error('OpenCascade.js failed to load')
      }
      
      const oc = await window.opencascade({
        locateFile: (file: string) => {
          if (file.endsWith('.wasm')) {
            return '/opencascade.wasm'
          }
          return file
        }
      })
      
      ocInstance = oc
      console.log('OpenCascade.js initialized successfully')
      return oc
    } catch (error) {
      console.error('Failed to initialize OpenCascade:', error)
      throw error
    }
  })()

  await initPromise
  return { oc: ocInstance, ready: true }
}

export const getOpenCascade = () => {
  if (!ocInstance) {
    throw new Error('OpenCascade.js not initialized. Call initializeOpenCascade() first.')
  }
  return ocInstance
}