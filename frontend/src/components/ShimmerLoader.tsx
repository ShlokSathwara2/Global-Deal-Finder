'use client'

import { motion } from 'framer-motion'

interface ShimmerLoaderProps {
  type?: 'card' | 'list' | 'hero'
}

export default function ShimmerLoader({ type = 'card' }: ShimmerLoaderProps) {
  if (type === 'hero') {
    return (
      <div className="space-y-6 py-8">
        {/* Best price cards skeleton */}
        <div className="grid md:grid-cols-2 gap-4">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-xl p-6 relative overflow-hidden" style={{
              background: 'rgba(11,18,32,0.6)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div className="absolute inset-0 shimmer-gradient" />
              <div className="space-y-3">
                <div className="h-4 w-32 mx-auto rounded shimmer-block" />
                <div className="h-10 w-48 mx-auto rounded shimmer-block" />
                <div className="h-3 w-40 mx-auto rounded shimmer-block" />
              </div>
            </div>
          ))}
        </div>

        {/* Timing skeleton */}
        <div className="rounded-xl p-5 relative overflow-hidden" style={{
          background: 'rgba(11,18,32,0.4)',
          border: '1px solid rgba(255,255,255,0.03)',
        }}>
          <div className="absolute inset-0 shimmer-gradient" />
          <div className="flex items-center gap-2 mb-4">
            <div className="h-5 w-5 rounded shimmer-block" />
            <div className="h-5 w-40 rounded shimmer-block" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="rounded-lg p-3 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <div className="absolute inset-0 shimmer-gradient" />
                <div className="space-y-2">
                  <div className="h-3 w-8 rounded shimmer-block" />
                  <div className="h-2 w-16 rounded shimmer-block" />
                  <div className="h-2 w-12 rounded shimmer-block" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Country cards skeleton */}
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl p-5 relative overflow-hidden" style={{
              background: 'rgba(11,18,32,0.4)',
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              <div className="absolute inset-0 shimmer-gradient" />
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full shimmer-block" />
                <div className="space-y-2">
                  <div className="h-4 w-24 rounded shimmer-block" />
                  <div className="h-2 w-16 rounded shimmer-block" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg p-3 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="absolute inset-0 shimmer-gradient" />
                  <div className="space-y-2">
                    <div className="h-2 w-12 rounded shimmer-block" />
                    <div className="h-5 w-20 rounded shimmer-block" />
                    <div className="h-2 w-16 rounded shimmer-block" />
                  </div>
                </div>
                <div className="rounded-lg p-3 relative overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="absolute inset-0 shimmer-gradient" />
                  <div className="space-y-2">
                    <div className="h-2 w-12 rounded shimmer-block" />
                    <div className="h-5 w-20 rounded shimmer-block" />
                    <div className="h-2 w-16 rounded shimmer-block" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 py-4">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-xl p-5 relative overflow-hidden"
          style={{
            background: 'rgba(11,18,32,0.4)',
            border: '1px solid rgba(255,255,255,0.04)',
          }}
        >
          <div className="absolute inset-0 shimmer-gradient" />
          <div className="space-y-3">
            <div className="h-4 w-3/4 rounded shimmer-block" />
            <div className="h-3 w-1/2 rounded shimmer-block" />
            <div className="h-8 w-1/3 rounded shimmer-block" />
          </div>
        </motion.div>
      ))}
    </div>
  )
}
