import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2';
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.js';

function dijkstra(graph, startNode, endNode) {
    const distances = new Map();
    const previousNodes = new Map();
    const unvisitedNodes = new Set();

    for (const node of graph.keys()) {
        distances.set(node, Infinity);
        previousNodes.set(node, null);
        unvisitedNodes.add(node);
    }

    distances.set(startNode, 0);

    while (unvisitedNodes.size > 0) {
        let currentNode = null;
        for (const node of unvisitedNodes) {
            if (currentNode === null || distances.get(node) < distances.get(currentNode)) {
                currentNode = node;
            }
        }

        if (currentNode === null || distances.get(currentNode) === Infinity) {
            break; // No path to remaining unvisited nodes
        }

        if (currentNode === endNode) {
            const path = [];
            let current = endNode;
            while (current !== null) {
                path.unshift(current);
                current = previousNodes.get(current) || null;
            }
            return { path, distance: distances.get(endNode) };
        }

        unvisitedNodes.delete(currentNode);

        const neighbors = graph.get(currentNode);
        if (neighbors) {
            for (const [neighbor, weight] of neighbors.entries()) {
                const newDistance = distances.get(currentNode) + weight;
                if (newDistance < distances.get(neighbor)) {
                    distances.set(neighbor, newDistance);
                    previousNodes.set(neighbor, currentNode);
                }
            }
        }
    }
    return { path: [], distance: Infinity };
}

