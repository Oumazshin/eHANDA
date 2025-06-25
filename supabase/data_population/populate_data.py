import os
from supabase import create_client, Client
from dotenv import load_dotenv
import osmnx as ox
import networkx as nx
import pandas as pd
import uuid
import math
import sys # Added from your list, though not directly used in the current logic
import asyncio # Added from your list, though not directly used in the current logic

# Load environment variables from a .env file (if you have one)
# For security, do NOT hardcode your keys here in a production app.
# Instead, use environment variables.
load_dotenv()

# --- Supabase Configuration ---
# IMPORTANT: Ensure these are set in your .env file or replace placeholders.
# For a deployed function, use Supabase Dashboard Environment Variables.
SUPABASE_URL = os.getenv("SUPABASE_URL", "YOUR_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "YOUR_SUPABASE_SERVICE_ROLE_KEY")

if SUPABASE_URL == "YOUR_SUPABASE_URL" or SUPABASE_SERVICE_ROLE_KEY == "YOUR_SUPABASE_SERVICE_ROLE_KEY":
    print("WARNING: Supabase URL or Service Role Key is not set. Please update your .env file.")
    print("This script requires valid Supabase credentials to connect.")
    exit("Exiting: Supabase credentials not configured.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# --- OSMnx Configuration ---
# Define the place you want to get the map data for
PLACE_NAME = "Hagonoy, Bulacan"
# Network type: 'walk', 'drive', 'bike', 'all', 'all_private'
NETWORK_TYPE = "walk"

# --- Script Logic ---

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the distance between two points on Earth using the Haversine formula.
    Returns distance in kilometers.
    """
    R = 6371 # Radius of Earth in kilometers

    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return distance

def populate_database_with_osmnx():
    """
    Populates the Supabase 'locations' and 'edges' tables using OSMnx data.
    """
    print(f"Starting database population for {PLACE_NAME} using OSMnx...")

    try:
        # 1. Download the street network graph
        print(f"Downloading '{NETWORK_TYPE}' network for '{PLACE_NAME}'...")
        G = ox.graph_from_place(PLACE_NAME, network_type=NETWORK_TYPE)
        print("Graph downloaded successfully.")

        # 2. Extract Nodes (Locations)
        print("\nProcessing graph nodes (locations)...")
        nodes_data = []
        # node_to_uuid_map will store mapping from OSM node ID (int) to Supabase UUID (str)
        node_to_uuid_map = {}

        for node_id, data in G.nodes(data=True):
            # Generate a UUID for each node to be stored in Supabase
            supabase_uuid = str(uuid.uuid4())
            node_to_uuid_map[node_id] = supabase_uuid

            nodes_data.append({
                "id": supabase_uuid, # Our generated UUID
                "name": data.get('osmid', str(node_id)), # Fallback to node ID if no name
                "latitude": data['y'], # 'y' is latitude in OSMnx
                "longitude": data['x'], # 'x' is longitude in OSMnx
                "type": "road_node", # All OSMnx nodes are road nodes/intersections
                "osm_id": str(node_id) # Store original OSM ID for reference
            })
        print(f"Extracted {len(nodes_data)} nodes.")

        # 3. Insert Locations into Supabase
        print("\nInserting locations into Supabase...")
        # IMPORTANT: Uncomment the TRUNCATE TABLE lines below only if you want to clear
        # all existing data in 'locations' and 'edges' tables before inserting new data.
        # Use with caution, as it will delete all your existing map data!
        # try:
        #     # Ensure foreign key constraints allow truncation or handle dependencies
        #     supabase.rpc('execute_sql', {'sql_query': 'TRUNCATE TABLE edges RESTART IDENTITY CASCADE;'}).execute()
        #     supabase.rpc('execute_sql', {'sql_query': 'TRUNCATE TABLE locations RESTART IDENTITY CASCADE;'}).execute()
        #     print("Successfully cleared existing locations and edges.")
        # except Exception as e:
        #     print(f"Warning: Failed to clear existing tables (ensure you have rpc execute_sql function if using it): {e}")

        try:
            BATCH_SIZE = 1000
            for i in range(0, len(nodes_data), BATCH_SIZE):
                chunk = nodes_data[i:i+BATCH_SIZE]
                print(f"  Inserting locations batch {i // BATCH_SIZE + 1} of {math.ceil(len(nodes_data) / BATCH_SIZE)}...")
                response = supabase.table('location').insert(chunk).execute()
                # --- MODIFIED ERROR HANDLING FOR SUPABASE-PY RESPONSE ---
                if not response.data: # If no data returned, something might have gone wrong
                    # Check status code for specific errors, e.g., 409 for conflict
                    if hasattr(response, 'status_code') and response.status_code == 409: # 409 Conflict for unique constraint
                        print(f"  Skipping duplicate locations in batch {i // BATCH_SIZE + 1}. Data likely already exists.")
                    else:
                        # Fallback to general error if no specific data or status
                        raise Exception(f"Failed to insert locations in batch {i // BATCH_SIZE + 1}. Status: {getattr(response, 'status_code', 'N/A')}, Text: {getattr(response, 'status_text', 'N/A')}")
            print(f"Successfully inserted/processed {len(nodes_data)} locations.")
        except Exception as e:
            print(f"Error inserting locations: {e}")
            exit("Exiting due to location insertion error.")


        # 4. Extract Edges
        print("\nProcessing graph edges (connections)...")
        edges_data = []
        for u, v, key, data in G.edges(keys=True, data=True):
            from_uuid = node_to_uuid_map.get(u)
            to_uuid = node_to_uuid_map.get(v)

            if from_uuid and to_uuid:
                # OSMnx provides 'length' in meters by default, convert to km
                # Ensure the 'weight' column in your DB matches the unit you decide.
                weight_km = data.get('length', 0) / 1000.0 # Convert meters to kilometers

                # OSMnx edges are often 'oneway' or implicitly bidirectional
                # If OSMnx indicates it's one-way, set directional accordingly
                directional = "bidirectional"
                if data.get('oneway') == True:
                    directional = "oneway" # For one-way streets

                edges_data.append({
                    "from_location_id": from_uuid,
                    "to_location_id": to_uuid,
                    "weight": weight_km,
                    "directional": directional,
                    "osm_id": str(data.get('osmid', f"{u}-{v}-{key}")) # Store original OSM way ID for reference
                })
        print(f"Extracted {len(edges_data)} edges.")

        # 5. Insert Edges into Supabase
        print("\nInserting edges into Supabase...")
        try:
            BATCH_SIZE = 1000
            for i in range(0, len(edges_data), BATCH_SIZE):
                chunk = edges_data[i:i+BATCH_SIZE]
                print(f"  Inserting edges batch {i // BATCH_SIZE + 1} of {math.ceil(len(edges_data) / BATCH_SIZE)}...")
                response = supabase.table('edges').insert(chunk).execute()
                # --- MODIFIED ERROR HANDLING FOR SUPABASE-PY RESPONSE ---
                if not response.data: # If no data returned, something might have gone wrong
                    if hasattr(response, 'status_code') and response.status_code == 409: # 409 Conflict for unique constraint
                        print(f"  Skipping duplicate edges in batch {i // BATCH_SIZE + 1}. Data likely already exists.")
                    else:
                        raise Exception(f"Failed to insert edges in batch {i // BATCH_SIZE + 1}. Status: {getattr(response, 'status_code', 'N/A')}, Text: {getattr(response, 'status_text', 'N/A')}")
            print(f"Successfully inserted/processed {len(edges_data)} edges.")
        except Exception as e:
            print(f"Error inserting edges: {e}")
            exit("Exiting due to edge insertion error.")

        # --- OPTIONAL: Add specific Evacuation Centers Manually or by OSMnx Query ---
        # If your evacuation centers are NOT part of the road network (e.g., inside a building)
        # you need to manually add them and link them to the nearest road node.
        # This part requires careful manual identification of lat/lon for the center itself
        # and a nearby road_node_id from the 'locations' table.

        # Example of adding a specific evac center NOT from OSMnx graph nodes directly:
        print("\nAdding/Updating specific Evacuation Centers (if not part of the road network)...")
        EVACUATION_CENTERS_TO_ADD = [
            # Example: Sta. Monica Chapel as an evac center, connecting to a nearby road node
            {"name": "Santa Monica National High School - Main", "latitude": 14.839295564617862, "longitude": 120.73736897910136,"type": "evacuation_center"},
            {"name": "Santa Monica Elementary School", "latitude": 14.838881, "longitude": 120.737676,"type": "evacuation_center"},
            {"name": "Santa Monica Barangay Hall", "latitude": 14.839561347969248, "longitude": 120.73877010982662, "type": "evacuation_center"}
        ]
        
        for evac_data in EVACUATION_CENTERS_TO_ADD:
            # Find the closest road node from the newly inserted locations
            closest_node_id = None
            min_dist_to_node = float('inf')
            
            # Re-fetch locations from Supabase to ensure we have the latest generated IDs
            refreshed_locations_response = supabase.table('location').select('id, latitude, longitude, type').execute()
            refreshed_locations = refreshed_locations_response.data

            for loc in refreshed_locations:
                if loc['type'] == 'road_node': # Only consider road nodes for connection
                    dist = haversine_distance(evac_data['latitude'], evac_data['longitude'], loc['latitude'], loc['longitude'])
                    if dist < min_dist_to_node:
                        min_dist_to_node = dist
                        closest_node_id = loc['id']
            
            if closest_node_id:
                print(f"  Adding/Updating Evac Center: {evac_data['name']} (Closest Node: {closest_node_id})")
                try:
                    # Check if this evac center already exists by name or coordinates to avoid duplicates
                    # Now checking response.data for content
                    existing_evac_response = supabase.table('location').select('id').eq('name', evac_data['name']).execute()
                    if existing_evac_response.data and len(existing_evac_response.data) > 0:
                        evac_id = existing_evac_response.data[0]['id']
                        # Update existing
                        update_response = supabase.table('location').update(evac_data).eq('id', evac_id).execute()
                        if not update_response.data: # Check data for success
                            raise Exception(f"Failed to update existing evac center: {evac_data['name']}. Status: {getattr(update_response, 'status_code', 'N/A')}")
                        print(f"  Updated existing evac center: {evac_data['name']}")
                    else:
                        # Insert new
                        insert_response = supabase.table('location').insert(evac_data).execute()
                        if not insert_response.data: # Check data for success
                            raise Exception(f"Failed to insert new evac center: {evac_data['name']}. Status: {getattr(insert_response, 'status_code', 'N/A')}")
                        evac_id = insert_response.data[0]['id']
                        print(f"  Inserted new evac center: {evac_data['name']}")
                    
                    # Add bidirectional edge between evac center and closest road node
                    # Check if edge already exists to prevent duplicate key error on re-run
                    existing_edge_response_fwd = supabase.table('edges').select('id').eq('from_location_id', evac_id).eq('to_location_id', closest_node_id).execute()
                    existing_edge_response_bwd = supabase.table('edges').select('id').eq('from_location_id', closest_node_id).eq('to_location_id', evac_id).execute()

                    if not existing_edge_response_fwd.data: # If forward edge doesn't exist
                        insert_edge_fwd_response = supabase.table('edges').insert({
                            "from_location_id": evac_id,
                            "to_location_id": closest_node_id,
                            "weight": min_dist_to_node, # Use actual calculated distance
                            "directional": "bidirectional"
                        }).execute()
                        if not insert_edge_fwd_response.data:
                            print(f"    Warning: Failed to insert forward edge for {evac_data['name']}. Status: {getattr(insert_edge_fwd_response, 'status_code', 'N/A')}")
                        else:
                            print(f"    Added edge from {evac_data['name']} to closest node.")
                    
                    if not existing_edge_response_bwd.data: # If backward edge doesn't exist
                        insert_edge_bwd_response = supabase.table('edges').insert({
                            "from_location_id": closest_node_id,
                            "to_location_id": evac_id,
                            "weight": min_dist_to_node,
                            "directional": "bidirectional"
                        }).execute()
                        if not insert_edge_bwd_response.data:
                            print(f"    Warning: Failed to insert backward edge for {evac_data['name']}. Status: {getattr(insert_edge_bwd_response, 'status_code', 'N/A')}")
                        else:
                            print(f"    Added edge from closest node to {evac_data['name']}.")

                except Exception as e:
                    print(f"  Error adding/updating specific evac center {evac_data['name']}: {e}")
            else:
                print(f"  Could not find a closest road node for {evac_data['name']}. Skipping edge creation.")


        print("\nDatabase population complete using OSMnx and custom evacuation centers!")

    except ImportError:
        print("\nERROR: OSMnx, NetworkX, Pandas, or Supabase Python client are not installed.")
        print("Please install them using: pip install osmnx networkx pandas supabase python-dotenv")
    except Exception as e:
        print(f"\nAn unexpected error occurred: {e}")
        print("Please check your internet connection, Supabase credentials, and the specified place name.")
        # Print full traceback for debugging
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    populate_database_with_osmnx()
