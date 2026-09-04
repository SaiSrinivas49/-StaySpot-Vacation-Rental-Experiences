"""
StaySpot MongoDB Seeder
Generates realistic sample data and 500,000+ geospatial SearchSessions.

Install:
    pip install pymongo python-dotenv

.env:
    MONGODB_URI=mongodb+srv://...
    MONGODB_DB_NAME=stayspot
"""

import math
import os
import random
import sys
from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv
from pymongo import MongoClient, ASCENDING

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
DB_NAME = os.getenv("MONGODB_DB_NAME", "stayspot")

# Assignment workload
SEARCH_SESSION_COUNT = 500_000
REVIEW_COUNT = 50_000
PROPERTY_COUNT = 500
BATCH_SIZE = 5_000

# Workflow 3 reference point: [longitude, latitude]
CENTER_LNG = 78.4867
CENTER_LAT = 17.3850

AMENITIES = [
    "WiFi", "Pool", "Kitchen", "Free Parking", "Air Conditioning",
    "Washer", "TV", "Workspace", "Gym", "Balcony", "Hot Water", "Elevator"
]

HOUSE_RULES = [
    "No smoking", "No pets", "Quiet hours 10pm-7am",
    "No parties", "No loud music", "Check-in after 2pm"
]

ACCESSIBILITY_FEATURES = [
    "Step-free entrance", "Wide doorways", "Elevator",
    "Accessible bathroom", "Ground-floor bedroom"
]

LOCATION_TAGS = [
    "quiet street", "near metro", "great view", "central location",
    "near restaurants", "family friendly", "easy transport",
    "near shopping", "peaceful area", "good nightlife"
]

COMMENTS = [
    "Loved the stay, host was very responsive.",
    "Great location and comfortable property.",
    "The place was clean and easy to access.",
    "Nice experience overall. Would stay again.",
    "Good value and convenient location.",
    "The host was helpful and check-in was smooth.",
    "Very comfortable stay with a great view.",
    "The location was excellent for exploring the city."
]


def random_point(max_radius_km=7.0):
    """Generate a random point around the Workflow 3 Hyderabad reference point."""
    radius_km = max_radius_km * math.sqrt(random.random())
    angle = random.uniform(0, 2 * math.pi)

    lat_delta = radius_km / 111.0
    lng_delta = radius_km / (111.0 * math.cos(math.radians(CENTER_LAT)))

    lat = CENTER_LAT + lat_delta * math.sin(angle)
    lng = CENTER_LNG + lng_delta * math.cos(angle)
    return round(lng, 6), round(lat, 6)


def recent_datetime(hours=2):
    now = datetime.now(timezone.utc)
    seconds = random.randint(0, int(hours * 3600) - 1)
    return now - timedelta(seconds=seconds)


def seed_amenities(collection):
    documents = []
    for i in range(1, PROPERTY_COUNT + 1):
        lng, lat = random_point(8.0)
        documents.append({
            "property_id": f"PROP-{i:04d}",
            "title": f"StaySpot Property {i:04d}",
            "amenities": random.sample(AMENITIES, random.randint(4, 7)),
            "house_rules": random.sample(HOUSE_RULES, random.randint(2, 4)),
            "accessibility_features": random.sample(
                ACCESSIBILITY_FEATURES, random.randint(1, 3)
            ),
            "location": {
                "type": "Point",
                "coordinates": [lng, lat]
            }
        })
    collection.insert_many(documents, ordered=False)
    print(f"PropertyAmenities: inserted {len(documents):,} documents")


def seed_reviews(collection):
    for start in range(0, REVIEW_COUNT, BATCH_SIZE):
        end = min(start + BATCH_SIZE, REVIEW_COUNT)
        batch = []
        for i in range(start + 1, end + 1):
            batch.append({
                "property_id": f"PROP-{random.randint(1, PROPERTY_COUNT):04d}",
                "guest_id": f"GUEST-{random.randint(1, 10000):05d}",
                "rating": random.choice([1, 2, 3, 4, 4.5, 5]),
                "location_tags": random.sample(LOCATION_TAGS, random.randint(2, 4)),
                "comment": random.choice(COMMENTS),
                "created_at": recent_datetime(720)
            })
        collection.insert_many(batch, ordered=False)
        print(f"PropertyReviews: {end:,}/{REVIEW_COUNT:,}")


def seed_search_sessions(collection):
    for start in range(0, SEARCH_SESSION_COUNT, BATCH_SIZE):
        end = min(start + BATCH_SIZE, SEARCH_SESSION_COUNT)
        batch = []
        for i in range(start + 1, end + 1):
            lng, lat = random_point(7.0)
            batch.append({
                "user_session_id": f"session-{i:06d}",
                "location": {
                    "type": "Point",
                    "coordinates": [lng, lat]
                },
                # Within 2 hours so the TTL index does not remove freshly seeded data.
                "created_at": recent_datetime(1.9)
            })
        collection.insert_many(batch, ordered=False)
        print(f"SearchSessions: {end:,}/{SEARCH_SESSION_COUNT:,}")


def create_indexes(db):
    sessions = db["SearchSessions"]

    geo = sessions.create_index(
        [("location", "2dsphere")],
        name="location_2dsphere"
    )

    ttl = sessions.create_index(
        [("created_at", ASCENDING)],
        name="created_at_ttl_7200",
        expireAfterSeconds=7200
    )

    print(f"Created index: {geo}")
    print(f"Created index: {ttl}")


def main():
    if not MONGODB_URI:
        print("ERROR: MONGODB_URI is missing from .env")
        sys.exit(1)

    client = MongoClient(MONGODB_URI)
    try:
        client.admin.command("ping")
        db = client[DB_NAME]
        print(f"Connected to MongoDB database: {DB_NAME}\n")

        # This script intentionally does not drop collections.
        # Run against a clean database for predictable counts.
        seed_amenities(db["PropertyAmenities"])
        seed_reviews(db["PropertyReviews"])
        seed_search_sessions(db["SearchSessions"])
        create_indexes(db)

        print("\nSeeding complete.")
        print(f"PropertyAmenities: {db['PropertyAmenities'].count_documents({}):,}")
        print(f"PropertyReviews: {db['PropertyReviews'].count_documents({}):,}")
        print(f"SearchSessions: {db['SearchSessions'].count_documents({}):,}")

    finally:
        client.close()


if __name__ == "__main__":
    main()
