// 03_workflow4_facet.js
// Step 3, Workflow 4: Multi-Faceted Review Analytics
// Uses $facet to compute rating distribution, top review tags, and overall
// average rating in a single aggregation pass over PropertyReviews.

require("dotenv").config();
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "stayspot";

async function reviewAnalytics(db) {
  const results = await db
    .collection("PropertyReviews")
    .aggregate([
      {
        $facet: {
          // Facet 1: how many reviews got each rating value
          ratingDistribution: [
            { $group: { _id: "$rating", count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          // Facet 2: most frequent review tags (top 5)
          // $unwind explodes the location_tags array so each tag becomes its
          // own document - required before $group can count individual tags.
          topTags: [
            { $unwind: "$location_tags" },
            { $group: { _id: "$location_tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
          ],
          // Facet 3: overall average rating across ALL reviews (_id: null
          // groups everything into one bucket instead of splitting by a field)
          overallAverage: [
            { $group: { _id: null, avgRating: { $avg: "$rating" } } },
          ],
        },
      },
    ])
    .toArray();

  return results[0]; // $facet always returns a single document
}

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log(`Connected to MongoDB Atlas (db: ${dbName})\n`);
    const db = client.db(dbName);

    const results = await reviewAnalytics(db);
    console.log("Workflow 4 - Multi-Faceted Review Analytics:");
    console.log(JSON.stringify(results, null, 2));
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error("03_workflow4_facet.js failed:", err);
    process.exit(1);
  });
}

module.exports = { reviewAnalytics };
