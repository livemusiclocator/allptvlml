import requests
import hmac
import hashlib
import os
import json
from datetime import datetime, timedelta
from math import radians, sin, cos, sqrt, atan2
import pickle
from pathlib import Path
from dotenv import load_dotenv
from flask import Flask, render_template, jsonify
import sys
from collections import deque
from threading import Lock

app = Flask(__name__)
load_dotenv()

DEV_ID = os.getenv("DEV_ID")
API_KEY = os.getenv("API_KEY")

# Create cache directory if it doesn't exist
CACHE_DIR = Path('cache')
CACHE_DIR.mkdir(exist_ok=True)

# Create a thread-safe circular buffer to store logs
log_buffer = deque(maxlen=1000)
log_lock = Lock()

def store_log(message):
    with log_lock:
        log_buffer.append({
            'timestamp': datetime.now().isoformat(),
            'message': message
        })

# Override Flask logger to store messages
class LogHandler:
    def info(self, msg):
        store_log(msg)
        print(msg)
    
    def error(self, msg):
        store_log(f"ERROR: {msg}")
        print(f"ERROR: {msg}", file=sys.stderr)
    
    def warning(self, msg):
        store_log(f"WARNING: {msg}")
        print(f"WARNING: {msg}")

app.logger = LogHandler()

def get_cache_path(key):
    """Get path for cached file"""
    return CACHE_DIR / f"{key}.pickle"

def get_cached_data(key, expiry_hours=24):
    """Get data from cache if it exists and is not expired"""
    cache_path = get_cache_path(key)
    if cache_path.exists():
        try:
            with open(cache_path, 'rb') as f:
                cached_data = pickle.load(f)
                if datetime.now() - cached_data['timestamp'] < timedelta(hours=expiry_hours):
                    return cached_data['data']
        except Exception as e:
            print(f"Cache read error: {e}")
    return None

def save_to_cache(key, data):
    """Save data to cache with current timestamp"""
    cache_path = get_cache_path(key)
    try:
        with open(cache_path, 'wb') as f:
            pickle.dump({
                'timestamp': datetime.now(),
                'data': data
            }, f)
    except Exception as e:
        print(f"Cache write error: {e}")

def generate_signature(request):
    key = bytes(API_KEY, 'utf-8')
    raw = request + ('&' if ('?' in request) else '?') + 'devid=' + DEV_ID
    signature = hmac.new(key, bytes(raw, 'utf-8'), hashlib.sha1).hexdigest().upper()
    return signature

def get_route_types():
    # Try to get from cache first
    cached_data = get_cached_data('route_types')
    if cached_data:
        return cached_data

    base_url = 'https://timetableapi.ptv.vic.gov.au'
    request_path = '/v3/route_types'
    
    signature = generate_signature(request_path)
    url = f"{base_url}{request_path}?devid={DEV_ID}&signature={signature}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        # Save to cache
        save_to_cache('route_types', data)
        return data
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def get_routes_by_type(route_type):
    # Try to get from cache first
    cache_key = f'routes_type_{route_type}'
    cached_data = get_cached_data(cache_key)
    if cached_data:
        return cached_data

    base_url = 'https://timetableapi.ptv.vic.gov.au'
    request_path = f'/v3/routes'
    if route_type is not None:
        request_path += f'?route_types={route_type}'
    
    signature = generate_signature(request_path)
    url = f"{base_url}{request_path}&devid={DEV_ID}&signature={signature}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        # Save to cache
        save_to_cache(cache_key, data)
        return data
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def get_route_directions(route_id):
    # Try to get from cache first
    cache_key = f'directions_route_{route_id}'
    cached_data = get_cached_data(cache_key)
    if cached_data:
        return cached_data

    base_url = 'https://timetableapi.ptv.vic.gov.au'
    request_path = f'/v3/directions/route/{route_id}'
    
    signature = generate_signature(request_path)
    url = f"{base_url}{request_path}?devid={DEV_ID}&signature={signature}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        # Save to cache
        save_to_cache(cache_key, data)
        return data
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def get_stop_details(stop_id, route_type):
    # Try to get from cache first
    cache_key = f'stop_details_{stop_id}_{route_type}'
    cached_data = get_cached_data(cache_key)
    if cached_data:
        return cached_data

    base_url = 'https://timetableapi.ptv.vic.gov.au'
    request_path = f'/v3/stops/{stop_id}/route_type/{route_type}'
    
    signature = generate_signature(request_path)
    url = f"{base_url}{request_path}?devid={DEV_ID}&signature={signature}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        # Save to cache
        save_to_cache(cache_key, data)
        return data
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")
        return None

