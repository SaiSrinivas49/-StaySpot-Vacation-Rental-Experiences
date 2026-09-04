# StaySpot — MongoDB

It covers:

Setting up the 3 unstructured collections — PropertyAmenities, PropertyReviews, SearchSessions (Step 1.2)
Adding geospatial (2dsphere) and TTL indexes on SearchSessions (Step 2.4)
Workflow 3 — trending search hotspots using $geoNear (Step 3.3)
Workflow 4 — review analytics using $facet (Step 3.4)


##Install the dependencies:
npm install


## Running

There are a few ways to run this depending on what you need:

Just want the collections and sample data : npm run generate

Want to set up the indexes and see both workflows run : npm run workflows

Want to run everything and get a log file out of it? : npm run test

This creates (or overwrites) `logs.json` with the results.


## Files

generateData.js : Creates the 3 collections and adds sample documents to each
workflows.js : Sets up the indexes, then runs Workflow 3 ($geoNear) and Workflow 4 ($facet)
test.js : Runs everything above and writes the output to `logs.json'
logs.json : Gets created automatically once you run `npm run test'



## A log from an actual run


```json
{
  "run_at": "2026-09-04T02:39:35.500Z",
  "database": "stayspot",
  "steps": [
    {
      "step": "Step 1.2 - Generate MongoDB collections & sample data",
      "status": "pass",
      "details": {
        "collections": ["PropertyAmenities", "PropertyReviews", "SearchSessions"]
      }
    },
    {
      "step": "Step 2.4 - MongoDB Geospatial & TTL indexes",
      "status": "pass",
      "details": {
        "geoIndexName": "location_2dsphere",
        "ttlIndexName": "created_at_1"
      }
    },
    {
      "step": "Step 3.3 - Workflow 3: Trending Search Hotspots",
      "status": "pass",
      "details": {
        "result_count": 1,
        "results": [
          { "_id": { "lat_bucket": 17.39, "lng_bucket": 78.49 }, "session_count": 1, "avg_distance": 0 }
        ]
      }
    },
    {
      "step": "Step 3.4 - Workflow 4: Multi-Faceted Review Analytics",
      "status": "pass",
      "details": {
        "ratingDistribution": [{ "_id": 4.5, "count": 2 }],
        "topTags": [
          { "_id": "quiet street", "count": 2 },
          { "_id": "near metro", "count": 2 },
          { "_id": "great view", "count": 2 }
        ],
        "overallAverage": [{ "_id": null, "avgRating": 4.5 }]
      }
    }
  ]
}
```

    