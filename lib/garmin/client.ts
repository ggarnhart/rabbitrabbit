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
      .select("garmin_api_token")
      .eq("id", this.userId)
      .single();

    if (userError || !userData?.garmin_api_token) {
      throw new Error("User not authenticated with Garmin");
    }

    const tokenData: TokenData = JSON.parse(userData.garmin_api_token);

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
      throw new Error(
        `Garmin API request failed: ${response.status} ${errorText}`
      );
    }

    return response.json();
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

  // /**
  //  * Import a workout to Garmin Connect
  //  * You'll need to implement this based on Garmin's workout import API
  //  */
  // async importWorkout(workoutData: any): Promise<void> {
  //   // TODO: Implement workout import
  //   // The exact endpoint and payload format will depend on Garmin's workout import API
  //   // which should be documented in their developer documentation

  //   const response = await this.makeAuthenticatedRequest(
  //     "https://apis.garmin.com/wellness-api/rest/workout/import",
  //     {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(workoutData),
  //     }
  //   );

  //   // Track the export in your database
  //   const supabase = await createClient();
  //   await supabase.from("garmin_exports").insert({
  //     user_id: this.userId,
  //     workout_id: workoutData.id,
  //   });

  //   return response;
  // }

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