def get_route_stops(route_id, route_type):
    # Try to get from cache first
    cache_key = f'stops_route_{route_id}_{route_type}'
    cached_data = get_cached_data(cache_key)
    if cached_data:
        app.logger.info("\n" + "="*100)
        app.logger.info(f"Using cached data for route {route_id}")
        app.logger.info("="*100 + "\n")
        return cached_data

    app.logger.info("\n" + "="*100)
    app.logger.info(f"Fetching fresh data for route {route_id}")
    app.logger.info("="*100 + "\n")

    base_url = 'https://timetableapi.ptv.vic.gov.au'
    
    # First get the route details to get the name
    request_path = f'/v3/routes/{route_id}'
    signature = generate_signature(request_path)
    url = f"{base_url}{request_path}?devid={DEV_ID}&signature={signature}"
    
    try:
        response = requests.get(url)
        response.raise_for_status()
        route_data = response.json()
        route_name = route_data['route']['route_name'] if 'route' in route_data else str(route_id)
        app.logger.info(f"Route name: {route_name}")
    except requests.exceptions.RequestException as e:
        app.logger.error(f"Failed to get route name: {e}\n")
        route_name = str(route_id)
    
    # Get the route directions
    directions_data = get_route_directions(route_id)
    if not directions_data or 'directions' not in directions_data:
        app.logger.error("Failed to get route directions")
        return None
        
    app.logger.info("\nDirections found:")
    for direction in directions_data['directions']:
        app.logger.info(f"- {direction['direction_name']} (ID: {direction['direction_id']})")
        
    # Get stops for each direction
    stops_data = {
        'stops_by_direction': {},
        'directions': directions_data['directions'],
        'route_name': route_name
    }
    
    for direction in directions_data['directions']:
        direction_id = direction['direction_id']
        
        # First get the pattern data to get correct stop sequences
        pattern_path = f'/v3/pattern/run/{route_id}/route_type/{route_type}?direction_id={direction_id}'
        signature = generate_signature(pattern_path)
        pattern_url = f"{base_url}{pattern_path}&devid={DEV_ID}&signature={signature}"
        
        app.logger.info("\n" + "="*100)
        app.logger.info(f"Fetching pattern data for direction: {direction['direction_name']}")
        app.logger.info(f"Pattern API URL: {pattern_url}")
        
        try:
            pattern_response = requests.get(pattern_url)
            pattern_response.raise_for_status()
            pattern_data = pattern_response.json()
            
            # Create a mapping of stop_id to sequence number from pattern data
            sequence_map = {}
            if 'departures' in pattern_data:
                for departure in pattern_data['departures']:
                    stop_id = departure.get('stop_id')
                    sequence = departure.get('stop_sequence')
                    if stop_id is not None and sequence is not None:
                        sequence_map[stop_id] = sequence
            
            app.logger.info("\nPattern data sequences:")
            for stop_id, seq in sequence_map.items():
                app.logger.info(f"Stop ID: {stop_id} -> Sequence: {seq}")
        except requests.exceptions.RequestException as e:
            app.logger.error(f"Failed to get pattern data: {e}")
            sequence_map = {}
        
        # Now get the stops data
        stops_path = f'/v3/stops/route/{route_id}/route_type/{route_type}?direction_id={direction_id}'
        signature = generate_signature(stops_path)
        stops_url = f"{base_url}{stops_path}&devid={DEV_ID}&signature={signature}"
        
        app.logger.info("\nFetching stops data...")
        app.logger.info(f"Stops API URL: {stops_url}")
        
        try:
            response = requests.get(stops_url)
            response.raise_for_status()
            stops_response = response.json()
            
            if 'stops' in stops_response:
                stops = stops_response['stops']
                app.logger.info(f"\nFound {len(stops)} stops in response")
                
                # Add direction information and get additional details for each stop
                for stop in stops:
                    stop['direction_id'] = direction_id
                    stop['direction_name'] = direction['direction_name']
                    
                    # Get additional stop details
                    stop_details = get_stop_details(stop['stop_id'], route_type)
                    if stop_details and 'stop' in stop_details:
                        stop.update(stop_details['stop'])
                    
                    # Use sequence from pattern data if available, otherwise use stop_sequence
                    stop_id = stop['stop_id']
                    pattern_sequence = sequence_map.get(stop_id)
                    orig_sequence = stop.get('stop_sequence')
                    
                    if pattern_sequence is not None:
                        stop['absolute_sequence'] = pattern_sequence
                        sequence_source = "pattern"
                    elif orig_sequence is not None and orig_sequence > 0:
                        stop['absolute_sequence'] = orig_sequence
                        sequence_source = "stop"
                    else:
                        stop['absolute_sequence'] = 999999
                        sequence_source = "none"
                    
                    app.logger.info(f"\nStop Details:")
                    app.logger.info(f"Name: {stop['stop_name']}")
                    app.logger.info(f"ID: {stop_id}")
                    app.logger.info(f"Pattern Sequence: {pattern_sequence}")
                    app.logger.info(f"Original Sequence: {orig_sequence}")
                    app.logger.info(f"Assigned Sequence: {stop['absolute_sequence']} (from {sequence_source})")
                
                app.logger.info("\nSorting stops by sequence...")
                # Sort stops by their sequence number
                stops.sort(key=lambda x: x['absolute_sequence'])
                
                app.logger.info("\nAfter sorting:")
                for stop in stops:
                    app.logger.info(f"Stop: {stop['stop_name']:<50} Sequence: {stop['absolute_sequence']}")
                
                # Filter out stops with no sequence number
                valid_stops = [s for s in stops if s['absolute_sequence'] != 999999]
                invalid_stops = [s for s in stops if s['absolute_sequence'] == 999999]
                
                app.logger.info(f"\nFound {len(valid_stops)} stops with valid sequence numbers")
                app.logger.info(f"Found {len(invalid_stops)} stops with invalid/missing sequence numbers")
                
                if invalid_stops:
                    app.logger.info("\nStops with missing/invalid sequence numbers:")
                    for stop in invalid_stops:
                        app.logger.info(f"- {stop['stop_name']} (ID: {stop['stop_id']})")
                
                stops_data['stops_by_direction'][direction_id] = valid_stops
                
            else:
                app.logger.warning("No stops found in response!")
            
            app.logger.info("="*100 + "\n")
                
        except requests.exceptions.RequestException as e:
            app.logger.error(f"Request failed: {e}")
            return None
    
    # Save to cache
    save_to_cache(cache_key, stops_data)
    return stops_data

