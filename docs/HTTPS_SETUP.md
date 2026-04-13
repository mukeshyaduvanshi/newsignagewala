# HTTPS Setup for Development

This project supports HTTPS in development to enable camera access and other secure features.

## Quick Start

1. **Generate SSL Certificates** (one-time setup):

   ```bash
   pnpm setup:ssl
   ```

2. **Start the HTTPS development server**:

   ```bash
   pnpm dev:https
   ```

3. **Access the app**:
   Open your browser and navigate to:
   ```
   https://localhost:3000
   ```

## Trusting the Self-Signed Certificate

Since we're using a self-signed certificate for development, your browser will show a security warning. Here's how to proceed:

### Chrome / Edge / Brave

1. When you see "Your connection is not private", click **Advanced**
2. Click **Proceed to localhost (unsafe)**
3. Or visit `chrome://flags/#allow-insecure-localhost` and enable it

### Firefox

1. Click **Advanced**
2. Click **Accept the Risk and Continue**

### Safari (macOS)

1. Click **Show Details**
2. Click **visit this website**
3. Or add the certificate to Keychain:
   - Open **Keychain Access** app
   - Drag `certificates/localhost.crt` into **System** keychain
   - Double-click the certificate
   - Expand **Trust** section
   - Set "When using this certificate" to **Always Trust**

## Available Scripts

- `pnpm dev` - Start regular HTTP development server (default Next.js)
- `pnpm dev:https` - Start HTTPS development server
- `pnpm setup:ssl` - Generate/regenerate SSL certificates

## Why HTTPS in Development?

Modern browsers require HTTPS to access certain features:

- 📷 Camera access (MediaDevices API)
- 🎤 Microphone access
- 📍 Geolocation (in some contexts)
- 🔔 Push notifications
- 💾 Service Workers
- 📱 PWA features

## Testing on Mobile Devices

To test on mobile devices with HTTPS:

1. Find your computer's local IP:

   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1

   # Windows
   ipconfig
   ```

2. Update `server.js` to bind to `0.0.0.0` instead of `localhost`:

   ```js
   const hostname = "0.0.0.0";
   ```

3. Generate a certificate for your IP or use a service like [ngrok](https://ngrok.com/)

4. Access from mobile: `https://YOUR_IP:3000`

## Troubleshooting

**Issue**: Browser still shows security warning after trusting certificate

- **Solution**: Clear browser cache and restart the browser

**Issue**: Certificate expired

- **Solution**: Run `pnpm setup:ssl` to generate a new certificate (valid for 365 days)

**Issue**: Port 3000 already in use

- **Solution**: Change the port in `server.js`

## Production

⚠️ **Never use self-signed certificates in production!**

For production, use proper SSL certificates from:

- [Let's Encrypt](https://letsencrypt.org/) (free)
- [Cloudflare](https://www.cloudflare.com/) (free SSL)
- Your hosting provider's SSL certificate

## Files

- `server.js` - Custom HTTPS server
- `scripts/generate-ssl-cert.js` - Certificate generation script
- `certificates/` - SSL certificates directory (git-ignored)
