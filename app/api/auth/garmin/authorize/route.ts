import { NextRequest, NextResponse } from 'next/server'
import { GarminClient } from '@/lib/garmin'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate authorization URL using GarminClient
    const garminClient = new GarminClient(user.id)
    const { url, codeVerifier, state } = await garminClient.generateAuthorizationUrl()

    // Create response with redirect
    const response = NextResponse.redirect(url)

    // Store verifier and state in cookies (we'll need them in the callback)
    response.cookies.set('garmin_code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    })
    response.cookies.set('garmin_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    })

    return response
  } catch (error) {
    console.error('Error initiating Garmin OAuth:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Garmin authorization' },
      { status: 500 }
    )
  }
}