@app.route('/')
def home():
    # Get all route types to display in the home page
    route_types_data = get_route_types()
    route_types = []
    
    if route_types_data and 'route_types' in route_types_data:
        route_types = route_types_data['route_types']
        
        # For each route type, get its routes
        for route_type in route_types:
            routes_data = get_routes_by_type(route_type['route_type'])
            if routes_data and 'routes' in routes_data:
                route_type['routes'] = routes_data['routes']
            else:
                route_type['routes'] = []
    
    return render_template('index.html', route_types=route_types)

@app.route('/stops/<int:route_id>/<int:route_type>')
def show_stops(route_id, route_type):
    stops_data = get_route_stops(route_id, route_type)
    
    if stops_data and 'stops_by_direction' in stops_data:
        return render_template('stops.html',
                            stops_by_direction=stops_data['stops_by_direction'],
                            directions=stops_data['directions'],
                            route_id=route_id,
                            route_type=route_type,
                            route_name=stops_data.get('route_name', str(route_id)))
    else:
        return render_template('stops.html',
                            error=f"Could not find stops for route {route_id} with route type {route_type}",
                            route_id=route_id)

def get_todays_gigs():
    today = datetime.now().strftime('%Y-%m-%d')
    url = f'https://api.lml.live/gigs/query'
    params = {
        'location': 'melbourne',
        'date_from': today,
        'date_to': today
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        print("API Response:", data)  # Debug print
        return data
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch gigs: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"Status code: {e.response.status_code}")
            print(f"Response: {e.response.text}")
        return None

