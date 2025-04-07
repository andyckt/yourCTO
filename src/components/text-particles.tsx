'use client'

import React, { useRef, useEffect, useState } from 'react'

interface TextParticlesProps {
  text?: string | string[];
  scatteredColor?: string | string[];
  fontSize?: number;
  lineHeight?: number;
}

export default function TextParticles({ 
  text = "Hey", 
  scatteredColor = '#00DCFF',
  fontSize: propFontSize,
  lineHeight = 1.2
}: TextParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })
  const isTouchingRef = useRef(false)
  const [isMobile, setIsMobile] = useState(false)

  // Convert text to array of lines if it's a string
  const textLines = Array.isArray(text) ? text : [text]
  
  // Convert scatteredColor to array of colors if it's a string
  const colorArray = Array.isArray(scatteredColor) ? scatteredColor : Array(textLines.length).fill(scatteredColor)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const updateCanvasSize = () => {
      // Set canvas dimensions to match window size exactly
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      setIsMobile(window.innerWidth < 768) // Set mobile breakpoint
    }

    updateCanvasSize()

    let particles: {
      x: number
      y: number
      baseX: number
      baseY: number
      size: number
      color: string
      scatteredColor: string
      life: number
      lineIndex: number
    }[] = []

    let textImageData: ImageData | null = null
    // Store positions of each line for color assignment
    let linePositions: {startY: number, endY: number}[] = []

    function createTextImage() {
      if (!ctx || !canvas) return 0

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'white'
      ctx.save()
      
      // Calculate appropriate font size based on screen width and height
      const baseFontSize = propFontSize || (isMobile ? 80 : 150)
      // Adjust fontSize to be responsive to screen width
      const screenAdjustment = Math.min(canvas.width / 1000, canvas.height / 800)
      const fontSize = Math.floor(baseFontSize * screenAdjustment)
      
      const fontFamily = 'Arial, sans-serif'
      ctx.font = `bold ${fontSize}px ${fontFamily}`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      
      // Calculate the total height of all lines
      const totalHeight = textLines.length * fontSize * lineHeight
      
      // Center text vertically in the exact middle of the screen
      const startY = canvas.height / 2 - (totalHeight / 2) + (fontSize / 2)
      
      // Clear line positions array
      linePositions = []
      
      // Draw each line of text and record its vertical bounds
      textLines.forEach((line, index) => {
        // Calculate vertical position for each line
        // For 2 lines: first line slightly above center, second line slightly below
        const lineOffset = index - (textLines.length - 1) / 2
        const y = canvas.height / 2 + lineOffset * fontSize * lineHeight
        
        ctx.fillText(line, canvas.width / 2, y)
        
        // Store approximate vertical boundaries for this line
        const halfLineHeight = fontSize / 2
        linePositions.push({
          startY: y - halfLineHeight * lineHeight,
          endY: y + halfLineHeight * lineHeight
        })
      })
      
      ctx.restore()

      textImageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      return fontSize
    }

    function createParticle() {
      if (!ctx || !canvas || !textImageData) return null

      const data = textImageData.data

      for (let attempt = 0; attempt < 100; attempt++) {
        const x = Math.floor(Math.random() * canvas.width)
        const y = Math.floor(Math.random() * canvas.height)

        if (data[(y * canvas.width + x) * 4 + 3] > 128) {
          // Determine which line this particle belongs to
          let lineIndex = 0
          for (let i = 0; i < linePositions.length; i++) {
            if (y >= linePositions[i].startY && y <= linePositions[i].endY) {
              lineIndex = i;
              break;
            }
          }
          
          // Use the corresponding color for this line, fallback to first color
          const particleColor = colorArray[lineIndex] || colorArray[0];
          
          return {
            x: x,
            y: y,
            baseX: x,
            baseY: y,
            size: Math.random() * 2 + 0.5,
            color: 'white', 
            scatteredColor: particleColor, 
            life: Math.random() * 100 + 50,
            lineIndex: lineIndex
          }
        }
      }

      return null
    }

    function createInitialParticles() {
      // Calculate appropriate particle count based on screen size
      const baseParticleCount = 7000
      const particleCount = Math.floor(baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)))
      for (let i = 0; i < particleCount; i++) {
        const particle = createParticle()
        if (particle) particles.push(particle)
      }
    }

    let animationFrameId: number

    function animate() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const { x: mouseX, y: mouseY } = mousePositionRef.current
      const maxDistance = Math.min(canvas.width, canvas.height) * 0.2 // Make distance responsive to screen size

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < maxDistance && (isTouchingRef.current || !('ontouchstart' in window))) {
          const force = (maxDistance - distance) / maxDistance
          const angle = Math.atan2(dy, dx)
          const moveX = Math.cos(angle) * force * 60
          const moveY = Math.sin(angle) * force * 60
          p.x = p.baseX - moveX
          p.y = p.baseY - moveY
          
          ctx.fillStyle = p.scatteredColor
        } else {
          p.x += (p.baseX - p.x) * 0.1
          p.y += (p.baseY - p.y) * 0.1
          ctx.fillStyle = 'white' 
        }

        ctx.fillRect(p.x, p.y, p.size, p.size)

        p.life--
        if (p.life <= 0) {
          const newParticle = createParticle()
          if (newParticle) {
            particles[i] = newParticle
          } else {
            particles.splice(i, 1)
            i--
          }
        }
      }

      const baseParticleCount = 7000
      const targetParticleCount = Math.floor(baseParticleCount * Math.sqrt((canvas.width * canvas.height) / (1920 * 1080)))
      while (particles.length < targetParticleCount) {
        const newParticle = createParticle()
        if (newParticle) particles.push(newParticle)
      }

      animationFrameId = requestAnimationFrame(() => animate())
    }

    createTextImage()
    createInitialParticles()
    animate()

    const handleResize = () => {
      updateCanvasSize()
      createTextImage()
      particles = []
      createInitialParticles()
    }

    const handleMove = (x: number, y: number) => {
      mousePositionRef.current = { x, y }
    }

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        e.preventDefault()
        handleMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    const handleTouchStart = () => {
      isTouchingRef.current = true
    }

    const handleTouchEnd = () => {
      isTouchingRef.current = false
      mousePositionRef.current = { x: 0, y: 0 }
    }

    const handleMouseLeave = () => {
      if (!('ontouchstart' in window)) {
        mousePositionRef.current = { x: 0, y: 0 }
      }
    }

    window.addEventListener('resize', handleResize)
    
    if (canvas) {
      canvas.addEventListener('mousemove', handleMouseMove)
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
      canvas.addEventListener('mouseleave', handleMouseLeave)
      canvas.addEventListener('touchstart', handleTouchStart)
      canvas.addEventListener('touchend', handleTouchEnd)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove)
        canvas.removeEventListener('touchmove', handleTouchMove)
        canvas.removeEventListener('mouseleave', handleMouseLeave)
        canvas.removeEventListener('touchstart', handleTouchStart)
        canvas.removeEventListener('touchend', handleTouchEnd)
      }
      
      cancelAnimationFrame(animationFrameId)
    }
  }, [isMobile, colorArray, textLines, propFontSize, lineHeight])

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full touch-none"
        aria-label={`Interactive particle effect with the text: ${Array.isArray(text) ? text.join(' ') : text}`}
      />
    </div>
  )
} 