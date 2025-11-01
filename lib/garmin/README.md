# Garmin Connect Integration

This directory contains the Garmin Connect API client implementation using OAuth2 PKCE.

## Setup

1. Add environment variables to `.env.local`:

```env
GARMIN_CLIENT_ID=your_client_id_here
GARMIN_CLIENT_SECRET=your_client_secret_here
GARMIN_REDIRECT_URI=https://yourdomain.com/api/auth/garmin/callback
```

2. The database already has the required fields in the `users` table:
   - `garmin_api_token` (stores TokenData as JSON)
   - `garmin_api_refresh_token` (stores the current refresh token)

## Usage

### 1. Connect User to Garmin (OAuth Flow)

Create an API route to initiate the OAuth flow:

```typescript
// app/api/auth/garmin/connect/route.ts
import { GarminClient } from "@/lib/garmin";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const garminClient = new GarminClient(user.id);
  const { url, codeVerifier, state } = await garminClient.generateAuthorizationUrl();

  // Store codeVerifier and state in session or database (you'll need them for the callback)
  // For example, in a cookies or session store:
  // cookies().set("garmin_code_verifier", codeVerifier);
  // cookies().set("garmin_state", state);

  return Response.redirect(url);
}
```

### 2. Handle OAuth Callback

Create an API route to handle the redirect back from Garmin:

```typescript
// app/api/auth/garmin/callback/route.ts
import { GarminClient } from "@/lib/garmin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Retrieve stored codeVerifier and state from session/cookies
  // const storedCodeVerifier = cookies().get("garmin_code_verifier")?.value;
  // const storedState = cookies().get("garmin_state")?.value;

  // Validate state matches
  // if (state !== storedState) {
  //   return new Response("Invalid state", { status: 400 });
  // }

  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const garminClient = new GarminClient(user.id);

  // Exchange code for tokens (this automatically saves them to the database)
  await garminClient.exchangeCodeForToken(code, storedCodeVerifier);

  // Redirect to success page
  return Response.redirect("/settings?garmin=connected");
}
```

### 3. Use in Your Application

Once connected, you can use the client anywhere:

```typescript
import { GarminClient } from "@/lib/garmin";

// Create client instance
const garminClient = new GarminClient(userId);

// Check if authenticated
const isConnected = await garminClient.isAuthenticated();

// Get user's Garmin API ID
const garminUserId = await garminClient.getUserId();

// Get permissions
const permissions = await garminClient.getPermissions();

// Import a workout
await garminClient.importWorkout(workoutData);

// Disconnect user
await garminClient.deleteRegistration();
```

## How It Works

### Token Management

The client automatically handles token refresh. When you make any API call:

1. It checks if the access token is expired
2. If expired, it automatically refreshes using the refresh token
3. The new tokens are saved to the database
4. Your API call proceeds with the fresh token

You don't need to manually handle token expiration!

### OAuth2 PKCE Flow

1. **Generate authorization URL** - Creates code verifier/challenge
2. **User grants permission** - Redirects to Garmin, user approves
3. **Exchange code for tokens** - Your callback receives code, exchanges for tokens
4. **Tokens saved to database** - Access and refresh tokens stored automatically

## API Methods

- `generateAuthorizationUrl()` - Start OAuth flow
- `exchangeCodeForToken(code, verifier)` - Complete OAuth flow
- `getUserId()` - Get Garmin API user ID
- `getPermissions()` - Get user's granted permissions
- `importWorkout(data)` - Import workout to Garmin Connect
- `deleteRegistration()` - Disconnect user
- `isAuthenticated()` - Check if user has valid tokens

## Notes

- Access tokens expire after 86,400 seconds (24 hours)
- Refresh tokens expire after ~90 days
- The client automatically subtracts 600 seconds (10 minutes) from expiration times as recommended by Garmin
- All tokens are stored in the `users` table as JSON
