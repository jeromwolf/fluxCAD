import React, { useEffect, useState } from 'react'
// import { initializeOpenCascade } from '@/lib/opencascade'

interface OpenCascadeLoaderProps {
  children: React.ReactNode
}

export default function OpenCascadeLoader({ children }: OpenCascadeLoaderProps) {
  const [isLoading, setIsLoading] = useState(false) // 임시로 false로 변경
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // 임시로 OpenCascade 로딩을 비활성화
    // const loadOpenCascade = async () => {
    //   try {
    //     setProgress(10)
    //     await initializeOpenCascade()
    //     setProgress(100)
    //     setIsLoading(false)
    //   } catch (err) {
    //     console.error('Failed to load OpenCascade:', err)
    //     setError('OpenCascade.js 로딩 실패')
    //     setIsLoading(false)
    //   }
    // }

    // loadOpenCascade()
  }, [])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            CAD 엔진 로딩 중...
          </h2>
          <p className="text-gray-500 text-sm">
            OpenCascade.js WASM 모듈을 불러오고 있습니다
          </p>
          <div className="mt-4 w-64 mx-auto">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-red-600 mb-2">
            로딩 오류
          </h2>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            새로고침
          </button>
        </div>
      </div>
    )
  }

  return <>{children}</>
}