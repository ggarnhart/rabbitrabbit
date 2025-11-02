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
const trainingPermissions = await garminClient.getTrainingPermissions();

// Create a workout
const workout = await garminClient.createWorkout({
  workoutName: "5K Intervals",
  description: "Speed workout with 400m repeats",
  sport: "RUNNING",
  workoutProvider: "RabbitRabbit",
  workoutSourceId: "unique-id-123",
  segments: [
    {
      segmentOrder: 1,
      sport: "RUNNING",
      steps: [
        // ... workout steps
      ]
    }
  ]
});

// Schedule the workout for tomorrow
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const schedule = await garminClient.createWorkoutSchedule({
  workoutId: workout.workoutId,
  date: tomorrow.toISOString().split('T')[0] // YYYY-MM-DD
});

// Get all schedules for next week
const startDate = new Date().toISOString().split('T')[0];
const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
const schedules = await garminClient.getWorkoutSchedulesByDateRange(startDate, endDate);

// Update a workout
await garminClient.updateWorkout(workout.workoutId, {
  ...workout,
  description: "Updated description"
});

// Delete a workout
await garminClient.deleteWorkout(workout.workoutId);

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

### OAuth & Authentication
- `generateAuthorizationUrl()` - Start OAuth flow
- `exchangeCodeForToken(code, verifier)` - Complete OAuth flow
- `getUserId()` - Get Garmin API user ID
- `getPermissions()` - Get wellness API permissions
- `getTrainingPermissions()` - Get Training API permissions
- `deleteRegistration()` - Disconnect user
- `isAuthenticated()` - Check if user has valid tokens

### Workout Management (Training API)
- `createWorkout(workoutData)` - Create a new workout
- `getWorkout(workoutId)` - Retrieve workout by ID
- `updateWorkout(workoutId, workoutData)` - Update existing workout
- `deleteWorkout(workoutId)` - Delete a workout

### Workout Scheduling (Training API)
- `createWorkoutSchedule({ workoutId, date })` - Schedule workout for a date
- `getWorkoutSchedule(scheduleId)` - Retrieve schedule by ID
- `updateWorkoutSchedule(scheduleId, schedule)` - Update schedule
- `deleteWorkoutSchedule(scheduleId)` - Delete schedule
- `getWorkoutSchedulesByDateRange(startDate, endDate)` - Get schedules in date range

## Notes

- Access tokens expire after 86,400 seconds (24 hours)
- Refresh tokens expire after ~90 days
- The client automatically subtracts 600 seconds (10 minutes) from expiration times as recommended by Garmin
- All tokens are stored in the `users` table as JSON

## Training API Details

### Supported Workout Sports
- **Single Sport**: RUNNING, CYCLING, LAP_SWIMMING, STRENGTH_TRAINING, CARDIO_TRAINING, GENERIC, YOGA, PILATES
- **Multi-Sport**: MULTI_SPORT (with up to 25 segments)

### Limits
- Multi-sport workouts: 25 segments, 250 steps overall
- Single sport workouts: 100 steps max

### Response Codes
- `200/204` - Success
- `400` - Bad Request (invalid workout data)
- `401` - User Access Token doesn't exist
- `403` - Not allowed
- `412` - User Permission error (user hasn't granted WORKOUT_IMPORT permission)
- `429` - Rate limiting (100 requests/min evaluation, 3000 requests/min production)

### Rate Limits
**Evaluation:**
- 100 API calls per partner per minute
- 200 API calls per user per day

**Production:**
- 3000 API calls per partner per minute
- 1000 API calls per user per day
