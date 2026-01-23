'use client'

import { useEffect, useState } from 'react'

export default function MobileBlocker() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Check on mount
    checkMobile()

    // Check on resize
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (!isMobile) return null

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center p-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Sorry, Quizme is not currently available on mobile.
        </h1>
        <p className="text-gray-600">
          Please visit us on a desktop or tablet device.
        </p>
      </div>
    </div>
  )
}
