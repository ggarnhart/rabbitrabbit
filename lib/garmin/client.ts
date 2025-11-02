import { createClient } from "@/lib/supabase/server";
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
} from "./pkce";

/**
 * Token response from Garmin OAuth
 */
interface GarminTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
  refresh_token: string;
  scope: string;
  jti: string;
  refresh_token_expires_in: number;
}

/**
 * Stored token data with expiration timestamps
 */
interface TokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
  refreshExpiresAt: number; // Unix timestamp in milliseconds
}

/**
 * User permissions from Garmin API
 */
type GarminPermission =
  | "ACTIVITY_EXPORT"
  | "WORKOUT_IMPORT"
  | "HEALTH_EXPORT"
  | "COURSE_IMPORT"
  | "MCT_EXPORT";

/**
 * GarminClient handles all interactions with Garmin Connect API
 * including OAuth2 PKCE flow, token management, and API calls
 */
export class GarminClient {
  private userId: string;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(userId: string) {
    this.userId = userId;

    // Load from environment variables
    const clientId = process.env.GARMIN_CLIENT_ID;
    const clientSecret = process.env.GARMIN_CLIENT_SECRET;
    const redirectUri = process.env.GARMIN_REDIRECT_URI;

    console.log(clientId, clientSecret, redirectUri);

    if (!clientId || !clientSecret || !redirectUri) {
      throw new Error(
        "Missing Garmin credentials. Please set GARMIN_CLIENT_ID, GARMIN_CLIENT_SECRET, and GARMIN_REDIRECT_URI environment variables."
      );
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  /**
   * Step 1: Generate authorization URL for user to consent
   * Store the codeVerifier and state in your session/database before redirecting
   */
  async generateAuthorizationUrl(): Promise<{
    url: string;
    codeVerifier: string;
    state: string;
  }> {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();

    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.clientId,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      redirect_uri: this.redirectUri,
      state: state,
    });

    const url = `https://connect.garmin.com/oauth2Confirm?${params.toString()}`;

    return {
      url,
      codeVerifier,
      state,
    };
  }

