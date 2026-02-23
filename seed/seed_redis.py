import redis
import json

r = redis.Redis(host="localhost", port=6379,
                db=0, decode_responses=True)

# Real Chennai wards with actual locality names
# Format: ward_key, category, officer details

MUNICIPALITIES = [

    # ── ZONE 13 — Sholinganallur ──────────────────────────────────
    ("ward_173", "roads", {
        "ward": "Ward 173", "zone": "Zone 13",
        "area": "Perungudi",
        "department": "Roads & PWD",
        "officer_name": "Er. Suresh Kumar",
        "email": "ward173.roads@gcc.gov.in",
        "phone": "044-25384520",
        "depot_address": "GCC Depot, Perungudi Industrial Estate, Chennai 600096",
        "lat": 12.9611, "lng": 80.2407
    }),
    ("ward_173", "water", {
        "ward": "Ward 173", "zone": "Zone 13",
        "area": "Perungudi",
        "department": "CMWSSB Zone 13",
        "officer_name": "Er. Priya Rajan",
        "email": "cmwssb.zone13@tn.gov.in",
        "phone": "044-24918765",
        "depot_address": "CMWSSB Office, Sholinganallur, Chennai 600119",
        "lat": 12.9010, "lng": 80.2279
    }),
    ("ward_173", "garbage", {
        "ward": "Ward 173", "zone": "Zone 13",
        "area": "Perungudi",
        "department": "Solid Waste Management",
        "officer_name": "Mr. Karthik Selvam",
        "email": "swm.zone13@gcc.gov.in",
        "phone": "044-25387641",
        "depot_address": "SWM Yard, Perungudi, Chennai 600096",
        "lat": 12.9611, "lng": 80.2407
    }),
    ("ward_173", "electricity", {
        "ward": "Ward 173", "zone": "Zone 13",
        "area": "Perungudi",
        "department": "TANGEDCO South Chennai",
        "officer_name": "Mr. Ramesh Venkatesh",
        "email": "tangedco.south@tn.gov.in",
        "phone": "044-24918900",
        "depot_address": "TANGEDCO Sub-Station, Velachery, Chennai 600042",
        "lat": 12.9788, "lng": 80.2207
    }),

    # ── ZONE 13 — Sholinganallur ──────────────────────────────────
    ("ward_174", "roads", {
        "ward": "Ward 174", "zone": "Zone 13",
        "area": "Sholinganallur",
        "department": "Roads & PWD",
        "officer_name": "Er. Anil Mehta",
        "email": "ward174.roads@gcc.gov.in",
        "phone": "044-24500123",
        "depot_address": "GCC Depot, Sholinganallur, Chennai 600119",
        "lat": 12.9010, "lng": 80.2279
    }),
    ("ward_174", "water", {
        "ward": "Ward 174", "zone": "Zone 13",
        "area": "Sholinganallur",
        "department": "CMWSSB Zone 13",
        "officer_name": "Er. Deepa Krishnan",
        "email": "cmwssb.sholinganallur@tn.gov.in",
        "phone": "044-24500456",
        "depot_address": "CMWSSB Office, Sholinganallur, Chennai 600119",
        "lat": 12.9010, "lng": 80.2279
    }),

    # ── ZONE 12 — Adyar ──────────────────────────────────────────
    ("ward_155", "roads", {
        "ward": "Ward 155", "zone": "Zone 12",
        "area": "Adyar",
        "department": "Roads & PWD",
        "officer_name": "Er. Meena Sundaram",
        "email": "ward155.roads@gcc.gov.in",
        "phone": "044-24426789",
        "depot_address": "GCC Depot, Adyar, Chennai 600020",
        "lat": 13.0012, "lng": 80.2565
    }),
    ("ward_155", "water", {
        "ward": "Ward 155", "zone": "Zone 12",
        "area": "Adyar",
        "department": "CMWSSB Zone 12",
        "officer_name": "Er. Venkat Narayanan",
        "email": "cmwssb.adyar@tn.gov.in",
        "phone": "044-24427890",
        "depot_address": "CMWSSB Office, Adyar, Chennai 600020",
        "lat": 13.0012, "lng": 80.2565
    }),
    ("ward_155", "garbage", {
        "ward": "Ward 155", "zone": "Zone 12",
        "area": "Adyar",
        "department": "Solid Waste Management",
        "officer_name": "Mr. Senthil Kumar",
        "email": "swm.zone12@gcc.gov.in",
        "phone": "044-24428901",
        "depot_address": "SWM Yard, Adyar, Chennai 600020",
        "lat": 13.0012, "lng": 80.2565
    }),

    # ── ZONE 9 — Teynampet ───────────────────────────────────────
    ("ward_123", "roads", {
        "ward": "Ward 123", "zone": "Zone 9",
        "area": "T.Nagar",
        "department": "Roads & PWD",
        "officer_name": "Er. Rajesh Balaji",
        "email": "ward123.roads@gcc.gov.in",
        "phone": "044-24342345",
        "depot_address": "GCC Depot, T.Nagar, Chennai 600017",
        "lat": 13.0418, "lng": 80.2341
    }),
    ("ward_123", "water", {
        "ward": "Ward 123", "zone": "Zone 9",
        "area": "T.Nagar",
        "department": "CMWSSB Zone 9",
        "officer_name": "Er. Kavitha Mohan",
        "email": "cmwssb.tnagar@tn.gov.in",
        "phone": "044-24343456",
        "depot_address": "CMWSSB Office, T.Nagar, Chennai 600017",
        "lat": 13.0418, "lng": 80.2341
    }),
    ("ward_123", "electricity", {
        "ward": "Ward 123", "zone": "Zone 9",
        "area": "T.Nagar",
        "department": "TANGEDCO Central Chennai",
        "officer_name": "Mr. Anand Krishnamurthy",
        "email": "tangedco.central@tn.gov.in",
        "phone": "044-28591011",
        "depot_address": "TANGEDCO Sub-Station, T.Nagar, Chennai 600017",
        "lat": 13.0418, "lng": 80.2341
    }),

    # ── ZONE 8 — Anna Nagar ──────────────────────────────────────
    ("ward_97", "roads", {
        "ward": "Ward 97", "zone": "Zone 8",
        "area": "Anna Nagar",
        "department": "Roads & PWD",
        "officer_name": "Er. Subramaniam R",
        "email": "ward97.roads@gcc.gov.in",
        "phone": "044-26161234",
        "depot_address": "GCC Depot, Anna Nagar, Chennai 600040",
        "lat": 13.0843, "lng": 80.2101
    }),
    ("ward_97", "water", {
        "ward": "Ward 97", "zone": "Zone 8",
        "area": "Anna Nagar",
        "department": "CMWSSB Zone 8",
        "officer_name": "Er. Lakshmi Priya",
        "email": "cmwssb.annanagar@tn.gov.in",
        "phone": "044-26162345",
        "depot_address": "CMWSSB Office, Anna Nagar, Chennai 600040",
        "lat": 13.0843, "lng": 80.2101
    }),
    ("ward_97", "garbage", {
        "ward": "Ward 97", "zone": "Zone 8",
        "area": "Anna Nagar",
        "department": "Solid Waste Management",
        "officer_name": "Mr. Dinesh Babu",
        "email": "swm.zone8@gcc.gov.in",
        "phone": "044-26163456",
        "depot_address": "SWM Yard, Anna Nagar West, Chennai 600040",
        "lat": 13.0843, "lng": 80.2101
    }),

    # ── ZONE 6 — Ambattur ────────────────────────────────────────
    ("ward_72", "roads", {
        "ward": "Ward 72", "zone": "Zone 6",
        "area": "Ambattur",
        "department": "Roads & PWD",
        "officer_name": "Er. Murali Krishnan",
        "email": "ward72.roads@gcc.gov.in",
        "phone": "044-26580123",
        "depot_address": "GCC Depot, Ambattur Industrial Estate, Chennai 600058",
        "lat": 13.1143, "lng": 80.1548
    }),
    ("ward_72", "water", {
        "ward": "Ward 72", "zone": "Zone 6",
        "area": "Ambattur",
        "department": "CMWSSB Zone 6",
        "officer_name": "Er. Saranya Devi",
        "email": "cmwssb.ambattur@tn.gov.in",
        "phone": "044-26581234",
        "depot_address": "CMWSSB Office, Ambattur, Chennai 600058",
        "lat": 13.1143, "lng": 80.1548
    }),

    # ── ZONE 10 — Kodambakkam ────────────────────────────────────
    ("ward_134", "roads", {
        "ward": "Ward 134", "zone": "Zone 10",
        "area": "Velachery",
        "department": "Roads & PWD",
        "officer_name": "Er. Prakash Sundaram",
        "email": "ward134.roads@gcc.gov.in",
        "phone": "044-22431234",
        "depot_address": "GCC Depot, Velachery, Chennai 600042",
        "lat": 12.9788, "lng": 80.2207
    }),
    ("ward_134", "water", {
        "ward": "Ward 134", "zone": "Zone 10",
        "area": "Velachery",
        "department": "CMWSSB Zone 10",
        "officer_name": "Er. Nithya Lakshmi",
        "email": "cmwssb.velachery@tn.gov.in",
        "phone": "044-22432345",
        "depot_address": "CMWSSB Office, Velachery, Chennai 600042",
        "lat": 12.9788, "lng": 80.2207
    }),
    ("ward_134", "electricity", {
        "ward": "Ward 134", "zone": "Zone 10",
        "area": "Velachery",
        "department": "TANGEDCO South Chennai",
        "officer_name": "Mr. Ganesan T",
        "email": "tangedco.velachery@tn.gov.in",
        "phone": "044-22433456",
        "depot_address": "TANGEDCO Sub-Station, Velachery, Chennai 600042",
        "lat": 12.9788, "lng": 80.2207
    }),

    # ── ZONE 5 — Royapuram ───────────────────────────────────────
    ("ward_57", "roads", {
        "ward": "Ward 57", "zone": "Zone 5",
        "area": "Tondiarpet",
        "department": "Roads & PWD",
        "officer_name": "Er. Baskaran M",
        "email": "ward57.roads@gcc.gov.in",
        "phone": "044-25918765",
        "depot_address": "GCC Depot, Tondiarpet, Chennai 600081",
        "lat": 13.1211, "lng": 80.2917
    }),
    ("ward_57", "water", {
        "ward": "Ward 57", "zone": "Zone 5",
        "area": "Tondiarpet",
        "department": "CMWSSB Zone 5",
        "officer_name": "Er. Anitha Ravi",
        "email": "cmwssb.royapuram@tn.gov.in",
        "phone": "044-25919876",
        "depot_address": "CMWSSB Office, Royapuram, Chennai 600013",
        "lat": 13.1211, "lng": 80.2917
    }),

    # ── ZONE 11 — Guindy ─────────────────────────────────────────
    ("ward_145", "roads", {
        "ward": "Ward 145", "zone": "Zone 11",
        "area": "Guindy",
        "department": "Roads & PWD",
        "officer_name": "Er. Vijaya Lakshmi",
        "email": "ward145.roads@gcc.gov.in",
        "phone": "044-22501234",
        "depot_address": "GCC Depot, Guindy Industrial Estate, Chennai 600032",
        "lat": 13.0067, "lng": 80.2206
    }),
    ("ward_145", "water", {
        "ward": "Ward 145", "zone": "Zone 11",
        "area": "Guindy",
        "department": "CMWSSB Zone 11",
        "officer_name": "Er. Chandrasekhar N",
        "email": "cmwssb.guindy@tn.gov.in",
        "phone": "044-22502345",
        "depot_address": "CMWSSB Office, Guindy, Chennai 600032",
        "lat": 13.0067, "lng": 80.2206
    }),
    ("ward_145", "garbage", {
        "ward": "Ward 145", "zone": "Zone 11",
        "area": "Guindy",
        "department": "Solid Waste Management",
        "officer_name": "Mr. Palani Swami",
        "email": "swm.zone11@gcc.gov.in",
        "phone": "044-22503456",
        "depot_address": "SWM Yard, Guindy, Chennai 600032",
        "lat": 13.0067, "lng": 80.2206
    }),
]


def seed():
    count = 0
    for ward_key, category, data in MUNICIPALITIES:
        key = f"municipality:{ward_key}:{category}"
        r.set(key, json.dumps(data))
        count += 1
        print(f"  Seeded: {key} -> {data['officer_name']} ({data['email']})")

    print(f"\n  Total records seeded: {count}")
    print(f"  Zones covered: 5,6,8,9,10,11,12,13")
    print(f"  Areas: Perungudi, Sholinganallur, Adyar, T.Nagar,")
    print(f"          Anna Nagar, Ambattur, Velachery, Tondiarpet, Guindy")


if __name__ == "__main__":
    seed()