serve(async (req) => {
    let requestBody;
    try {
        requestBody = await req.clone().json();
        console.log('Incoming Request Body:', requestBody); //
    } catch (e) {
        console.error('Error parsing request body:', e);
        return new Response(JSON.stringify({ error: 'Invalid JSON in request body.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400
        });
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    const { start_latitude, start_longitude, end_location_id } = requestBody;

    try {
        if (!start_latitude || !start_longitude || !end_location_id) {
            console.error('Missing required parameters in request body.');
            return new Response(JSON.stringify({ error: 'Missing required parameters: start_latitude, start_longitude, end_location_id' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
        }

        const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', { auth: { persistSession: false } });

        console.log('Fetching locations...');
        const { data: locations, error: locationsError } = await supabaseClient.from('location').select('id, name, latitude, longitude, type, osm_id').limit(2000); // Select 'type' and 'osm_id' too for full location details
        if (locationsError) {
            console.error('Error fetching locations:', locationsError);
            return new Response(JSON.stringify({ error: 'Failed to fetch locations' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
        }
        console.log('Fetching edges...');
        const { data: edges, error: edgesError } = await supabaseClient.from('edges').select('id, from_location_id, to_location_id, weight, directional').limit(3000);
        if (edgesError) {
            console.error('Error fetching edges:', edgesError);
            return new Response(JSON.stringify({ error: 'Failed to fetch edges' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
        }

        console.log(`Building graph with ${locations.length} locations and ${edges.length} edges.`);
        console.log(`Graph initialized with ${locations.length} nodes from locations.`);

        const graph = new Map();
        // Changed locationMap to store full location objects
        const locationMap = new Map(); 

        for (const loc of locations) {
            graph.set(loc.id, new Map());
            locationMap.set(loc.id, loc); // Store the entire location object
        }

        // Edge Processing
        console.log('Starting edge processing loop...');
        let processedEdgeCount = 0;
        try {
            for (const edge of edges) {
                processedEdgeCount++;

                if (processedEdgeCount % 100 === 0 || processedEdgeCount === 1) {
                    console.log(`Processing edge ${processedEdgeCount}/${edges.length}... (Edge ID: ${edge?.id})`);
                }

                try {
                    // Check for required properties and their types for a valid edge
                    if (!edge || typeof edge.from_location_id !== 'string' || typeof edge.to_location_id !== 'string' || typeof edge.weight !== 'number' || !['bidirectional', 'unidirectional'].includes(edge.directional)) {
                        console.error(`ERROR: Malformed edge data encountered (Edge ID: ${edge?.id}). Skipping. Edge:`, JSON.stringify(edge));
                        continue;
                    }
                    
                    // Check if from_location_id and to_location_id exist in our locationMap
                    if (!locationMap.has(edge.from_location_id)) {
                        console.warn(`Warning: from_location_id ${edge.from_location_id} from edge ${edge.id} not found in locationsMap. Skipping edge.`);
                        continue;
                    }
                    if (!locationMap.has(edge.to_location_id)) {
                        console.warn(`Warning: to_location_id ${edge.to_location_id} from edge ${edge.id} not found in locationsMap. Skipping edge.`);
                        // This specific warning `Warning: Could not add reverse edge...` can also be caught here
                        continue;
                    }


                    const fromNode = graph.get(edge.from_location_id);
                    const targetNodeMap = graph.get(edge.to_location_id); // This is `graph.get(to_location_id)` for the reverse edge check

                    if (isNaN(edge.weight)) {
                       console.error(`ERROR: Edge ID ${edge.id} has invalid weight: ${edge.weight}. Skipping.`);
                       continue;
                    }

                    fromNode.set(edge.to_location_id, edge.weight);
                    // console.log(`Successfully added forward edge from ${edge.from_location_id} to ${edge.to_location_id}`);

                    if (edge.directional === 'bidirectional') {
                        // Check if the target node for the reverse edge also exists in the graph's node list
                        if (graph.has(edge.to_location_id)) { // This is a more direct check
                            graph.get(edge.to_location_id).set(edge.from_location_id, edge.weight);
                            // console.log(`Successfully added reverse edge from ${edge.to_location_id} to ${edge.from_location_id}`);
                        } else {
                            // This scenario is now handled by the `!locationMap.has(edge.to_location_id)` check above.
                            // But keeping this warning for clarity if the graph structure itself is somehow inconsistent.
                            console.warn(`Warning: Could not add reverse edge for edge ID ${edge.id} because to_location_id ${edge.to_location_id} not found in locations for bidirectional edge.`);
                        }
                    }
                } catch (innerEdgeError) {
                    console.error(`ERROR caught while processing edge ID ${edge?.id} at iteration ${processedEdgeCount}:`, innerEdgeError);
                    console.error('Problematic Edge Data:', JSON.stringify(edge));
                    continue;
                }
            }
        } catch (graphBuildingError) {
            console.error(`Error caught during graph building loop (outer catch) at edge count ${processedEdgeCount}:`, graphBuildingError);
            return new Response(JSON.stringify({ error: `Graph building failed during edge processing: ${graphBuildingError.message || 'Unknown error'}` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
        }
        // 4. Find the closest graph node to the user's start location (GPS).
        console.log('Starting closest node search...');
        let userStartNodeId = null;
        let minDistanceToUser = Infinity;
        let userStartNodeCoords = null; // Store coordinates of the closest road node.

        for (const loc of locations) {
            // Skip locations that are not road nodes if you only want to snap to roads for initial point
            // if (loc.type !== 'road_node') { // Uncomment if you only want to snap to road_node type
            //     continue;
            // }

            // Validate coordinates.
            if (typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number' || isNaN(loc.latitude) || isNaN(loc.longitude)) {
                 console.warn(`Warning: Location ID ${loc.id} has invalid latitude/longitude. Skipping in distance calculation.`);
                 continue;
            }
            // Calculate Euclidean distance (approximation for small geographic areas).
            const distance = Math.sqrt(Math.pow(loc.latitude - start_latitude, 2) + Math.pow(loc.longitude - start_longitude, 2));
            if (distance < minDistanceToUser) {
                minDistanceToUser = distance;
                userStartNodeId = loc.id;
                userStartNodeCoords = { latitude: loc.latitude, longitude: loc.longitude };
            }
        }
        console.log(`Determined userStartNodeId: ${userStartNodeId} (Distance: ${minDistanceToUser.toFixed(3)} degrees approx)`);

        // Validate the determined start node.
        if (!userStartNodeId || !graph.has(userStartNodeId) || !userStartNodeCoords) {
            console.warn(`User start node ID ${userStartNodeId} is NOT present in the constructed graph, or coordinates could not be determined! Returning 404.`);
            return new Response(JSON.stringify({ error: 'Could not find a starting node near your location in the graph network.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
        }
        // Validate the end node.
        console.log(`Checking existence of end_location_id (${end_location_id}) in graph: ${graph.has(end_location_id)}`);
        if (!graph.has(end_location_id)) {
            console.warn(`End location ID ${end_location_id} is NOT present in the constructed graph! Returning 404.`);
            return new Response(JSON.stringify({ error: 'Selected evacuation area not found in the map data network.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
        }
        console.log('Graph nodes existence check complete. Proceeding to Dijkstra.');

        // 5. Run Dijkstra's Algorithm.
        const { path: routeNodeIds, distance: routeDistance } = dijkstra(graph, userStartNodeId, end_location_id);
        console.log(`Result from Dijkstra: path length=${routeNodeIds.length}, distance=${routeDistance}`);
        
        // Handle case where no path is found.
        if (routeDistance === Infinity) {
            console.warn(`Dijkstra returned Infinity. No path found from ${userStartNodeId} to ${end_location_id}. Returning 404.`);
            return new Response(JSON.stringify({ error: 'No path found to the evacuation area.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 });
        }

        // 6. Convert path node IDs to full location coordinates for polyline.
        console.log('Path found. Converting node IDs to full location details.');
        const routeCoordinates = routeNodeIds.map((nodeId) => {
            const loc = locationMap.get(nodeId);
            // This check ensures every node in the path actually has coordinates.
            if (!loc) {
                console.warn(`Warning: Node ID ${nodeId} in path not found in locationMap. This indicates a graph inconsistency.`);
                return null;
            }
            return { latitude: loc.latitude, longitude: loc.longitude };
        }).filter(Boolean); // Filter out any nulls if inconsistent nodes were found.

        // 7. Return the success response.
        return new Response(JSON.stringify({
            path: routeCoordinates,          // Array of {latitude, longitude} objects for polyline.
            total_distance: routeDistance,   // Raw distance from Dijkstra.
            start_node_id: userStartNodeId,
            end_node_id: end_location_id,
            start_node_coordinates: userStartNodeCoords // Coordinates of the closest road node.
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
        });

    } catch (error) { 
        // Catch any unhandled errors during the request processing.
        console.error('Final Catch Block Error (likely unhandled error or timeout):', error);
        return new Response(JSON.stringify({
            error: `Internal Server Error: ${error.message || 'Unknown error during execution.'}`,
            stack: error.stack // Include stack trace for debugging.
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500
        });
    }
});
