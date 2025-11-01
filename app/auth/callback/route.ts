import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { GarminClient } from '@/lib/garmin'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    // Validate parameters
    if (!code || !state) {
      return NextResponse.redirect(new URL('/?error=missing_code', request.url))
    }

    // Verify state matches
    const storedState = request.cookies.get('garmin_state')?.value
    if (state !== storedState) {
      return NextResponse.redirect(new URL('/?error=invalid_state', request.url))
    }

    // Get code verifier from cookie
    const codeVerifier = request.cookies.get('garmin_code_verifier')?.value
    if (!codeVerifier) {
      return NextResponse.redirect(new URL('/?error=missing_verifier', request.url))
    }

    // Get current user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.redirect(new URL('/?error=not_authenticated', request.url))
    }

    // Exchange code for access token using GarminClient
    const garminClient = new GarminClient(user.id)
    await garminClient.exchangeCodeForToken(code, codeVerifier)

    // Clear cookies and redirect to home
    const response = NextResponse.redirect(new URL('/?garmin=connected', request.url))
    response.cookies.delete('garmin_code_verifier')
    response.cookies.delete('garmin_state')

    return response
  } catch (error) {
    console.error('Error in Garmin callback:', error)
    return NextResponse.redirect(new URL('/?error=callback_failed', request.url))
  }
}
