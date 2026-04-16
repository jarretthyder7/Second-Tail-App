/**
 * Environment Variable Validation
 * 
 * This module validates that all required environment variables are set
 * at application startup. This helps catch configuration issues early
 * instead of at runtime when they could cause errors or security issues.
 */

const REQUIRED_ENV_VARS = {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: "Supabase project URL",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "Supabase anonymous key for client-side auth",
  SUPABASE_SERVICE_ROLE_KEY: "Supabase service role key for server-side operations",
  
  // Email Configuration
  RESEND_API_KEY: "API key for Resend email service",
  FROM_EMAIL: "Sender email address (should be: noreply@getsecondtail.com)",
}

// Optional vars that have sensible defaults or are only needed in production
const OPTIONAL_ENV_VARS = {
  NEXT_PUBLIC_BASE_URL: "Base URL for the application (defaults to window.location.origin in development)",
}

/**
 * Validates that all required environment variables are set.
 * Called during application startup (in layout.tsx or similar).
 * 
 * @throws {Error} If any required environment variable is missing
 */
export function validateEnvironmentVariables(): void {
  const isProduction = process.env.NODE_ENV === "production"
  const missingVars: string[] = []

  // Check required vars in all environments
  for (const [envVar, description] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[envVar]
    
    if (!value || value.trim() === "") {
      missingVars.push(`${envVar}: ${description}`)
    }
  }

  // Check optional vars only in production
  if (isProduction) {
    for (const [envVar, description] of Object.entries(OPTIONAL_ENV_VARS)) {
      const value = process.env[envVar]
      
      if (!value || value.trim() === "") {
        missingVars.push(`${envVar}: ${description} (required in production)`)
      }
    }
  }

  if (missingVars.length > 0) {
    const errorMessage = `
🚨 MISSING REQUIRED ENVIRONMENT VARIABLES 🚨

The following environment variables must be set in your Vercel project settings:

${missingVars.map((v, i) => `${i + 1}. ${v}`).join("\n")}

Please add these variables to your Vercel environment configuration and redeploy.

For local development, add them to your .env.local file.
See .env.example for the format.
    `.trim()

    throw new Error(errorMessage)
  }
}

/**
 * Validates a specific environment variable exists and is not empty.
 * 
 * @param varName - The name of the environment variable to check
 * @param description - Human-readable description of what this variable is for
 * @returns The value of the environment variable
 * @throws {Error} If the variable is not set or is empty
 */
export function requireEnvVar(varName: string, description: string): string {
  const value = process.env[varName]
  
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${varName}\n` +
      `Description: ${description}\n` +
      `Please set this in your Vercel environment variables or .env.local file.`
    )
  }
  
  return value
}
