import { NextRequest, NextResponse } from 'next/server'
import { generateCodeVerifier, generateCodeChallenge, generateState } from '@/lib/garmin/pkce'

export async function GET(request: NextRequest) {
  try {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)
    const state = generateState()

    // Build authorization URL
    const authUrl = new URL('https://connect.garmin.com/oauth2Confirm')
    authUrl.searchParams.append('response_type', 'code')
    authUrl.searchParams.append('client_id', process.env.GARMIN_CLIENT_ID!)
    authUrl.searchParams.append('code_challenge', codeChallenge)
    authUrl.searchParams.append('code_challenge_method', 'S256')
    authUrl.searchParams.append('redirect_uri', process.env.GARMIN_REDIRECT_URL!)
    authUrl.searchParams.append('state', state)

    // Create response with redirect
    const response = NextResponse.redirect(authUrl.toString())

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
