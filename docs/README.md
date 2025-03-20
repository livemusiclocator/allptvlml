# PTV-LML Documentation

Welcome to the PTV-LML documentation. This directory contains comprehensive documentation for the PTV-LML (Public Transport Victoria - Live Music Locator) application.

## Documentation Index

### Getting Started
- [README.md](../README.md) - Project overview and quick start guide

### Development Guides
- [API Integration](./api-integration.md) - How the application integrates with PTV and Live Music Locator APIs
- [Mobile Responsiveness](./mobile-responsiveness.md) - Guidelines for maintaining mobile-friendly design

### Deployment
- [Deployment Guide](./deployment-guide.md) - Instructions for deploying to GitHub Pages

## Project Structure

The PTV-LML project follows this structure:

```
ptv-lml/
├── components/         # React components
│   ├── Footer.tsx      # Site footer component
│   ├── Header.tsx      # Navigation header component
│   ├── Layout.tsx      # Main layout wrapper
│   └── RouteTypeCard.tsx # Card component for route types
├── docs/               # Documentation files
├── lib/                # Utility functions and API clients
│   ├── lml-api.ts      # Live Music Locator API integration
│   └── ptv-api.ts      # PTV API integration with authentication
├── pages/              # Next.js pages
│   ├── _app.tsx        # Custom App component
│   ├── 404.tsx         # Custom 404 page
│   ├── about.tsx       # About page
│   ├── allgigs.tsx     # All live music events page
│   ├── index.tsx       # Home page
│   └── routes/         # Route-related pages
│       ├── [typeId].tsx           # Route type page (trains, trams, etc.)
│       └── [typeId]/[routeId].tsx # Specific route page with stops
├── public/             # Static assets
│   ├── .nojekyll       # Disables Jekyll processing on GitHub Pages
│   ├── 404.html        # Static 404 page for GitHub Pages
│   └── favicon.ico     # Site favicon
├── styles/             # CSS styles
│   └── globals.css     # Global styles with Tailwind imports
├── .env.local          # Environment variables (not in repository)
├── .gitignore          # Git ignore file
├── deploy.sh           # Deployment script for GitHub Pages
├── LICENSE             # MIT License
├── next.config.js      # Next.js configuration
├── package.json        # NPM dependencies and scripts
├── postcss.config.js   # PostCSS configuration for Tailwind
├── README.md           # Project overview
├── setup.sh            # Setup script for local development
├── tailwind.config.js  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## Key Technologies

PTV-LML is built with:

- **Next.js** - React framework for server-rendered or statically-exported React applications
- **TypeScript** - Typed JavaScript for better developer experience and code quality
- **TailwindCSS** - Utility-first CSS framework for rapid UI development
- **SWR** - React Hooks library for data fetching with caching and revalidation
- **Axios** - Promise-based HTTP client for API requests

## Contributing

When contributing to the project:

1. Read the relevant documentation before making changes
2. Follow the established code style and patterns
3. Test your changes thoroughly, especially on mobile devices
4. Update documentation when adding new features or changing existing ones

## Need Help?

If you need additional information not covered in the documentation:

1. Check the code comments for specific implementation details
2. Look at the API documentation for [PTV Timetable API](https://www.ptv.vic.gov.au/footer/data-and-reporting/datasets/ptv-timetable-api/)
3. Refer to the [Next.js documentation](https://nextjs.org/docs) for framework-specific questions
