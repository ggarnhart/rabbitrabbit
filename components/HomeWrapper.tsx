'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import RabbitConsultation from '@/components/RabbitConsultation'
import { GarminAuthDialog } from '@/components/GarminAuthDialog'

interface HomeWrapperProps {
  hasGarminAuth: boolean
}

export function HomeWrapper({ hasGarminAuth: initialHasGarminAuth }: HomeWrapperProps) {
  const [showGarminDialog, setShowGarminDialog] = useState(false)
  const [hasGarminAuth, setHasGarminAuth] = useState(initialHasGarminAuth)
  const searchParams = useSearchParams()

  useEffect(() => {
    // Check if user just connected Garmin
    const garminStatus = searchParams.get('garmin')
    if (garminStatus === 'connected') {
      setHasGarminAuth(true)
      // Remove query param from URL
      window.history.replaceState({}, '', '/')
    }

    // Show dialog if user doesn't have Garmin auth
    if (!hasGarminAuth) {
      setShowGarminDialog(true)
    }
  }, [hasGarminAuth, searchParams])

  return (
    <>
      <GarminAuthDialog
        open={showGarminDialog}
        onOpenChange={setShowGarminDialog}
      />
      <RabbitConsultation />
    </>
  )
}
