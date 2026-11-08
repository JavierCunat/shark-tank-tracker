"""Builds seed/season1.csv from the Season 1 episode data.

Run:  python seed/build_season1.py
"""
import csv
import re
from pathlib import Path

SOURCE = "https://en.wikipedia.org/wiki/Shark_Tank_season_1"
SEASON = 1

# (episode_in_season, prod_code, air_date)
EPISODES = [
    (1, "101", "2009-08-09"),
    (2, "102", "2009-08-16"),
    (3, "103", "2009-08-23"),
    (4, "104", "2009-08-30"),
    (5, "105", "2009-09-06"),
    (6, "106", "2009-09-13"),
    (7, "107", "2009-09-29"),
    (8, "108", "2009-10-06"),
    (9, "109", "2009-10-13"),
    (10, "111", "2009-10-20"),
    (11, "112", "2010-01-08"),
    (12, "113", "2010-01-15"),
    (13, "114", "2010-01-29"),
    (14, "110", "2010-02-05"),
]

# Each pitch: (episode_in_season, company, description, deal_made, sharks, amount_usd, equity_pct, deal_notes)
# amount/equity are the ON-AIR terms. "ask_amount"/"ask_equity" are left blank (not on Wikipedia; backfill from Shark Tank Blog).
PITCHES = [
    # Episode 1
    (1, "Mr. Tod's Pie Factory", "Pie company", True, "Daymond John; Barbara Corcoran", 460000, 50, ""),
    (1, "Ionic Ear", "Implantable Bluetooth device requiring surgery", False, "", None, None, ""),
    (1, "WiSpots", "Electronic hand-held device for waiting rooms", False, "", None, None, ""),
    (1, "Ava the Elephant", "Elephant-shaped device that helps parents give small children oral medicine (pitched as Emmy the Elephant)", True, "Barbara Corcoran", 50000, 55, "Pitched as Emmy the Elephant; later trademarked as Ava the Elephant"),
    (1, "College Foxes Packing Boxes", "Packing and organizing service spun off from College Hunks Hauling Junk", False, "", None, None, ""),
    # Episode 2
    (2, "Crooked Jaw", "Mixed martial arts clothing line", False, "", None, None, ""),
    (2, "Lifebelt", "Device that prevents a car from starting until the seat belt is fastened", False, "", None, None, ""),
    (2, "A Perfect Pear", "Gourmet food business", True, "Kevin Harrington; Robert Herjavec", 500000, 50, ""),
    (2, "Sticky Note Holder", "Post-it note arm for laptops", False, "", None, None, ""),
    (2, "Classroom Jams", "Musical way to teach students Shakespeare", True, "Kevin Harrington; Daymond John; Kevin O'Leary; Barbara Corcoran; Robert Herjavec", 250000, 100, "Sold company to all five sharks; 5% royalty in perpetuity to founder"),
    # Episode 3
    (3, "Turbobaster", "Cooking device", True, "Kevin Harrington", 35000, 100, "Sold company; 2% royalty in perpetuity to founder"),
    (3, "Chopstick Art", "Household items made from recycled chopsticks", False, "", None, None, ""),
    (3, "Stress Free Kids", "Books using stress-relief techniques to calm kids to sleep", True, "Barbara Corcoran", 250000, 50, ""),
    (3, "50 State Capitals in 50 Minutes", "Flashcards to memorize US state capitals", False, "", None, None, ""),
    (3, "Voyage Air Guitar", "Guitar that folds into a backpack", False, "", None, None, "Founder returned later and eventually agreed to a deal off-air"),
    # Episode 4
    (4, "Gift Card Rescue", "Website that buys and resells unused gift cards", True, "Kevin O'Leary; Robert Herjavec", 200000, 50, ""),
    (4, "Soul's Calling", "Inspirational accessories and gift items", False, "", None, None, ""),
    (4, "Coffee Brand Gifts", "Holds patents to put 'Cappuccino', 'Coffee' and 'Java' on plush toys", False, "", None, None, ""),
    (4, "Graffiti Removal Services", "Graffiti removal service franchise", False, "", None, None, ""),
    (4, "Coverplay", "Slip cover for children's travel play yards", True, "Barbara Corcoran", 350000, 40, ""),
    # Episode 5
    (5, "Body Jac", "Fitness machine that makes pushups easier", True, "Barbara Corcoran", 180000, 50, ""),
    (5, "Face Blok", "Stylized surgical face masks", False, "", None, None, ""),
    (5, "Granola Gourmet", "Granola bars suitable for diabetics", False, "", None, None, ""),
    (5, "Good Grief Celebrations", "Funeral concierge service", False, "", None, None, ""),
    (5, "My Therapy Journal", "Website for journaling and tracking emotional state", True, "Kevin O'Leary; Robert Herjavec", 80000, 51, ""),
    # Episode 6
    (6, "Element Bars", "Custom energy bars", True, "Kevin Harrington", 150000, 30, "Plus 4% royalty in perpetuity"),
    (6, "The Fizz", "Root beer float attachment that screws onto soda bottles", False, "", None, None, ""),
    (6, "Underease Underwear", "Protective underwear for flatulence", False, "", None, None, ""),
    (6, "Kalyx", "Sports bras", False, "", None, None, ""),
    (6, "Pork Barrel BBQ", "Barbecue sauce and spice rub", True, "Barbara Corcoran", 50000, 50, ""),
    # Episode 7
    (7, "Grill Charms", "Stainless steel tags that mark how different meats are cooked on the grill", True, "Robert Herjavec", 50000, 25, ""),
    (7, "FunHouse", "Entertainment venue in Times Square, New York", False, "", None, None, ""),
    (7, "Boogie Box Fitness", "Aerobics fitness programs, classes and DVDs", False, "", None, None, ""),
    (7, "Soy-Yer-Dough", "Soybean-based modeling dough for people with wheat allergies", True, "Daymond John; Kevin O'Leary; Robert Herjavec", 300000, 51, ""),
    # Episode 8
    (8, "Notehall", "Website that buys and sells college class notes and study guides", True, "Barbara Corcoran", 90000, 25, ""),
    (8, "Treasure Chest Pets", "Children's organizer designed like a stuffed toy", True, "Barbara Corcoran; Daymond John", 150000, 60, ""),
    (8, "Throx", "Socks sold in sets of three", False, "", None, None, ""),
    (8, "Washed Up Hollywood", "Belt and belt buckle manufacturer", False, "", None, None, ""),
    # Episode 9
    (9, "Chill Soda", "Healthy soda", True, "Barbara Corcoran", 50000, 20, ""),
    (9, "Cornucopia", "Veterinarian-created pet food claimed to extend a pet's life", False, "", None, None, ""),
    (9, "VirtuSphere", "Large sphere a person walks inside to experience virtual reality", False, "", None, None, ""),
    (9, "Gayla Bentley Fashion", "Fashion line for women over size 12", True, "Barbara Corcoran; Daymond John", 250000, 50, ""),
    # Episode 10 (prod 111)
    (10, "The Bobble Place", "Custom bobblehead doll company", False, "", None, None, ""),
    (10, "Mr. Poncho", "Poncho for mobile devices to avoid tangled headphones", False, "", None, None, ""),
    (10, "Uroclub", "Portable urinal hidden in a golf club, created by a urologist", True, "Kevin Harrington", 25000, 70, ""),
    (10, "Jump Forward", "Technology for high-school-to-college sports recruiting", True, "Kevin O'Leary; Robert Herjavec", 600000, 50, ""),
    # Episode 11 (prod 112)
    (11, "Romp n' Roll", "Children's entertainment center franchise", False, "", None, None, ""),
    (11, "Hells Bells", "Helmet company with a patented method for 3-D designs", True, "Daymond John", 200000, 50, ""),
    (11, "The Twister", "Golf ball cleaner", False, "", None, None, ""),
    (11, "The Chef in Black", "Dried Chinese salad dressing", True, "Barbara Corcoran", 50000, 35, ""),
    (11, "Ink Flip", "Mail-order printer ink refill service", False, "", None, None, ""),
    # Episode 12 (prod 113)
    (12, "The Factionist", "Environmentally friendly T-shirt line", False, "", None, None, ""),
    (12, "Podillow", "Tanning and massage pillow", False, "", None, None, ""),
    (12, "Wee Can Shop", "Gift shop for children", False, "", None, None, ""),
    (12, "Grease Monkey Wipes", "Cleaning and degreasing wet wipes", True, "Barbara Corcoran", 40000, 40, ""),
    # Episode 13 (prod 114)
    (13, "Lipstix Remix", "Lipstick mold that combines used lipsticks into a new stick", True, "Barbara Corcoran; Daymond John; Kevin Harrington", 105000, 50, ""),
    (13, "Captain Ice Cream", "Ice cream vending business", False, "", None, None, ""),
    (13, "Caffeindicator", "Decaf coffee testing system on sweetener packets", True, "Kevin O'Leary", 200000, 50, ""),
    (13, "Legal Grind", "Coffee shop that provides legal services", False, "", None, None, ""),
    # Episode 14 (prod 110)
    (14, "Send A Ball", "Greeting balls sent through the mail", False, "", None, None, ""),
    (14, "Qubits", "Bendable construction toy", True, "Daymond John", 90000, 51, ""),
    (14, "Pillars of Slippers", "In-home shoe party franchise", False, "", None, None, ""),
    (14, "Llama Brew", "Liquid llama fertilizer", False, "", None, None, ""),
    (14, "Nubrella", "Wearable umbrella", True, "Daymond John; Kevin Harrington", 200000, 25, ""),
]

