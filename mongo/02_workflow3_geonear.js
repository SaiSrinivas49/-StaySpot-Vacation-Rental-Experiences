// 02_workflow3_geonear.js
// Step 3, Workflow 3: Trending Search Hotspots
// Uses $geoNear to find recent SearchSessions within 5km of a reference point,
// then clusters them into "hotspots" by rounding coordinates to a coarser grid.
//
// Requires: the 2dsphere index on SearchSessions.location
// (created by 01_collections_and_indexes.js) must already exist.

require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "stayspot";

async function trendingHotspots(db) {
  const results = await db
    .collection("SearchSessions")
    .aggregate([
      {
        // Must be the first stage. Filters by distance from `near` AND
        // sorts nearest-first, using the 2dsphere index.
        $geoNear: {
          near: { type: "Point", coordinates: [78.4867, 17.385] }, // [lng, lat]
          distanceField: "distance_meters",
          maxDistance: 5000, // 5km, in meters (spherical: true)
          spherical: true,
        },
      },
      {
        // MongoDB has no built-in "cluster by proximity" stage, so nearby
        // sessions are grouped by rounding their coordinates to a shared grid cell.
        $group: {
          _id: {
            lat_bucket: {
              $round: [{ $arrayElemAt: ["$location.coordinates", 1] }, 2],
            },
            lng_bucket: {
              $round: [{ $arrayElemAt: ["$location.coordinates", 0] }, 2],
            },
          },
          session_count: { $sum: 1 },
          avg_distance: { $avg: "$distance_meters" },
        },
      },
      { $sort: { session_count: -1 } }, // busiest hotspot first
    ])
    .toArray();

  return results;
}

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log(`Connected to MongoDB Atlas (db: ${dbName})\n`);
    const db = client.db(dbName);

    const results = await trendingHotspots(db);
    console.log("Workflow 3 - Trending Search Hotspots:");
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("02_workflow3_geonear.js failed:", err);
    process.exit(1);
  });
}

module.exports = { trendingHotspots };
