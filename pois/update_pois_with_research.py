#!/usr/bin/env python3
"""
Update POIs_augmented.csv with researched data
Preserves all coordinates and names - only fills in missing data fields
"""

import csv

# Research data compiled from the research agent's findings
# Note: Row indices match Python list indices (rows[0] is header, rows[213] is line 214 of CSV file)
RESEARCH_DATA = {
    213: {  # Bridge Road Marina (New England Power Boats) - CSV line 214
        'Website': 'http://www.newenglandpowerboatservice.com/',
        'Telephone': '8023725131',
        'VHF': '',
        'Description': 'Located on Bridge Road in North Hero, this marina offers seasonal and transient dock slips with power, potable water, wi-fi, and bathroom facilities. Features powerboat rentals including water skis, wake boards, and tubes, with a gas dock and pump-out station.',
        'Fuel Available': 'TRUE',
        'Fuel Types': 'gasoline',
        'Ethanol Free': 'TRUE',
        'Total Slips': '',
        'Transient Slips': 'Available',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    215: {  # Dillenbeck Cabins - CSV line 216
        'Website': 'https://www.lakechamplaincabins.com/',
        'Telephone': '',
        'VHF': '',
        'Description': 'Rustic cabins located at 5460 Route 2, South Alburgh, directly across from Dillenbeck Bay on Lake Champlain. Year-round availability with various suites. Pet-friendly options available.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    216: {  # Goose Point Campground - CSV line 217
        'Website': 'https://goosepointcamp.com/',
        'Telephone': '8027963711',
        'VHF': '',
        'Description': 'Fun, friendly, and family-oriented campground on Lake Champlain offering boat launching and boat dock facilities. Features include swimming pool, playground, convenience store, and various camping amenities with amazing lake views.',
        'Fuel Available': 'FALSE',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': 'Seasonal and daily docks available',
        'Transient Slips': 'Daily docking available',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    217: {  # Alburgh RV Resort & Travel Sales - CSV line 218
        'Website': 'https://alburgrvresort.com/',
        'Telephone': '8027963733',
        'VHF': '',
        'Description': 'Full-service RV resort offering seasonal and overnight camping with RV sales. Located at 1 Alburg RV Resort, Alburgh VT. Features various amenities for RV campers and also offers trailer sales and rentals.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    219: {  # Camping MILLER - CSV line 220
        'Website': '',
        'Telephone': '14502942464',
        'VHF': '',
        'Description': 'Campground located in Saint-Georges-de-Clarenceville, Montérégie, Quebec, near Lake Champlain. Situated 8km from Venise-en-Québec and 675m from Lake Champlain.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    221: {  # Campbell's Bay Campground - CSV line 222
        'Website': 'https://www.campbellsbayvermont.com/',
        'Telephone': '8029997157',
        'VHF': '',
        'Description': 'Family-owned campground at 205 Campbell Bay Rd on Lake Champlain. 2026 season runs May 1 through October 3. Reservations open April 1 for campsites and boat rentals; cabin rentals open February 20, 2026.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    222: {  # Lakewood Campgrounds - CSV line 223
        'Website': '',
        'Telephone': '8028687270',
        'VHF': '',
        'Description': 'Large campground with 217 sites at 122 Champlain Street on the shores of Lake Champlain. Open May-October 1. Accepts tents and RVs up to 40 feet maximum length.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '40 feet (RVs)',
        'Min Depth': ''
    },
    224: {  # Champlain Valley Campground - CSV line 225
        'Website': 'https://smartus.cyou/champlain-valley-campground-6p7r5e',
        'Telephone': '8025245146',
        'VHF': '',
        'Description': 'Located at 600 Maquam Shore Road on the scenic shores of Lake Champlain. Established in 1994 and managed by Ann Bechard. Mailing address: PO Box 555, Swanton, VT 05488-0555.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    227: {  # Burton Island Marina - CSV line 228
        'Website': 'https://www.vtstateparks.com/parks/burton-island-marina',
        'Telephone': '8025246353',
        'VHF': '9,68',
        'Description': 'Vermont State Park marina accessible only by water, offering 100 slips with dockside electricity (30/50A) and 15 first-come, first-serve moorings. Features free pump-outs, boater bathrooms, and Burton Island Bistro for food and supplies.',
        'Fuel Available': 'FALSE',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '100',
        'Transient Slips': 'Available for vessels up to 65 feet',
        'Max Vessel Length': '65 feet',
        'Min Depth': '4.0 feet (dockside), 6.0 feet (approach)'
    },
    228: {  # Burton Island Bistro - CSV line 229
        'Website': 'https://www.facebook.com/burtonisland',
        'Telephone': '8025242212',
        'VHF': '',
        'Description': 'Small café and store on Burton Island State Park, accessible only by water via private boat or Island Runner ferry. Serves breakfast (9am-11am) and lunch (12pm-2pm), offering cold salads, to-go items, camping goods, beer, wine, and ice. Operating hours 8:30am-4:00pm.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    239: {  # The Sand Bar, Bar & Grill - CSV line 240
        'Website': 'https://sandbarvt.com/',
        'Telephone': '8023952076',
        'VHF': '',
        'Description': 'Lakefront restaurant and bar in South Hero offering casual dining with water views. Open Tuesday-Thursday 12pm-8pm, Friday-Saturday 12pm-9pm. Closed Monday and Sunday.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    240: {  # Apple Island Resort - CSV line 241
        'Website': 'https://appleislandresort.com/',
        'Telephone': '8023723800',
        'VHF': '',
        'Description': 'RV resort and mobile home community at 71 US-2, South Hero. Features park and stay facilities for RVs. Marina contact available at 802-372-3118. Offers both camping and marina services.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    243: {  # Pioneer Lakeshore Café - CSV line 244
        'Website': 'https://www.pioneerfoodvt.com/',
        'Telephone': '',
        'VHF': '',
        'Description': 'Counter-service café located in Malletts Bay on West Lakeshore Drive. Offers menu enhancements for 2026 season. Open Tuesday-Saturday 11am-8pm, closed Sunday and Monday.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    244: {  # New York Pizza Oven - CSV line 245
        'Website': 'https://nypovt.com/',
        'Telephone': '8026580925',
        'VHF': '',
        'Description': 'Locally owned New York-style pizza restaurant in the heart of Malletts Bay, established 2011. Offers handcrafted pizzas including Buffalo Chicken specialty, hot and cold subs, calzones, stromboli, and gluten-free cauliflower crust options. Open Monday-Sunday 11am-8pm with delivery, pickup, and dine-in service.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    245: {  # Rozzi's Lakeshore Tavern - CSV line 246
        'Website': 'https://www.rozzislakeshoretavern.com/',
        'Telephone': '8028632342',
        'VHF': '',
        'Description': 'Waterfront tavern and restaurant on West Lakeshore Drive offering American traditional fare and nightlife. Open Monday-Friday 11am-9pm, Saturday-Sunday 9am-9pm.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    246: {  # Broadacres Creemee - CSV line 247
        'Website': '',
        'Telephone': '8026524646',
        'VHF': '',
        'Description': 'Vermont soft-serve ice cream stand (creemees) with hard ice cream and quick food items. Two locations in Colchester: 749 W Lakeshore Dr and 133 Broad Acres Dr. Seasonal operation typical for Vermont ice cream stands.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    247: {  # Marina At Marble Island - CSV line 248
        'Website': 'https://marinamarbleisland.com/',
        'Telephone': '8028626804',
        'VHF': '',
        'Description': 'Marina facility in Malletts Bay with scenic views and boating amenities including seasonal slips, hull wash, shrink wrap, pool, and haul services. Harbor house facilities include private restroom suites and member grilling area.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    249: {  # Malletts Bay Campground - CSV line 250
        'Website': 'https://mallettsbaycampground.com/',
        'Telephone': '8028636980',
        'VHF': '',
        'Description': 'Located at 88 Malletts Bay Campground in Colchester near Burlington. Open May 1 - October 15. Offers camping sites with access to Malletts Bay on Lake Champlain.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    251: {  # The Pickled Perch - CSV line 252
        'Website': 'https://thepickledperch.com/',
        'Telephone': '8024971647',
        'VHF': '',
        'Description': 'American bistro-style restaurant located on Malletts Bay at Blakely Road, offering New American cuisine with lake views. Seasonal hours, typically closed Monday and Tuesday. Known for quality food and waterfront dining experience.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    256: {  # St. John's Club - CSV line 257
        'Website': 'https://saintjohnsclub.com/',
        'Telephone': '8028649778',
        'VHF': '',
        'Description': 'Social club and restaurant on Central Avenue in Burlington\'s South End offering comfort food and sports bar atmosphere. Contact for private events at saintjohnsclub@gmail.com.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    260: {  # Lake Champlain Yacht Club - CSV line 261
        'Website': 'https://lcyc.info/',
        'Telephone': '8029853372',
        'VHF': '',
        'Description': 'Established in 1887, this member-run yacht club is located in a sheltered cove on the southwest shore of Shelburne Bay. Promotes boating and sailing on Lake Champlain with focus on racing, cruising, and education. Features Wednesday Night racing series, weekend lake races, and educational programs.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': 'Moorings available (members)',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    264: {  # Charlotte Sailing Center - CSV line 265 - CLOSED
        'Website': 'https://www.charlottesailingcenter.com/',
        'Telephone': '8024254106',
        'VHF': '9',
        'Description': 'CLOSED AS OF 2025. Previously operated for 20 years offering sailing instruction, boat rentals, marina services with docks and moorings. Lake Champlain Transportation (property owner) did not renew the lease, forcing closure.',
        'Fuel Available': 'FALSE',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '10 slips, 25 moorings (prior to closure)',
        'Transient Slips': '',
        'Max Vessel Length': '39 feet (12 meters)',
        'Min Depth': '6.5 feet (2 meters)'
    },
    275: {  # Red Mill Restaurant - CSV line 276
        'Website': 'https://basinharbor.com',
        'Telephone': '8024752317',
        'VHF': '',
        'Description': 'Casual, pub-style restaurant at Basin Harbor Club featuring local, fresh signature food and drink. Seasonal operation from late May to mid-October. Hours when open: Monday-Thursday 11:30am-3pm & 5pm-9pm, Friday-Saturday 11:30am-3pm & 5pm-10pm, Sunday 11:30am-3pm & 5pm-9pm.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    281: {  # D.A.R. State Park - CSV line 282
        'Website': 'https://fpr.vermont.gov/dar-state-park',
        'Telephone': '8027592354',
        'VHF': '',
        'Description': 'Vermont State Park located at 6750 VT RT 17 W on the shores of Lake Champlain in Addison. Offers 47 tent/RV sites and 24 lean-to sites. Managed by Vermont Department of Forests, Parks and Recreation. Reservations: 888-409-7579.',
        'Fuel Available': '',
        'Fuel Types': '',
        'Ethanol Free': '',
        'Total Slips': '',
        'Transient Slips': '',
        'Max Vessel Length': '',
        'Min Depth': ''
    },
    282: {  # Champlain Bridge Marina - CSV line 283
        'Website': 'http://sayahoy.com/',
        'Telephone': '8027592049',
        'VHF': '',
        'Description': 'Located on Route 17 West in Addison, this marina offers seasonal and transient boat dockage by day, week, or month. Amenities include fuel dock, bath houses, restrooms, showers, Wi-Fi, pump-out service, masting crane, and indoor storage.',
        'Fuel Available': 'TRUE',
        'Fuel Types': 'gasoline',
        'Ethanol Free': '',
        'Total Slips': '120 berths',
        'Transient Slips': '20 transient docks at $2.00/foot',
        'Max Vessel Length': '60 feet',
        'Min Depth': '6-7 feet'
    }
}


def update_csv():
    """Update POIs_augmented.csv with researched data"""
    input_file = 'POIs_augmented.csv'
    output_file = 'POIs_augmented_updated.csv'

    # Read the CSV with error handling for encoding issues
    with open(input_file, 'r', encoding='utf-8', errors='replace') as f:
        reader = csv.reader(f)
        rows = list(reader)

    # Get header row to find column indices
    header = rows[0]

    # Find column indices
    col_indices = {
        'Website': header.index('Website'),
        'Telephone': header.index('Telephone'),
        'VHF': header.index('VHF'),
        'Description': header.index('Description'),
        'Fuel Available': header.index('Fuel Available'),
        'Fuel Types': header.index('Fuel Types'),
        'Ethanol Free': header.index('Ethanol Free'),
        'Total Slips': header.index('Total Slips'),
        'Transient Slips': header.index('Transient Slips'),
        'Max Vessel Length': header.index('Max Vessel Length'),
        'Min Depth': header.index('Min Depth')
    }

    # Update rows with research data
    updates_count = 0
    for row_num, data in RESEARCH_DATA.items():
        if row_num < len(rows):
            row = rows[row_num]

            # Only update if field is empty
            for field, value in data.items():
                if field in col_indices and value:
                    col_idx = col_indices[field]
                    # Only update if current value is empty
                    if col_idx < len(row) and not row[col_idx].strip():
                        row[col_idx] = value
                        updates_count += 1

    # Write updated CSV
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerows(rows)

    print(f"✓ Updated CSV written to {output_file}")
    print(f"✓ Made {updates_count} field updates across {len(RESEARCH_DATA)} POIs")
    print(f"✓ All coordinates and names preserved exactly as original")

    # Show summary of updates by POI
    print("\nUpdated POIs:")
    for row_num in sorted(RESEARCH_DATA.keys()):
        if row_num < len(rows):
            poi_name = rows[row_num][1]  # Name is in column 1
            print(f"  Row {row_num}: {poi_name}")


if __name__ == '__main__':
    update_csv()
