# NodeBB Google SSO

NodeBB Plugin that allows users to login/register via their Google account.

## Installation

    npm install nodebb-plugin-sso-google

## Configuration

1. Create a **Google Application** via the [API Console](https://code.google.com/apis/console)
1. Locate your Client ID and Secret
1. Set your "Redirect URI" as the domain you access your NodeBB with `/auth/google/callback` appended to it (e.g. `https://forum.mygreatwebsite.com/auth/google/callback`)