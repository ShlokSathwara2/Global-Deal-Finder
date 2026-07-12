'use client'

import { Suspense, lazy, useRef, useCallback } from 'react'
const Spline = lazy(() => import('@splinetool/react-spline'))

interface SplineSceneProps {
  scene: string
  className?: string
  onSplineLoad?: (spline: any) => void
}

export function SplineScene({ scene, className, onSplineLoad }: SplineSceneProps) {
  const splineRef = useRef<any>(null)

  const handleLoad = useCallback((spline: any) => {
    splineRef.current = spline
    onSplineLoad?.(spline)
  }, [onSplineLoad])

  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center">
          <span className="loader"></span>
        </div>
      }
    >
      <Spline
        scene={scene}
        className={className}
        onLoad={handleLoad}
      />
    </Suspense>
  )
}
