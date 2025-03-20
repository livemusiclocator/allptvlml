# PTV-LML (Public Transport Victoria - Live Music Locator)

A Flask web application that displays Public Transport Victoria (PTV) route information and integrates with live music gig data.

## Features

- View all PTV routes by type (train, tram, bus)
- Display stops for each route with proper sequencing
- Show nearby live music gigs for each stop
- View upcoming gigs along your route
- Interactive UI with transport-specific icons
- Caching system for improved performance

## Technical Details

### Stop Sequencing

The application handles stop sequencing in a sophisticated way to ensure correct ordering of stops along routes:

1. **Direction-Aware Sequencing**: Each route direction is processed independently to maintain proper stop order.
2. **Pattern-Based Sequencing**: The application uses the PTV pattern endpoint to get accurate stop sequences:
   - Fetches pattern data for each route/direction combination
   - Uses stop_sequence from pattern data as the primary sequence source
   - Falls back to stop_sequence from stops endpoint if pattern data unavailable
   
This approach has been verified working correctly with routes like Tram Route 11, providing accurate stop ordering that matches the physical route.

### Caching

The application implements a file-based caching system to:
- Reduce API calls
- Improve response times
- Minimize rate limiting issues

Cache files are stored in the `cache/` directory with a 24-hour expiration.

## Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ptv-lml.git
cd ptv-lml
```

2. Create and activate a virtual environment:
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
Create a `.env` file with:
```
DEV_ID=your_dev_id
API_KEY=your_api_key
```

5. Run the application:
```bash
python app.py
```

The application will be available at `http://127.0.0.1:8089`

## API Integration

The application integrates with:
- PTV Timetable API v3
- Live Music Locator API

## License

[MIT License](LICENSE)
