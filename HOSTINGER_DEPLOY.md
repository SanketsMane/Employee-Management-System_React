# Hostinger Deployment Configuration

This file contains instructions for deploying the frontend to Hostinger.

## Prerequisites
1. Hostinger hosting account with Node.js support
2. File Manager or FTP access
3. Domain configured

## Deployment Steps

1. **Build the project locally:**
   ```bash
   npm run build
   ```

2. **Upload to Hostinger:**
   - Upload all files from `dist/` folder to your domain's `public_html` folder
   - Or upload the entire `dist` folder and point domain to it

3. **Configure domain:**
   - Point your domain to the uploaded files
   - Ensure all static files are accessible

## Files to Upload
- All files from the `dist/` directory after build
- Include: index.html, assets/, favicon, etc.

## Important Notes
- Update VITE_API_BASE_URL in .env.production before building
- Ensure your AWS backend CORS allows your Hostinger domain
- Test all functionality after deployment

## Hostinger Specific Settings
- PHP Version: Not required (static files)
- Node.js: Only needed for build process (done locally)
- SSL: Enable in Hostinger control panel
