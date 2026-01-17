'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface AnimatedSphereProps {
  isLoading?: boolean
}

export default function AnimatedSphere({ isLoading = false }: AnimatedSphereProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const size = 400
    canvas.width = size
    canvas.height = size

    let animationFrameId: number
    let time = 0

    const draw = () => {
      time += 0.01
      ctx.clearRect(0, 0, size, size)

      const centerX = size / 2
      const centerY = size / 2
      const baseRadius = size * 0.35

      // Draw multiple layered glows
      const layers = isLoading ? 3 : 5
      
      for (let layer = layers; layer >= 0; layer--) {
        const layerRadius = baseRadius + layer * 20
        const opacity = isLoading 
          ? 0.3 - layer * 0.08 
          : 0.4 - layer * 0.07
        
        // Animated gradient colors
        const hue1 = isLoading ? 185 : 270 + Math.sin(time) * 20
        const hue2 = isLoading ? 185 : 185 + Math.cos(time * 0.7) * 20
        const hue3 = isLoading ? 185 : 30 + Math.sin(time * 0.5) * 20
        const hue4 = isLoading ? 185 : 330 + Math.cos(time * 0.3) * 20

        const gradient = ctx.createRadialGradient(
          centerX + Math.sin(time + layer) * 20,
          centerY + Math.cos(time + layer) * 20,
          0,
          centerX,
          centerY,
          layerRadius
        )

        if (isLoading) {
          gradient.addColorStop(0, `hsla(185, 90%, 60%, ${opacity})`)
          gradient.addColorStop(0.5, `hsla(185, 80%, 50%, ${opacity * 0.5})`)
          gradient.addColorStop(1, 'transparent')
        } else {
          gradient.addColorStop(0, `hsla(${hue1}, 70%, 60%, ${opacity})`)
          gradient.addColorStop(0.3, `hsla(${hue2}, 80%, 50%, ${opacity * 0.8})`)
          gradient.addColorStop(0.6, `hsla(${hue3}, 90%, 55%, ${opacity * 0.5})`)
          gradient.addColorStop(0.8, `hsla(${hue4}, 70%, 50%, ${opacity * 0.3})`)
          gradient.addColorStop(1, 'transparent')
        }

        ctx.beginPath()
        
        // Create organic shape with noise
        const points = 60
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * Math.PI * 2
          const noise = isLoading
            ? Math.sin(angle * 4 + time * 2) * 5
            : Math.sin(angle * 3 + time) * 10 + 
              Math.sin(angle * 5 - time * 0.7) * 5 +
              Math.cos(angle * 2 + time * 1.3) * 8

          const r = layerRadius + noise
          const x = centerX + Math.cos(angle) * r
          const y = centerY + Math.sin(angle) * r

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
        }

        ctx.closePath()
        ctx.fillStyle = gradient
        ctx.fill()
      }

      // Add energy lines / rays (only for active state)
      if (!isLoading) {
        const rayCount = 40
        for (let i = 0; i < rayCount; i++) {
          const angle = (i / rayCount) * Math.PI * 2 + time * 0.2
          const length = 30 + Math.sin(time * 2 + i) * 20
          const startR = baseRadius + 10
          const endR = baseRadius + length + 50

          const startX = centerX + Math.cos(angle) * startR
          const startY = centerY + Math.sin(angle) * startR
          const endX = centerX + Math.cos(angle) * endR
          const endY = centerY + Math.sin(angle) * endR

          const rayGradient = ctx.createLinearGradient(startX, startY, endX, endY)
          const hue = 180 + i * 3 + Math.sin(time) * 30
          rayGradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 0.4)`)
          rayGradient.addColorStop(1, 'transparent')

          ctx.beginPath()
          ctx.moveTo(startX, startY)
          ctx.lineTo(endX, endY)
          ctx.strokeStyle = rayGradient
          ctx.lineWidth = 1 + Math.random() * 2
          ctx.stroke()
        }

        // Add floating particles
        const particleCount = 30
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2 + time * 0.3
          const distance = baseRadius + 60 + Math.sin(time * 2 + i * 0.5) * 40
          const x = centerX + Math.cos(angle + time * 0.1) * distance
          const y = centerY + Math.sin(angle + time * 0.1) * distance
          const particleSize = 1 + Math.sin(time + i) * 1

          const hue = 200 + i * 5
          ctx.beginPath()
          ctx.arc(x, y, particleSize, 0, Math.PI * 2)
          ctx.fillStyle = `hsla(${hue}, 70%, 70%, 0.6)`
          ctx.fill()
        }
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [isLoading])

  return (
    <motion.div
      className="sphere-container"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
    >
      <canvas
        ref={canvasRef}
        className="w-[400px] h-[400px]"
        style={{ filter: 'blur(1px)' }}
      />
      
      {/* Inner glow overlay */}
      <div 
        className="absolute inset-0 rounded-full"
        style={{
          background: isLoading
            ? 'radial-gradient(circle at center, rgba(6, 182, 212, 0.2) 0%, transparent 60%)'
            : 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
          filter: 'blur(20px)',
        }}
      />
    </motion.div>
  )
}
