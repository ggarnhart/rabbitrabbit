'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface GarminAuthDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GarminAuthDialog({ open, onOpenChange }: GarminAuthDialogProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = () => {
    setIsConnecting(true)
    // Redirect to our authorize endpoint which will handle the OAuth flow
    window.location.href = '/api/auth/garmin/authorize'
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Connect to Garmin</DialogTitle>
          <DialogDescription>
            To create and sync workout plans, you need to connect your Garmin account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">What you'll be able to do:</h4>
            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
              <li>Create custom running workouts</li>
              <li>Sync workouts directly to your Garmin device</li>
              <li>Export activities and health data</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-900">
              You'll be redirected to Garmin to authorize this app. You can control what permissions to grant.
            </p>
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition"
            disabled={isConnecting}
          >
            Maybe Later
          </button>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {isConnecting ? 'Connecting...' : 'Connect to Garmin'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
