import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    // Exchange code for access token
    const tokenResponse = await fetch(
      'https://diauth.garmin.com/di-oauth2-service/oauth/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.GARMIN_CLIENT_ID!,
          client_secret: process.env.GARMIN_CLIENT_SECRET!,
          code,
          code_verifier: codeVerifier,
          redirect_uri: process.env.GARMIN_REDIRECT_URL!,
        }),
      }
    )

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('Garmin token exchange failed:', error)
      return NextResponse.redirect(new URL('/?error=token_exchange_failed', request.url))
    }

    const tokenData = await tokenResponse.json()
    const { access_token, refresh_token } = tokenData

    // Get current user from Supabase
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.redirect(new URL('/?error=not_authenticated', request.url))
    }

    // Update user record with Garmin tokens
    const { error: updateError } = await supabase
      .from('users')
      .update({
        garmin_api_token: access_token,
        garmin_api_refresh_token: refresh_token,
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Error updating user with Garmin tokens:', updateError)
      return NextResponse.redirect(new URL('/?error=token_storage_failed', request.url))
    }

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
