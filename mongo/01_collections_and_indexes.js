// 01_collections_and_indexes.js
// Step 1.2: Creates PropertyAmenities, PropertyReviews, SearchSessions collections
//           with sample documents.
// Step 2.4: Creates 2dsphere geospatial index and TTL index on SearchSessions.

require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "stayspot";

async function createCollectionsAndData(db) {
  // ---- PropertyAmenities ----
  await db.createCollection("PropertyAmenities").catch(() => {});
  await db.collection("PropertyAmenities").insertOne({
    property_id: "PROP-001",
    amenities: ["WiFi", "Pool", "Kitchen", "Free Parking"],
    house_rules: ["No smoking", "No pets", "Quiet hours 10pm-7am"],
    accessibility_features: ["Step-free entrance", "Wide doorways"],
  });
  console.log("PropertyAmenities: collection created, sample document inserted");

  // ---- PropertyReviews ----
  await db.createCollection("PropertyReviews").catch(() => {});
  await db.collection("PropertyReviews").insertOne({
    property_id: "PROP-001",
    guest_id: "GUEST-001",
    rating: 4.5,
    location_tags: ["quiet street", "near metro", "great view"],
    comment: "Loved the stay, host was very responsive.",
    created_at: new Date(),
  });
  console.log("PropertyReviews: collection created, sample document inserted");

  // ---- SearchSessions ----
  await db.createCollection("SearchSessions").catch(() => {});
  await db.collection("SearchSessions").insertOne({
    user_session_id: "session-abc123",
    location: {
      type: "Point",
      coordinates: [78.4867, 17.385], // [longitude, latitude] - Hyderabad
    },
    created_at: new Date(),
  });
  console.log("SearchSessions: collection created, sample document inserted");
}

async function createIndexes(db) {
  // Geospatial index - required for $geoNear (Workflow 3) to run efficiently
  const geoIndexName = await db
    .collection("SearchSessions")
    .createIndex({ location: "2dsphere" });
  console.log(`SearchSessions: geospatial index created (${geoIndexName})`);

  // TTL index - auto-expires search sessions 2 hours (7200s) after creation
  const ttlIndexName = await db
    .collection("SearchSessions")
    .createIndex({ created_at: 1 }, { expireAfterSeconds: 7200 });
  console.log(`SearchSessions: TTL index created (${ttlIndexName}, expires after 7200s)`);

  return { geoIndexName, ttlIndexName };
}

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log(`Connected to MongoDB Atlas (db: ${dbName})\n`);
    const db = client.db(dbName);

    await createCollectionsAndData(db);
    console.log("");
    await createIndexes(db);

    console.log("\n01_collections_and_indexes.js completed successfully.");
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("01_collections_and_indexes.js failed:", err);
    process.exit(1);
  });
}

module.exports = { createCollectionsAndData, createIndexes };
