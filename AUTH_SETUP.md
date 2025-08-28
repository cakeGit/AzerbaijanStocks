# Passport.js OAuth Setup Guide

This guide will help you configure OAuth providers (Google, Discord, GitHub) for your Azerbaijan Stocks application using Passport.js.

## Prerequisites

1. Your backend is already configured with Passport.js
2. You have a `.env` file in the `backend/` directory

## OAuth Provider Setup

### 1. Google OAuth

1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" in the left sidebar
5. Click "Create Credentials" → "OAuth 2.0 Client IDs"
6. Configure the OAuth consent screen if prompted
7. Set the application type to "Web application"
8. Add authorized redirect URIs:
   - `http://localhost:3001/api/auth/google/callback` (for development)
   - `https://yourdomain.com/api/auth/google/callback` (for production)
9. Copy the Client ID and Client Secret

### 2. Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Give your application a name
4. Go to "OAuth2" in the left sidebar
5. Under "Redirects", add:
   - `http://localhost:3001/api/auth/discord/callback` (for development)
   - `https://yourdomain.com/api/auth/discord/callback` (for production)
6. Copy the Client ID and Client Secret

### 3. GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - Application name: Your app name
   - Homepage URL: `http://localhost:3001` (for development) or your production URL
   - Authorization callback URL: `http://localhost:3001/api/auth/github/callback` (for development) or `https://yourdomain.com/api/auth/github/callback` (for production)
4. Click "Register application"
5. Copy the Client ID and Client Secret

## Environment Variables

Update your `backend/.env` file with the OAuth credentials:

```env
# Base URLs
BASE_URL=http://localhost:3001
FRONTEND_URL=http://localhost:3000

# OAuth Control Flag
ALTERNATE_SIGNINS=TRUE  # Set to TRUE to enable OAuth, FALSE to disable

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Discord OAuth
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### ALTERNATE_SIGNINS Flag

The `ALTERNATE_SIGNINS` environment variable controls whether OAuth providers are enabled:

- `TRUE`: OAuth buttons are shown on the login page, OAuth routes are active
- `FALSE`: OAuth buttons are hidden, OAuth routes are disabled (returns 404)

This allows you to easily enable/disable OAuth functionality without code changes.

## How OAuth Works

1. User clicks OAuth provider button on login page
2. User is redirected to provider's authentication page
3. After authentication, provider redirects back to your callback URL
4. Your server creates/updates user in database
5. Server generates JWT token and redirects to frontend with token
6. Frontend stores token and user is logged in

## Testing OAuth

1. Start your backend server
2. Navigate to the login page
3. Click on any OAuth provider button
4. You should be redirected to the provider's login page
5. After authentication, you'll be redirected back to your application with a JWT token

## Troubleshooting

### Common Issues

1. **"Invalid redirect URI"**: Make sure the redirect URIs in your OAuth provider settings match exactly
2. **"Client ID not found"**: Double-check that you've copied the correct Client ID
3. **"Redirect loop"**: Ensure your BASE_URL and FRONTEND_URL are correct

### Debug Tips

- Check browser network tab for failed requests
- Check server console for Passport.js errors
- Verify environment variables are loaded correctly
- Test with different OAuth providers to isolate issues

## Security Notes

- Never commit your `.env` file to version control
- Use different OAuth applications for development and production
- Regularly rotate your OAuth secrets
- Use HTTPS in production
- Validate redirect URIs to prevent open redirect attacks

## Additional OAuth Providers

Passport.js supports many other providers. To add more:

1. Install the provider package: `npm install passport-[provider-name]`
2. Require the strategy in your server.js
3. Configure the strategy with your credentials
4. Add the strategy to passport
5. Add routes for authentication and callback
6. Add provider button to your login page

## API Endpoints

- `GET /api/config` - Get server configuration (including OAuth status)
- `GET /api/auth/google` - Start Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/discord` - Start Discord OAuth
- `GET /api/auth/discord/callback` - Discord OAuth callback
- `GET /api/auth/github` - Start GitHub OAuth
- `GET /api/auth/github/callback` - GitHub OAuth callback