FIELDS = [
    "slug", "company", "description", "season", "episode_in_season", "prod_code", "air_date",
    "ask_amount_usd", "ask_equity_pct",
    "deal_on_air", "deal_sharks", "deal_amount_usd", "deal_equity_pct", "deal_notes",
    "source_url",
]


def slugify(name: str) -> str:
    s = name.lower().replace("'", "")
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s


def main() -> None:
    ep_by_num = {e[0]: e for e in EPISODES}
    out = Path(__file__).parent / "season1.csv"
    seen = set()
    with out.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=FIELDS)
        w.writeheader()
        for ep, company, desc, deal, sharks, amount, equity, notes in PITCHES:
            slug = slugify(company)
            assert slug not in seen, f"duplicate slug {slug}"
            seen.add(slug)
            _, prod, air = ep_by_num[ep]
            w.writerow({
                "slug": slug,
                "company": company,
                "description": desc,
                "season": SEASON,
                "episode_in_season": ep,
                "prod_code": prod,
                "air_date": air,
                "ask_amount_usd": "",
                "ask_equity_pct": "",
                "deal_on_air": "true" if deal else "false",
                "deal_sharks": sharks,
                "deal_amount_usd": amount if amount is not None else "",
                "deal_equity_pct": equity if equity is not None else "",
                "deal_notes": notes,
                "source_url": SOURCE,
            })
    print(f"wrote {len(PITCHES)} pitches across {len(EPISODES)} episodes -> {out}")


if __name__ == "__main__":
    main()
