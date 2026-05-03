import json
import requests
from pathlib import Path

# File paths
GEOJSON_FILE = "D:\\Websites\\AgWaterWebsite\\public\\drought\\data\\snotel_stations_average_annual_swe.geojson"
API_BASE = "https://wcc.sc.egov.usda.gov/awdbRestApi/services/v1/stations"

def get_county_from_api(station_id):
    """Fetch county name from USDA API for a given station ID."""
    try:
        params = {
            "stationTriplets": f"{station_id}:OR:SNTL"
        }
        response = requests.get(API_BASE, params=params, timeout=10)
        response.raise_for_status()
        # Only one station should be returned, so we take the first element
        data = response.json()[0]
        
        # Extract county name from the response only if a station is found
        if len(data) > 0:
            return data.get("countyName", "")
    except Exception as e:
        print(f"Error fetching county for station {station_id}: {e}")
    
    return None

def populate_missing_counties():
    """Load GeoJSON, populate missing county names, and save back."""
    with open(GEOJSON_FILE, 'r') as f:
        geojson_data = json.load(f)
    
    updated_count = 0
    
    for feature in geojson_data["features"]:
        properties = feature["properties"]
        
        # Check if countyName is empty or missing
        if not properties.get("countyName") or properties["countyName"].strip() == "":
            station_id = properties.get("stationId")
            print(f"Fetching county for station {station_id} ({properties.get('name')})...")
            
            county_name = get_county_from_api(station_id)
            if county_name:
                properties["countyName"] = county_name
                updated_count += 1
                print(f"  Updated: {county_name}")
            else:
                print(f"  Could not find county for station {station_id}")
    
    # Write updated GeoJSON back to file
    with open(GEOJSON_FILE, 'w') as f:
        json.dump(geojson_data, f, indent=2)
    
    print(f"\nCompleted! Updated {updated_count} stations with county names.")

if __name__ == "__main__":
    populate_missing_counties()