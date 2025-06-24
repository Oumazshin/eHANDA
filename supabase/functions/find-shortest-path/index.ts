import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.2'
import {
  serve,
} from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts' // Assuming you have a cors.ts in _shared folder for CORS headers

// Dijkstra's algorithm implementation
// This is a basic implementation suitable for demonstration.
// For larger graphs, consider optimized data structures (e.g., Fibonacci heap for priority queue).
function dijkstra(graph: Map<string, Map<string, number>>, startNode: string, endNode: string) {
  const distances = new Map<string, number>();
  const previousNodes = new Map<string, string | null>();
  const unvisitedNodes = new Set<string>(); // Priority Queue simulation (can be optimized)

  // Initialize distances, previousNodes, and unvisitedNodes
  for (const node of graph.keys()) {
    distances.set(node, Infinity);
    previousNodes.set(node, null);
    unvisitedNodes.add(node);
  }

  distances.set(startNode, 0);

  while (unvisitedNodes.size > 0) {
    // Find the unvisited node with the smallest distance
    let currentNode: string | null = null;
    for (const node of unvisitedNodes) {
      if (currentNode === null || distances.get(node)! < distances.get(currentNode)!) {
        currentNode = node;
      }
    }

    if (currentNode === null || distances.get(currentNode) === Infinity) {
      break; // No path to the end node or remaining unvisited nodes
    }

    // If we've reached the end node, reconstruct the path
    if (currentNode === endNode) {
      const path: string[] = [];
      let current: string | null = endNode;
      while (current !== null) {
        path.unshift(current);
        current = previousNodes.get(current) || null;
      }
      return { path, distance: distances.get(endNode) };
    }

    unvisitedNodes.delete(currentNode); // Mark as visited

    // Update distances for neighbors
    const neighbors = graph.get(currentNode);
    if (neighbors) {
      for (const [neighbor, weight] of neighbors.entries()) {
        const newDistance = distances.get(currentNode)! + weight;
        if (newDistance < distances.get(neighbor)!) {
          distances.set(neighbor, newDistance);
          previousNodes.set(neighbor, currentNode);
        }
      }
    }
  }

  return { path: [], distance: Infinity }; // No path found
}


serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Use SERVICE_ROLE_KEY for server-side
      {
        auth: {
          persistSession: false,
        },
      },
    )

    const {
      start_latitude,
      start_longitude,
      end_location_id,
    } = await req.json()

    // NEW LOGS for received parameters
    console.log('Received request with:');
    console.log(`  start_latitude: ${start_latitude}`);
    console.log(`  start_longitude: ${start_longitude}`);
    console.log(`  end_location_id: ${end_location_id}`);


    if (!start_latitude || !start_longitude || !end_location_id) {
      return new Response(
        JSON.stringify({
          error:
            'Missing required parameters: start_latitude, start_longitude, end_location_id',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // 1. Fetch all locations (nodes)
    const { data: locations, error: locationsError } = await supabaseClient
      .from('location')
      .select('id, name, latitude, longitude, type') // Added 'type' for deeper debugging

    if (locationsError) {
      console.error('Error fetching locations:', locationsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch locations' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }
    console.log(`Fetched ${locations.length} locations.`);

    // 2. Fetch all edges
    const { data: edges, error: edgesError } = await supabaseClient
      .from('edges')
      .select('from_location_id, to_location_id, weight, direction')

    if (edgesError) {
      console.error('Error fetching edges:', edgesError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch edges' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        },
      )
    }
    console.log(`Fetched ${edges.length} edges.`);


    // 3. Build the graph representation
    const graph = new Map<string, Map<string, number>>();
    const locationMap = new Map<string, { id: string; name: string; latitude: number; longitude: number; type: string }>(); // Added type

    for (const loc of locations) {
      graph.set(loc.id, new Map<string, number>());
      locationMap.set(loc.id, loc);
    }

    for (const edge of edges) {
      // Ensure from/to nodes exist in graph before adding edge
      if (graph.has(edge.from_location_id) && graph.has(edge.to_location_id)) {
        graph.get(edge.from_location_id)?.set(edge.to_location_id, edge.weight);
        if (edge.direction === 'bidirectional') {
          graph.get(edge.to_location_id)?.set(edge.from_location_id, edge.weight);
        }
      } else {
        // Log if an edge references a node that wasn't fetched/doesn't exist
        console.warn(`Skipping edge: ${edge.from_location_id} -> ${edge.to_location_id}. One or both nodes not found in locations.`);
      }
    }
    console.log(`Graph built with ${graph.size} nodes.`);
    let totalEdgesInGraph = 0;
    for (const [, neighbors] of graph.entries()) {
      totalEdgesInGraph += neighbors.size;
    }
    console.log(`Total edges in constructed graph: ${totalEdgesInGraph}`);


    // 4. Find the closest graph node to the user's start location (GPS)
    let userStartNodeId: string | null = null;
    let minDistanceToUser = Infinity;
    let closestNodeDetails = null; // To store details of the closest node

    for (const loc of locations) {
      // Using Haversine distance for more accurate proximity calculation
      const R = 6371; // Radius of Earth in kilometers
      const dLat = (loc.latitude - start_latitude) * Math.PI / 180;
      const dLon = (loc.longitude - start_longitude) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(start_latitude * Math.PI / 180) * Math.cos(loc.latitude * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      if (distance < minDistanceToUser) {
        minDistanceToUser = distance;
        userStartNodeId = loc.id;
        closestNodeDetails = loc; // Store details
      }
    }

    console.log(`Determined userStartNodeId: ${userStartNodeId} (Distance: ${minDistanceToUser.toFixed(3)} km)`);
    if (closestNodeDetails) {
        console.log(`  Details of closest start node: ID=${closestNodeDetails.id}, Name="${closestNodeDetails.name}", Type=${closestNodeDetails.type}`);
    } else {
        console.log('  No closest node details found (this indicates an issue).');
    }

    console.log(`Does userStartNodeId exist in graph? ${graph.has(userStartNodeId!)}`);
    if (userStartNodeId && graph.has(userStartNodeId)) {
        console.log(`Neighbors of userStartNodeId (${userStartNodeId}):`, Array.from(graph.get(userStartNodeId!)?.entries() || []));
    } else {
        console.log(`Cannot get neighbors for userStartNodeId as it's null or not in graph.`);
    }


    if (!userStartNodeId) {
      return new Response(
        JSON.stringify({ error: 'Could not find a starting node near your location.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        },
      );
    }

    // Ensure the end_location_id exists in our graph
    console.log(`Does end_location_id (${end_location_id}) exist in graph? ${graph.has(end_location_id)}`);
    if (graph.has(end_location_id)) {
        const endNodeDetails = locationMap.get(end_location_id);
        console.log(`  Details of end node: ID=${endNodeDetails?.id}, Name="${endNodeDetails?.name}", Type=${endNodeDetails?.type}`);
        console.log(`Neighbors of end_location_id (${end_location_id}):`, Array.from(graph.get(end_location_id)?.entries() || []));
    } else {
        console.log('  End node not found in graph.');
    }


    if (!graph.has(end_location_id)) {
      return new Response(
        JSON.stringify({ error: 'Selected evacuation area not found in the map data.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        },
      );
    }

    // 5. Run Dijkstra's Algorithm
    const { path: routeNodeIds, distance: routeDistance } = dijkstra(graph, userStartNodeId, end_location_id);

    console.log(`Dijkstra result: routeDistance = ${routeDistance}`);
    console.log(`Dijkstra result: routeNodeIds length = ${routeNodeIds.length}`);

    if (routeDistance === Infinity) {
      return new Response(
        JSON.stringify({ error: 'No path found to the evacuation area.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        },
      );
    }

    // 6. Convert path node IDs to location details (name, lat, long)
    const routeDetails = routeNodeIds.map(nodeId => locationMap.get(nodeId)).filter(Boolean);

    return new Response(JSON.stringify({
      path: routeDetails,
      total_distance: routeDistance,
      start_node_id: userStartNodeId,
      end_node_id: end_location_id,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Error processing request:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal Server Error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

// _shared/cors.ts content (create this file if you haven't already)
// export const corsHeaders = {
//   'Access-Control-Allow-Origin': '*', // Or specific origins for production
//   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
// }
