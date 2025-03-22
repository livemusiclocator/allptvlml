# AllPTVLML (Public Transport Victoria - Live Music Locator)

A Next.js web application that displays Public Transport Victoria (PTV) route information and integrates with live music gig data. This application is designed to be deployed on GitHub Pages.

## Features

- View all PTV routes by type (train, tram, bus)
- Display stops for each route with proper sequencing
- Show nearby live music gigs for each stop
- View upcoming gigs along your route
- Mobile-friendly responsive design
- Client-side caching for improved performance
- Proper error handling to prevent 404 errors

## Tech Stack

- **Frontend Framework**: Next.js with React
- **Styling**: TailwindCSS for responsive design
- **Language**: TypeScript for type safety
- **API Integration**: 
  - PTV Timetable API v3
  - Live Music Locator API
- **Deployment**: GitHub Pages

## Project Structure

```
allptvlml/
├── components/         # React components
├── lib/                # Utility functions and API clients
├── pages/              # Next.js pages
├── public/             # Static assets
├── styles/             # CSS styles
├── unused_files/       # Original Python implementation (for reference)
└── ...config files     # Various configuration files
```

## Setup

1. Clone the repository:
```bash
git clone https://github.com/livemusiclocator/allptvlml.git
cd allptvlml
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```
NEXT_PUBLIC_PTV_DEV_ID=your_dev_id
PTV_API_KEY=your_api_key
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Deployment

This application is configured for deployment to GitHub Pages:

1. Update the `next.config.js` file with your GitHub username and repository name.

2. Deploy to GitHub Pages:
```bash
npm run deploy
```

This will build the application, export it as static HTML, and push it to the `gh-pages` branch of your repository.

## Mobile Responsiveness

The application is designed to be fully responsive and mobile-friendly:

- Mobile-first CSS approach with TailwindCSS
- Responsive navigation with hamburger menu for small screens
- Touch-friendly UI elements
- Optimized for various screen sizes

## Preventing 404 Errors

The application implements several strategies to prevent 404 errors:

- Client-side routing with Next.js
- Custom 404 page with auto-redirect to home page
- GitHub Pages configuration with SPA fallback
- Error boundaries for graceful error handling

## API Integration

### PTV API

The application integrates with the PTV Timetable API v3 to fetch public transport data:

- Route types (train, tram, bus)
- Routes for each type
- Stops for each route
- Departures from stops

Authentication is handled using HMAC-SHA1 signatures as required by the PTV API.

### Live Music Locator API

The application integrates with the Live Music Locator API to fetch live music gig data:

- Today's gigs in Melbourne
- Gig details including venue, time, and genre
- Calculation of distance between gigs and transport stops

## Contributing

Feel free to submit issues and pull requests.

## License

[MIT License](LICENSE)
