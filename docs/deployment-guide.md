# Deployment Guide

This guide explains how to deploy the PTV-LML application to GitHub Pages.

## Prerequisites

Before deploying, ensure you have:

1. A GitHub account
2. Git installed on your local machine
3. Node.js and npm installed
4. The PTV-LML repository cloned to your local machine

## Setup GitHub Repository

1. Create a new repository on GitHub named `ptv-lml`
2. Initialize your local repository and connect it to GitHub:

```bash
cd ptv-lml
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/ptv-lml.git
git push -u origin main
```

Replace `yourusername` with your actual GitHub username.

## Configure for GitHub Pages

The repository is already configured for GitHub Pages deployment with:

1. A `next.config.js` file that includes:
   - `assetPrefix` and `basePath` settings for the GitHub Pages URL
   - `trailingSlash: true` for proper static file paths
   - `output: 'export'` for static HTML generation

2. A custom `404.html` page in the `public` directory that redirects to the home page
3. A `.nojekyll` file in the `public` directory to disable Jekyll processing

## Update Configuration

Before deploying, update the `next.config.js` file with your GitHub username:

```javascript
const nextConfig = {
  // ...
  assetPrefix: process.env.NODE_ENV === 'production' ? '/ptv-lml' : '',
  basePath: process.env.NODE_ENV === 'production' ? '/ptv-lml' : '',
  // ...
}
```

## Deploy Using the Script

The easiest way to deploy is using the provided deployment script:

1. Make sure the `gh-pages` package is installed:
```bash
npm install --save-dev gh-pages
```

2. Run the deployment script:
```bash
./deploy.sh
```

This script will:
- Build the application
- Export it as static HTML
- Create a `.nojekyll` file in the output directory
- Deploy the contents to the `gh-pages` branch of your repository

## Manual Deployment

If you prefer to deploy manually:

1. Build and export the application:
```bash
npm run build
npm run export
```

2. Create a `.nojekyll` file in the output directory:
```bash
touch out/.nojekyll
```

3. Deploy to GitHub Pages:
```bash
npx gh-pages -d out
```

## Configure GitHub Pages Settings

After deploying:

1. Go to your repository on GitHub
2. Navigate to Settings > Pages
3. Ensure the source is set to the `gh-pages` branch
4. Check the "Enforce HTTPS" option
5. Click "Save"

Your application should now be available at `https://yourusername.github.io/ptv-lml/`.

## Troubleshooting

### 404 Errors on Routes

If you're experiencing 404 errors when navigating to routes directly:

1. Ensure the `next.config.js` file has the correct `assetPrefix` and `basePath`
2. Check that `trailingSlash: true` is set in the configuration
3. Verify that the custom `404.html` file is in the `public` directory
4. Make sure the `.nojekyll` file is present in the root of the deployed site

### Assets Not Loading

If assets (CSS, JavaScript, images) are not loading:

1. Check the browser console for path errors
2. Ensure all asset paths use relative URLs
3. Verify that `assetPrefix` is correctly set in `next.config.js`

### Deployment Fails

If deployment fails:

1. Check that you have the correct permissions for the repository
2. Ensure the `gh-pages` package is installed
3. Verify that the build and export steps complete successfully
4. Check for any error messages in the deployment output