@app.route('/allgigs')
def show_gigs():
    gigs = get_todays_gigs()
    
    if gigs is None:
        return render_template('allgigs.html', error="Could not fetch gigs data. Please try again later.")
        
    # Sort gigs by start time, handling None values
    def sort_key(gig):
        date = gig.get('date') or ''
        time = gig.get('start_time') or ''
        return (date, time)
    
    gigs.sort(key=sort_key)
    
    return render_template('allgigs.html', gigs=gigs)

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in meters using the Haversine formula"""
    R = 6371000  # Earth's radius in meters

    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance = R * c

    return distance

def find_nearby_gigs_for_stops(stops, gigs):
    """Helper function to find gigs near a list of stops"""
    stops_with_gigs = []
    any_gigs_found = False

    for stop in stops:
        stop_lat = float(stop['stop_latitude'])
        stop_lon = float(stop['stop_longitude'])
        
        nearby_gigs = []
        for gig in gigs:
            venue = gig['venue']
            if 'latitude' in venue and 'longitude' in venue:
                distance = calculate_distance(
                    stop_lat, stop_lon,
                    float(venue['latitude']), float(venue['longitude'])
                )
                
                # If within 500 meters
                if distance <= 500:
                    gig_copy = dict(gig)
                    gig_copy['distance_meters'] = distance
                    nearby_gigs.append(gig_copy)
        
        if nearby_gigs:
            any_gigs_found = True
            stop['nearby_gigs'] = sorted(nearby_gigs, key=lambda x: x['distance_meters'])
            stops_with_gigs.append(stop)

    return stops_with_gigs, any_gigs_found

@app.route('/nearby_gigs/<int:route_id>/<int:route_type>')
def show_nearby_gigs(route_id, route_type):
    # Get stops data
    stops_data = get_route_stops(route_id, route_type)
    if not stops_data or 'stops_by_direction' not in stops_data:
        return render_template('nearby_gigs.html',
                            error=f"Could not find stops for route {route_id}",
                            route_id=route_id)

    # Get gigs data
    gigs = get_todays_gigs()
    if gigs is None:
        return render_template('nearby_gigs.html',
                            error="Could not fetch gigs data",
                            route_id=route_id)

    # Combine all stops from all directions
    all_stops = []
    for direction_stops in stops_data['stops_by_direction'].values():
        all_stops.extend(direction_stops)

    # Find gigs near all stops
    stops_with_gigs, any_gigs_found = find_nearby_gigs_for_stops(all_stops, gigs)

    return render_template('nearby_gigs.html',
                         route_id=route_id,
                         stops_with_gigs=stops_with_gigs,
                         any_gigs_found=any_gigs_found)

@app.route('/gigs_ahead/<int:route_id>/<int:route_type>/<int:stop_id>/<int:direction_id>')
def show_gigs_ahead(route_id, route_type, stop_id, direction_id):
    # Get stops data
    stops_data = get_route_stops(route_id, route_type)
    if not stops_data or 'stops_by_direction' not in stops_data:
        return render_template('gigs_ahead.html',
                            error=f"Could not find stops for route {route_id}",
                            route_id=route_id,
                            route_type=route_type)

    # Get gigs data
    gigs = get_todays_gigs()
    if gigs is None:
        return render_template('gigs_ahead.html',
                            error="Could not fetch gigs data",
                            route_id=route_id,
                            route_type=route_type)

    # Get stops for the specified direction (already sorted by sequence)
    stops_in_direction = stops_data['stops_by_direction'].get(direction_id, [])
    
    # Find the current stop and its sequence number
    current_stop = None
    current_sequence = None
    for stop in stops_in_direction:
        if stop['stop_id'] == stop_id:
            current_stop = stop
            current_sequence = stop.get('stop_sequence')
            break
    
    if not current_stop or current_sequence is None:
        return render_template('gigs_ahead.html',
                            error=f"Could not find stop {stop_id}",
                            route_id=route_id,
                            route_type=route_type)

    # First check for gigs at the current stop
    stops_with_gigs = []
    any_gigs_found = False
    
    # Check current stop
    stop_lat = float(current_stop['stop_latitude'])
    stop_lon = float(current_stop['stop_longitude'])
    
    nearby_gigs = []
    for gig in gigs:
        venue = gig['venue']
        if 'latitude' in venue and 'longitude' in venue:
            distance = calculate_distance(
                stop_lat, stop_lon,
                float(venue['latitude']), float(venue['longitude'])
            )
            
            # If within 500 meters
            if distance <= 500:
                gig_copy = dict(gig)
                gig_copy['distance_meters'] = distance
                nearby_gigs.append(gig_copy)
    
    if nearby_gigs:
        any_gigs_found = True
        current_stop['nearby_gigs'] = sorted(nearby_gigs, key=lambda x: x['distance_meters'])
        stops_with_gigs.append(current_stop)

    # Then check all stops ahead in sequence
    for stop in stops_in_direction:
        if stop.get('stop_sequence', 0) > current_sequence:
            stop_lat = float(stop['stop_latitude'])
            stop_lon = float(stop['stop_longitude'])
            
            nearby_gigs = []
            for gig in gigs:
                venue = gig['venue']
                if 'latitude' in venue and 'longitude' in venue:
                    distance = calculate_distance(
                        stop_lat, stop_lon,
                        float(venue['latitude']), float(venue['longitude'])
                    )
                    
                    # If within 500 meters
                    if distance <= 500:
                        gig_copy = dict(gig)
                        gig_copy['distance_meters'] = distance
                        nearby_gigs.append(gig_copy)
            
            if nearby_gigs:
                any_gigs_found = True
                stop['nearby_gigs'] = sorted(nearby_gigs, key=lambda x: x['distance_meters'])
                stops_with_gigs.append(stop)

    return render_template('gigs_ahead.html',
                         route_id=route_id,
                         route_type=route_type,
                         current_stop=current_stop,
                         stops_with_gigs=stops_with_gigs,
                         any_gigs_found=any_gigs_found)

@app.route('/api/logs')
def get_logs():
    with log_lock:
        return jsonify(list(log_buffer))

if __name__ == '__main__':
    print("PTV Route Viewer is running at: http://127.0.0.1:8089")
    app.run(debug=True, port=8089)