  /**
   * Step 2: Exchange authorization code for access token
   * Call this after user is redirected back with the code
   */
  async exchangeCodeForToken(
    code: string,
    codeVerifier: string
  ): Promise<void> {
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
      code_verifier: codeVerifier,
      redirect_uri: this.redirectUri,
    });

    const response = await fetch(
      "https://diauth.garmin.com/di-oauth2-service/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to exchange code for token: ${errorText}`);
    }

    const data: GarminTokenResponse = await response.json();
    await this.saveTokens(data);
  }

  /**
   * Refresh the access token using the refresh token
   */
  private async refreshAccessToken(): Promise<void> {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("garmin_api_refresh_token")
      .eq("id", this.userId)
      .single();

    if (userError || !userData?.garmin_api_refresh_token) {
      throw new Error("No refresh token found for user");
    }

    const params = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: userData.garmin_api_refresh_token,
    });

    const response = await fetch(
      "https://diauth.garmin.com/di-oauth2-service/oauth/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to refresh token: ${errorText}`);
    }

    const data: GarminTokenResponse = await response.json();
    await this.saveTokens(data);
  }

  /**
   * Save tokens to database with expiration timestamps
   */
  private async saveTokens(tokenResponse: GarminTokenResponse): Promise<void> {
    const supabase = await createClient();

    // Subtract 600 seconds (10 minutes) as recommended by Garmin
    const accessTokenExpiresAt =
      Date.now() + (tokenResponse.expires_in - 600) * 1000;
    const refreshTokenExpiresAt =
      Date.now() + (tokenResponse.refresh_token_expires_in - 600) * 1000;

    const tokenData: TokenData = {
      accessToken: tokenResponse.access_token,
      refreshToken: tokenResponse.refresh_token,
      expiresAt: accessTokenExpiresAt,
      refreshExpiresAt: refreshTokenExpiresAt,
    };

    const { error } = await supabase
      .from("users")
      .update({
        garmin_api_token: JSON.stringify(tokenData),
        garmin_api_refresh_token: tokenResponse.refresh_token,
      })
      .eq("id", this.userId);

    if (error) {
      throw new Error(`Failed to save tokens: ${error.message}`);
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getValidAccessToken(): Promise<string> {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("garmin_api_token, garmin_api_refresh_token")
      .eq("id", this.userId)
      .single();

    if (userError || !userData?.garmin_api_token) {
      throw new Error("User not authenticated with Garmin");
    }

    let tokenData: TokenData;

    // Handle both old format (raw token string) and new format (JSON TokenData)
    try {
      const parsed = JSON.parse(userData.garmin_api_token);

      // Check if it's the new format with TokenData structure
      if (parsed.accessToken && parsed.expiresAt) {
        tokenData = parsed;
      } else {
        await this.refreshAccessToken();

        // Fetch the new token
        const { data: newUserData } = await supabase
          .from("users")
          .select("garmin_api_token")
          .eq("id", this.userId)
          .single();

        if (!newUserData?.garmin_api_token) {
          throw new Error("Failed to get refreshed token");
        }

        tokenData = JSON.parse(newUserData.garmin_api_token);
        return tokenData.accessToken;
      }
    } catch (e) {
      // If parsing fails, it's likely a raw token string (legacy format)
      // Refresh to migrate to new format

      await this.refreshAccessToken();

      // Fetch the new token
      const { data: newUserData } = await supabase
        .from("users")
        .select("garmin_api_token")
        .eq("id", this.userId)
        .single();

      if (!newUserData?.garmin_api_token) {
        throw new Error("Failed to get refreshed token");
      }

      tokenData = JSON.parse(newUserData.garmin_api_token);
      return tokenData.accessToken;
    }

    // Check if access token is expired (with some buffer)
    if (Date.now() >= tokenData.expiresAt) {
      await this.refreshAccessToken();

      // Fetch the new token
      const { data: newUserData } = await supabase
        .from("users")
        .select("garmin_api_token")
        .eq("id", this.userId)
        .single();

      if (!newUserData?.garmin_api_token) {
        throw new Error("Failed to get refreshed token");
      }

      const newTokenData: TokenData = JSON.parse(newUserData.garmin_api_token);
      return newTokenData.accessToken;
    }

    return tokenData.accessToken;
  }

  /**
   * Make an authenticated request to Garmin API
   */
  private async makeAuthenticatedRequest<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const accessToken = await this.getValidAccessToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Garmin API error response:", errorText);
      throw new Error(
        `Garmin API request failed: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    const data = await response.json();

    return data;
  }

  /**
   * Get the Garmin API User ID for this user
   */
  async getUserId(): Promise<string> {
    const data = await this.makeAuthenticatedRequest<{ userId: string }>(
      "https://apis.garmin.com/wellness-api/rest/user/id"
    );
    return data.userId;
  }

  /**
   * Get the permissions granted by the user
   */
  async getPermissions(): Promise<GarminPermission[]> {
    return this.makeAuthenticatedRequest<GarminPermission[]>(
      "https://apis.garmin.com/wellness-api/rest/user/permissions"
    );
  }

  /**
   * Delete user registration (disconnect)
   */
  async deleteRegistration(): Promise<void> {
    await this.makeAuthenticatedRequest(
      "https://apis.garmin.com/wellness-api/rest/user/registration",
      {
        method: "DELETE",
      }
    );

    // Clear tokens from database
    const supabase = await createClient();
    await supabase
      .from("users")
      .update({
        garmin_api_token: null,
        garmin_api_refresh_token: null,
      })
      .eq("id", this.userId);
  }

  // ============================================
  // TRAINING API - Workouts
  // ============================================

  /**
   * Create a new workout in Garmin Connect
   * @param workoutData Workout data in Garmin format (without workoutId)
   * @returns The created workout with assigned workoutId
   */
  async createWorkout(workoutData: any): Promise<any> {
    const response = await this.makeAuthenticatedRequest<any>(
      "https://apis.garmin.com/workoutportal/workout/v2",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "RabbitRabbit/1.0",
        },
        body: JSON.stringify(workoutData),
      }
    );

    // Track the export in your database
    const supabase = await createClient();
    await supabase.from("garmin_exports").insert({
      user_id: this.userId,
      workout_id: response.workoutId,
    });

    return response;
  }

  /**
   * Retrieve a workout by ID
   * @param workoutId The Garmin workout ID
   * @returns The workout data
   */
  async getWorkout(workoutId: number): Promise<any> {
    return this.makeAuthenticatedRequest<any>(
      `https://apis.garmin.com/training-api/workout/v2/${workoutId}`
    );
  }

  /**
   * Update an existing workout
   * @param workoutId The Garmin workout ID
   * @param workoutData Complete updated workout data
   * @returns The updated workout
   */
  async updateWorkout(workoutId: number, workoutData: any): Promise<any> {
    return this.makeAuthenticatedRequest<any>(
      `https://apis.garmin.com/training-api/workout/v2/${workoutId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workoutData),
      }
    );
  }

  /**
   * Delete a workout
   * @param workoutId The Garmin workout ID
   */
  async deleteWorkout(workoutId: number): Promise<void> {
    await this.makeAuthenticatedRequest(
      `https://apis.garmin.com/training-api/workout/v2/${workoutId}`,
      {
        method: "DELETE",
      }
    );
  }

  // ============================================
  // TRAINING API - Workout Schedules
  // ============================================

  /**
   * Schedule a workout for a specific date
   * @param schedule Object with workoutId and date (YYYY-MM-DD)
   * @returns The created schedule
   */
  async createWorkoutSchedule(schedule: {
    workoutId: number;
    date: string;
  }): Promise<any> {
    return this.makeAuthenticatedRequest<any>(
      "https://apis.garmin.com/training-api/schedule/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(schedule),
      }
    );
  }

  /**
   * Retrieve a workout schedule by ID
   * @param scheduleId The schedule ID
   * @returns The schedule data
   */
  async getWorkoutSchedule(scheduleId: number): Promise<any> {
    return this.makeAuthenticatedRequest<any>(
      `https://apis.garmin.com/training-api/schedule/${scheduleId}`
    );
  }

  /**
   * Update a workout schedule
   * @param scheduleId The schedule ID
   * @param schedule Updated schedule data
   * @returns The updated schedule
   */
  async updateWorkoutSchedule(
    scheduleId: number,
    schedule: { workoutId: number; date: string }
  ): Promise<any> {
    return this.makeAuthenticatedRequest<any>(
      `https://apis.garmin.com/training-api/schedule/${scheduleId}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(schedule),
      }
    );
  }

  /**
   * Delete a workout schedule
   * @param scheduleId The schedule ID
   */
  async deleteWorkoutSchedule(scheduleId: number): Promise<void> {
    await this.makeAuthenticatedRequest(
      `https://apis.garmin.com/training-api/schedule/${scheduleId}`,
      {
        method: "DELETE",
      }
    );
  }

  /**
   * Retrieve workout schedules within a date range
   * @param startDate Start date in YYYY-MM-DD format
   * @param endDate End date in YYYY-MM-DD format
   * @returns Array of scheduled workouts
   */
  async getWorkoutSchedulesByDateRange(
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    return this.makeAuthenticatedRequest<any[]>(
      `https://apis.garmin.com/training-api/schedule?startDate=${startDate}&endDate=${endDate}`
    );
  }

  /**
   * Get Training API specific permissions for this user
   * Note: This is different from the wellness API permissions
   * @returns Array of permission strings (e.g., ["WORKOUT_IMPORT"])
   */
  async getTrainingPermissions(): Promise<string[]> {
    return this.makeAuthenticatedRequest<string[]>(
      "https://apis.garmin.com/userPermissions/"
    );
  }

  /**
   * Check if user is authenticated with Garmin
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const supabase = await createClient();
      const { data: userData } = await supabase
        .from("users")
        .select("garmin_api_token")
        .eq("id", this.userId)
        .single();

      return !!userData?.garmin_api_token;
    } catch {
      return false;
    }
  }
}
