"""
enrich_champions_vehicle.py
----------------------------
Enriches the Klaviyo Champions CSV with vehicle data parsed from purchase history.

Data sources (priority order):
  1. ConnectedBusiness parquets (cb_customers -> cb_orders -> cb_order_lines) — 100% coverage
  2. Rithum/ChannelAdvisor combined orders parquet — supplementary, ~6.6% coverage but
     richer product titles for the Amazon/eBay orders captured there

Output: data/exports/klaviyo_champions_enriched.csv
"""

import re
import json
from pathlib import Path
from collections import defaultdict, Counter
from typing import Optional, Dict, List

import pandas as pd

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE = Path(__file__).resolve().parent.parent
CHAMPIONS_CSV   = BASE / "data/exports/klaviyo_champions.csv"
CB_CUSTOMERS    = BASE / "data/raw/cb_customers.parquet"
CB_ORDERS       = BASE / "data/raw/cb_orders.parquet"
CB_ORDER_LINES  = BASE / "data/raw/cb_order_lines.parquet"
RITHUM_ORDERS   = BASE / "data/raw/rithum_orders_combined.parquet"
OUTPUT_CSV      = BASE / "data/exports/klaviyo_champions_enriched.csv"

# ---------------------------------------------------------------------------
# Make normalization: raw string (lowercase) -> canonical display name.
# None means "this is a model name, not a make" — skip as standalone make.
# ---------------------------------------------------------------------------
MAKE_NORMALIZE = {
    # Chevrolet variants
    "chevy":         "Chevrolet",
    "chevrolet":     "Chevrolet",
    "chev":          "Chevrolet",
    # Dodge/Ram
    "dodge":         "Dodge",
    "ram":           "Ram",
    # Ford
    "ford":          "Ford",
    # GMC
    "gmc":           "GMC",
    # Toyota
    "toyota":        "Toyota",
    "scion":         "Scion",
    # Nissan / Infiniti
    "nissan":        "Nissan",
    "infiniti":      "Infiniti",
    # Honda / Acura
    "honda":         "Honda",
    "acura":         "Acura",
    # Jeep
    "jeep":          "Jeep",
    # GM luxury/specialty
    "cadillac":      "Cadillac",
    "buick":         "Buick",
    "oldsmobile":    "Oldsmobile",
    "pontiac":       "Pontiac",
    "saturn":        "Saturn",
    "hummer":        "Hummer",
    # Chrysler / Mopar
    "chrysler":      "Chrysler",
    # Lincoln / Mercury
    "lincoln":       "Lincoln",
    "mercury":       "Mercury",
    # German
    "mercedes":      "Mercedes-Benz",
    "mercedes-benz": "Mercedes-Benz",
    "benz":          "Mercedes-Benz",
    "bmw":           "BMW",
    "audi":          "Audi",
    "volkswagen":    "Volkswagen",
    "vw":            "Volkswagen",
    "porsche":       "Porsche",
    # Japanese
    "subaru":        "Subaru",
    "kia":           "Kia",
    "hyundai":       "Hyundai",
    "lexus":         "Lexus",
    "mitsubishi":    "Mitsubishi",
    "isuzu":         "Isuzu",
    "suzuki":        "Suzuki",
    "mazda":         "Mazda",
    "acura":         "Acura",
    # Other
    "land rover":    "Land Rover",
    "volvo":         "Volvo",
    "jaguar":        "Jaguar",
    "mini":          "MINI",
}

# Set of known make tokens (lowercase single words) for fast membership test
KNOWN_MAKE_TOKENS = set(MAKE_NORMALIZE.keys()) | {
    "chevy", "gmc", "ram", "ford", "toyota", "nissan", "honda", "jeep",
    "dodge", "cadillac", "buick", "pontiac", "chevrolet", "subaru",
    "kia", "hyundai", "lexus", "mazda", "mitsubishi", "isuzu", "suzuki",
    "saturn", "chrysler", "hummer", "lincoln", "mercury", "audi", "bmw",
    "volkswagen", "vw", "mercedes", "benz", "volvo", "jaguar",
    "infiniti", "acura", "scion", "porsche",
}

# Model-to-make lookup: when a title omits the make (e.g. "07-13 Tundra/Sequoia")
# we resolve make from the model name.
MODEL_TO_MAKE = {
    # Toyota
    "tundra":      "Toyota",
    "tacoma":      "Toyota",
    "4runner":     "Toyota",
    "highlander":  "Toyota",
    "sequoia":     "Toyota",
    "sienna":      "Toyota",
    "rav4":        "Toyota",
    "camry":       "Toyota",
    "corolla":     "Toyota",
    "prius":       "Toyota",
    "avalon":      "Toyota",
    "venza":       "Toyota",
    "fj":          "Toyota",
    "land cruiser":"Toyota",
    # Ford
    "f150":        "Ford",
    "f-150":       "Ford",
    "f250":        "Ford",
    "f-250":       "Ford",
    "f350":        "Ford",
    "f-350":       "Ford",
    "f450":        "Ford",
    "f-450":       "Ford",
    "f550":        "Ford",
    "f-550":       "Ford",
    "f250/350":    "Ford",
    "f250/f350":   "Ford",
    "ranger":      "Ford",
    "explorer":    "Ford",
    "expedition":  "Ford",
    "excursion":   "Ford",
    "escape":      "Ford",
    "edge":        "Ford",
    "flex":        "Ford",
    "bronco":      "Ford",
    "mustang":     "Ford",
    "fusion":      "Ford",
    "e150":        "Ford",
    "e250":        "Ford",
    "e350":        "Ford",
    "e-150":       "Ford",
    "e-250":       "Ford",
    "e-350":       "Ford",
    "transit":     "Ford",
    "maverick":    "Ford",
    "superduty":   "Ford",
    "super duty":  "Ford",
    # Chevrolet / GMC
    "silverado":   "Chevrolet",
    "sierra":      "GMC",
    "tahoe":       "Chevrolet",
    "suburban":    "Chevrolet",
    "avalanche":   "Chevrolet",
    "colorado":    "Chevrolet",
    "canyon":      "GMC",
    "blazer":      "Chevrolet",
    "trailblazer": "Chevrolet",
    "equinox":     "Chevrolet",
    "traverse":    "Chevrolet",
    "impala":      "Chevrolet",
    "malibu":      "Chevrolet",
    "camaro":      "Chevrolet",
    "corvette":    "Chevrolet",
    "express":     "Chevrolet",
    "s10":         "Chevrolet",
    "s-10":        "Chevrolet",
    "c10":         "Chevrolet",
    "c/k":         "Chevrolet",
    "ck":          "Chevrolet",
    "yukon":       "GMC",
    "envoy":       "GMC",
    "acadia":      "GMC",
    "terrain":     "GMC",
    "jimmy":       "GMC",
    "denali":      "GMC",
    # Dodge / Ram
    "ram 1500":    "Ram",
    "ram 2500":    "Ram",
    "ram 3500":    "Ram",
    "dakota":      "Dodge",
    "durango":     "Dodge",
    "charger":     "Dodge",
    "challenger":  "Dodge",
    "magnum":      "Dodge",
    "caravan":     "Dodge",
    "nitro":       "Dodge",
    "journey":     "Dodge",
    "viper":       "Dodge",
    # Jeep
    "wrangler":    "Jeep",
    "cherokee":    "Jeep",
    "grand cherokee": "Jeep",
    "commander":   "Jeep",
    "liberty":     "Jeep",
    "compass":     "Jeep",
    "patriot":     "Jeep",
    "gladiator":   "Jeep",
    # Nissan
    "frontier":    "Nissan",
    "pathfinder":  "Nissan",
    "xterra":      "Nissan",
    "armada":      "Nissan",
    "titan":       "Nissan",
    "murano":      "Nissan",
    "rogue":       "Nissan",
    "altima":      "Nissan",
    "maxima":      "Nissan",
    "sentra":      "Nissan",
    # Honda
    "ridgeline":   "Honda",
    "pilot":       "Honda",
    "passport":    "Honda",
    "cr-v":        "Honda",
    "crv":         "Honda",
    "civic":       "Honda",
    "accord":      "Honda",
    "element":     "Honda",
    "odyssey":     "Honda",
    # Cadillac / GM Luxury
    "escalade":    "Cadillac",
    "srx":         "Cadillac",
    "cts":         "Cadillac",
    "dts":         "Cadillac",
    "mdx":         "Acura",
    "rdx":         "Acura",
    "tsx":         "Acura",
    "tlx":         "Acura",
    # Hyundai / Kia
    "sorento":     "Kia",
    "sportage":    "Kia",
    "telluride":   "Kia",
    "soul":        "Kia",
    "santa fe":    "Hyundai",
    "tucson":      "Hyundai",
    "sonata":      "Hyundai",
    "elantra":     "Hyundai",
    "genesis":     "Hyundai",
    # Subaru
    "outback":     "Subaru",
    "forester":    "Subaru",
    "impreza":     "Subaru",
    "legacy":      "Subaru",
    "wrx":         "Subaru",
    "crosstrek":   "Subaru",
    # Mazda
    "protege":     "Mazda",
    "cx-5":        "Mazda",
    "cx-7":        "Mazda",
    "cx-9":        "Mazda",
    "mazda3":      "Mazda",
    "mazda6":      "Mazda",
    "b-series":    "Mazda",
    # Lexus
    "rx":          "Lexus",
    "lx":          "Lexus",
    "gx":          "Lexus",
    "is250":       "Lexus",
    "is350":       "Lexus",
    "gs":          "Lexus",
    "ls":          "Lexus",
    # Other
    "touareg":     "Volkswagen",
    "jetta":       "Volkswagen",
    "golf":        "Volkswagen",
    "passat":      "Volkswagen",
    "tiguan":      "Volkswagen",
    "a4":          "Audi",
    "a6":          "Audi",
    "q5":          "Audi",
    "q7":          "Audi",
    "3 series":    "BMW",
    "5 series":    "BMW",
    "x3":          "BMW",
    "x5":          "BMW",
    "e-class":     "Mercedes-Benz",
    "c-class":     "Mercedes-Benz",
    "ml":          "Mercedes-Benz",
    "gl":          "Mercedes-Benz",
    "w211":        "Mercedes-Benz",
    "300":         "Chrysler",
    "300c":        "Chrysler",
    "lincoln":     "Lincoln",
    "navigator":   "Lincoln",
    "town car":    "Lincoln",
    "mkx":         "Lincoln",
    # Pontiac
    "grand prix":  "Pontiac",
    "g6":          "Pontiac",
    "solstice":    "Pontiac",
    # Saturn
    "vue":         "Saturn",
    # Hummer
    "h2":          "Hummer",
    "h3":          "Hummer",
    # Mitsubishi
    "eclipse":     "Mitsubishi",
    "galant":      "Mitsubishi",
    "lancer":      "Mitsubishi",
    "outlander":   "Mitsubishi",
    "montero":     "Mitsubishi",
    # Isuzu
    "trooper":     "Isuzu",
    "rodeo":       "Isuzu",
    "axiom":       "Isuzu",
}

# Words that mean this is NOT a vehicle-specific product
UNIVERSAL_KEYWORDS = re.compile(
    r"\buniversal\b"
    r"|\broof rack cross bar\b"
    r"|\breturn label\b"
    r"|\blens scratch\b"
    r"|\bwater proof car cover\b"
    r"|\bcar cover\b"
    r"|\bball mount\b.*\buniversal\b"
    r"|\b4700\b",            # dimension strings like "4700*1800*1500"
    re.IGNORECASE,
)

# Noise words that appear right after the year and should not be treated as a make
NOISE_AFTER_YEAR = re.compile(
    r"^(?:class|style|series|model|only|fits?|for|up|stainless|steel|alumi|"
    r"chrome|black|matte|glossy|oem|led|halo|projector|front|rear|side|"
    r"compatible|with|excluding|excl|includes?|not|fit|fits?)\b",
    re.IGNORECASE,
)


def expand_year(y_str: str) -> int:
    """Convert 2-digit year string to 4-digit int. 00-29 -> 2000s, 30-99 -> 1900s."""
    y = int(y_str)
    if y <= 29:
        return 2000 + y
    if y <= 99:
        return 1900 + y
    return y


def normalize_make(raw: str) -> Optional[str]:
    """Normalize a raw make string to canonical display name. None if unrecognized."""
    key = raw.strip().lower()
    # Direct lookup
    if key in MAKE_NORMALIZE:
        return MAKE_NORMALIZE[key]
    # Single-token fallback
    if key in KNOWN_MAKE_TOKENS:
        return raw.strip().title()
    return None


def clean_model(raw: str) -> str:
    """
    Normalize a model string: strip trailing junk words, cap at 2 tokens,
    title-case.  Preserve hyphenated model numbers (F-150, S-10, etc.).
    """
    # Strip leading/trailing whitespace and common punctuation
    model = raw.strip(" -/,.()")
    # Remove anything from an opening parenthesis onward — catches "(excl. ZR2)"
    model = re.sub(r"\s*\(.*", "", model).strip(" -/,.")
    # Drop tokens that are clearly not model names (junk description words)
    junk_re = re.compile(
        r"^(?:model|only|excl|excluding|not|fit|fits?|for|with|"
        r"compatible|stainless|steel|chrome|black|matte|glossy|oem|"
        r"led|halo|projector|front|rear|side|class|style|series|includes?|"
        r"cab|crew|extended|regular|super|short|long|bed|ft|feet|inch|in)$",
        re.IGNORECASE,
    )
    tokens = [t for t in model.split() if not junk_re.match(t)]
    if not tokens:
        return model
    # Cap at 2 meaningful tokens (e.g. "F-150", "Silverado 1500", "Grand Cherokee")
    # Drop trailing token if it's a bare number or decimal (bed dimensions, UPC fragments)
    if len(tokens) >= 2 and re.match(r"^\d+(?:\.\d+)?$", tokens[1]):
        tokens = tokens[:1]
    # Drop tokens that look like 2-letter junk abbreviations (Sd, Ld, Hd alone)
    # but preserve known chassis codes and real abbreviations (S10, CK, etc.)
    filtered = []
    for i, tok in enumerate(tokens[:2]):
        if i > 0 and re.match(r"^[A-Za-z]{1,2}$", tok) and tok.lower() not in {
            "jk", "jl", "jt",       # Jeep Wrangler generations
            "ck", "gx", "rx", "lx", # Cadillac/Lexus codes
        }:
            break  # stop — this is a junk abbreviation
        filtered.append(tok)
    model = " ".join(filtered) if filtered else " ".join(tokens[:1])
    # Title-case but preserve all-caps abbreviations like F-150
    if model.isupper():
        return model
    return model.title()


def resolve_make_from_model(model_token: str) -> Optional[str]:
    """
    Given a model name that appeared without an explicit make, look up the
    make in MODEL_TO_MAKE.  Handles slash-separated combos like
    'Silverado/Sierra' by trying each part.
    """
    for part in re.split(r"[/,]", model_token):
        part = part.strip().lower()
        if part in MODEL_TO_MAKE:
            return MODEL_TO_MAKE[part]
        # Try without trailing digits  (e.g. "silverado1500" -> "silverado")
        part_stripped = re.sub(r"\d+$", "", part).strip()
        if part_stripped and part_stripped in MODEL_TO_MAKE:
            return MODEL_TO_MAKE[part_stripped]
    return None


def classify_category(title: str) -> Optional[str]:
    """Classify a product title into a coarse category string."""
    t = title.lower()
    checks = [
        (r"tonneau|roll.?up|bed cover|tri.fold",               "tonneau_cover"),
        (r"\bgrille?\b|front grill",                            "grille"),
        (r"bull.?guard|bull bar|brush guard",                   "bull_guard"),
        (r"running.?board|side.?step|step.?bar|\bnerf\b",       "running_boards"),
        (r"headlight|projector head|halo head",                 "headlights"),
        (r"tail.?light|tail lamp|tail brake",                   "taillights"),
        (r"window visor|vent visor|vent shade|rain.guard",      "window_visors"),
        (r"trailer hitch|tow hitch|hitch receiver",             "trailer_hitch"),
        (r"bumper lip|front lip|splitter",                      "bumper_lip"),
        (r"roof rack|roof basket|cargo rack",                   "roof_rack"),
        (r"side mirror|mirror cover",                           "mirror_covers"),
        (r"fender flare",                                       "fender_flares"),
        (r"mud flap|mud guard",                                 "mud_flaps"),
        (r"exhaust|muffler|cat.?back",                          "exhaust"),
        (r"shock|strut|lift kit|leveling kit",                  "suspension"),
        (r"floor mat|cargo mat|all.?weather mat",               "floor_mats"),
        (r"seat cover",                                         "seat_covers"),
        (r"light bar|led bar|work light",                       "light_bar"),
        (r"corner light|parking light|signal light",            "corner_lights"),
    ]
    for pattern, label in checks:
        if re.search(pattern, t):
            return label
    return None


# ---------------------------------------------------------------------------
# Core vehicle parser
# ---------------------------------------------------------------------------
# Pattern captures: prefix?, year_start, (year_end?), then the rest of title.
# We parse make+model from the rest manually so we can handle model-only titles.
_YEAR_LEAD = re.compile(
    r"""
    (?:                                     # optional leading prefix
        (?:fits?\s+|for\s+|fit\s+|
           topline\s+for\s+|tlaps\s+for\s+|
           stehlen\s+\S+\s+compatible\s+with\s+|
           compatible\s+with\s+)
    )?
    ((?:19|20)\d{2}|\b\d{2})               # GROUP 1: start year
    \s*[-]\s*
    ((?:19|20)\d{2}|\d{2})                 # GROUP 2: end year
    (?:[/]\d{2,4})?                         # optional "/2009" suffix — consumed, ignored
    \s+                                     # space before make/model
    (.+)                                    # GROUP 3: rest of title
    """,
    re.IGNORECASE | re.VERBOSE,
)

_SINGLE_YEAR_LEAD = re.compile(
    r"""
    (?:fits?\s+|for\s+|fit\s+|
       topline\s+for\s+|tlaps\s+for\s+|
       stehlen\s+\S+\s+compatible\s+with\s+|
       compatible\s+with\s+)?
    ((?:19|20)\d{2})                        # GROUP 1: 4-digit year
    (?:\+|-up)?                             # optional "+" or "-up"
    \s+
    (.+)                                    # GROUP 2: rest of title
    """,
    re.IGNORECASE | re.VERBOSE,
)


def _extract_make_model_from_rest(rest: str) -> Optional[tuple]:
    """
    Given the portion of a title after the year(s), extract (make, model).
    Returns (make_str, model_str) or None.

    Strategy:
    1. Try to find a known make token at the start of `rest`.
    2. If not found, check whether the first token is a known model (MODEL_TO_MAKE).
    3. If neither, return None — don't guess.
    """
    rest = rest.strip()
    if not rest:
        return None

    # Strip common junk prefixes that appear after the year
    rest = re.sub(
        r"^(?:UP\s+|ONLY\s+|AND\s+NEWER\s+)",
        "",
        rest,
        flags=re.IGNORECASE,
    )

    # Tokenize on spaces (preserve hyphenated tokens)
    tokens = rest.split()
    if not tokens:
        return None

    # --- Strategy 1: leading make token ---
    # Try 2-word make first ("Land Rover"), then 1-word
    make = None
    model_start_idx = 0

    if len(tokens) >= 2:
        two_word = (tokens[0] + " " + tokens[1]).lower()
        if two_word in MAKE_NORMALIZE:
            make = MAKE_NORMALIZE[two_word]
            model_start_idx = 2

    if make is None:
        first = tokens[0].lower().rstrip("/,.-")
        if first in MAKE_NORMALIZE:
            make = MAKE_NORMALIZE[first]
            model_start_idx = 1
        elif first in KNOWN_MAKE_TOKENS:
            make = first.title()
            model_start_idx = 1

    if make is not None:
        # Skip None makes (those are model tokens mis-keyed in MAKE_NORMALIZE)
        if make is None:
            return None
        # Extract model: up to 2 tokens, stop at noise word
        model_tokens = []
        for tok in tokens[model_start_idx:model_start_idx + 3]:
            if NOISE_AFTER_YEAR.match(tok):
                break
            # Stop at tokens that look like product descriptions
            if re.match(
                r"^(?:WINDOW|FRONT|REAR|SIDE|CHROME|MATTE|BLACK|GLOSSY|"
                r"STAINLESS|STEEL|ALUMINUM|ALUMI|CLASS|STYLE|SERIES|LED|"
                r"HALO|PROJECTOR|BULL|RUNNING|STEP|TONNEAU|GRILL|GRILLE|VISOR|"
                r"HITCH|NERF|SKID|BUMPER|TRAILER|ROOF|FENDER|MUD|FLOOR|"
                r"SEAT|LIGHT|TAIL|HEAD|CORNER|SIGNAL|PARK|HORIZONTAL|VERTICAL|"
                r"MESH|BILLET|OEM|ADVANCED|MODULAR|OVAL|ROUND|SQUARE|DIAMOND|"
                r"RUBBER|VINYL|LEATHER|POLY|ABS|SS|AVT|STD|EXT|CREW|CAB|"
                r"SUPERCREW|SUPERDUTY|SUPERCAB|4DR|2DR|4PC|2PC|FULL|SHORT|"
                r"LONG|HEAVY|DUTY|PLUS|STANDARD|WIDE|SLIM|LOW|HIGH|SPORT|"
                r"CUSTOM|FACTORY|FACTORY|OE|SKID|PLATE|GUARD|BAR|RACK|KIT|"
                r"COVER|LINER|MAT|PAD|TRIM|PANEL|FRAME|BRACKET|MOUNT|ADAPTER)$",
                tok, re.IGNORECASE,
            ):
                break
            model_tokens.append(tok)
            if len(model_tokens) == 2:
                break

        if not model_tokens:
            # Make is known but no model — still usable (year+make only)
            return (make, "")
        model = clean_model(" ".join(model_tokens))
        return (make, model)

    # --- Strategy 2: model-only title (make omitted) ---
    # Try the first token (and first/second for multi-word models)
    first_tok = tokens[0].lower().rstrip("/,.-")

    # Try 2-word model first
    if len(tokens) >= 2:
        two_word_model = (tokens[0] + " " + tokens[1]).lower()
        if two_word_model in MODEL_TO_MAKE:
            make = MODEL_TO_MAKE[two_word_model]
            model = clean_model(tokens[0] + " " + tokens[1])
            return (make, model)

    inferred_make = resolve_make_from_model(first_tok)
    if inferred_make:
        # Use the raw token as model
        model_raw = tokens[0].rstrip("/,.-")
        # If next token looks like a trim/designation number, include it
        if len(tokens) > 1 and re.match(r"^\d{3,4}$", tokens[1]):
            model_raw += " " + tokens[1]
        model = clean_model(model_raw)
        return (inferred_make, model)

    return None


def parse_vehicle_from_title(title: str) -> Optional[Dict]:
    """
    Extract vehicle Year/Make/Model from a product title string.
    Returns dict with keys: year, make, model, vehicle_label, or None.
    """
    if not title or not isinstance(title, str):
        return None

    if UNIVERSAL_KEYWORDS.search(title):
        return None

    title = title.strip()

    # --- Attempt 1: year RANGE (most common in this catalog) ---
    m = _YEAR_LEAD.match(title)
    if not m:
        # Try searching inside (for titles like "Stehlen 123 For 07-13 ...")
        m = _YEAR_LEAD.search(title)

    if m:
        y_start = expand_year(m.group(1))
        y_end   = expand_year(m.group(2))
        if not (1985 <= y_start <= 2030 and 1985 <= y_end <= 2030):
            pass  # fall through to single-year attempt
        else:
            year = max(y_start, y_end)
            rest = m.group(3)
            result = _extract_make_model_from_rest(rest)
            if result:
                make, model = result
                label = f"{year} {make} {model}".strip()
                return {"year": year, "make": make, "model": model, "vehicle_label": label}

    # --- Attempt 2: single 4-digit year ---
    m2 = _SINGLE_YEAR_LEAD.match(title)
    if not m2:
        m2 = _SINGLE_YEAR_LEAD.search(title)

    if m2:
        year = int(m2.group(1))
        if 1985 <= year <= 2030:
            rest = m2.group(2)
            result = _extract_make_model_from_rest(rest)
            if result:
                make, model = result
                label = f"{year} {make} {model}".strip()
                return {"year": year, "make": make, "model": model, "vehicle_label": label}

    return None


def infer_marketplace(source_code: str, seller_account: str) -> Optional[str]:
    """Derive marketplace label from CB order fields."""
    if not isinstance(source_code, str):
        source_code = ""
    if not isinstance(seller_account, str):
        seller_account = ""

    sc = source_code.lower()
    sa = seller_account.lower()

    if "amazon" in sc or "amazon" in sa:
        return "Amazon"
    if "ebay" in sc or "ebay" in sa or "gt_racer" in sa or "streetune" in sa:
        return "eBay"
    if "chanadvorder" in sc or "dropship" in sc:
        # ChannelAdvisor sourced — check seller account for clue
        if "amazon" in sa:
            return "Amazon"
        if "ebay" in sa or "racer" in sa:
            return "eBay"
        return "Marketplace"
    if "wholesale" in sc:
        return "Wholesale"
    return None


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    print("Loading Champions CSV...")
    champs = pd.read_csv(CHAMPIONS_CSV, dtype=str)
    champs["email_lower"] = champs["email"].str.lower().str.strip()
    champ_set = set(champs["email_lower"].dropna())
    print(f"  {len(champs):,} Champions loaded")

    # ------------------------------------------------------------------
    # Step 1: Build email -> CustomerCode map from CB customers
    # ------------------------------------------------------------------
    print("\nLoading CB customers...")
    cb_cust = pd.read_parquet(
        CB_CUSTOMERS,
        columns=["CustomerCode", "Email"]
    )
    cb_cust["email_lower"] = cb_cust["Email"].str.lower().str.strip()
    # Filter to Champions only
    cb_cust = cb_cust[cb_cust["email_lower"].isin(champ_set)].copy()
    email_to_codes = (
        cb_cust.groupby("email_lower")["CustomerCode"]
        .apply(list)
        .to_dict()
    )
    print(f"  {len(email_to_codes):,} Champion emails matched in CB customers")

    # ------------------------------------------------------------------
    # Step 2: Load CB orders — filter to Champion CustomerCodes only
    # ------------------------------------------------------------------
    all_customer_codes = set(
        code for codes in email_to_codes.values() for code in codes
    )
    print(f"\nLoading CB orders for {len(all_customer_codes):,} CustomerCodes...")
    cb_orders = pd.read_parquet(
        CB_ORDERS,
        columns=["SalesOrderCode", "BillToCode", "SalesOrderDate",
                 "SourceCode", "SellerAccount_C"]
    )
    cb_orders = cb_orders[cb_orders["BillToCode"].isin(all_customer_codes)].copy()
    cb_orders["SalesOrderDate"] = pd.to_datetime(cb_orders["SalesOrderDate"], errors="coerce")
    print(f"  {len(cb_orders):,} orders found for Champion customers")

    # Build CustomerCode -> list of (SalesOrderCode, date, source, seller)
    code_to_orders = defaultdict(list)
    for _, row in cb_orders.iterrows():
        code_to_orders[row["BillToCode"]].append((
            row["SalesOrderCode"],
            row["SalesOrderDate"],
            row["SourceCode"],
            row["SellerAccount_C"],
        ))

    # ------------------------------------------------------------------
    # Step 3: Load CB order lines — filter to Champion orders only
    # ------------------------------------------------------------------
    champ_order_codes = set(cb_orders["SalesOrderCode"].dropna())
    print(f"\nLoading CB order lines for {len(champ_order_codes):,} orders...")
    cb_lines = pd.read_parquet(
        CB_ORDER_LINES,
        columns=["SalesOrderCode", "ItemDescription"]
    )
    cb_lines = cb_lines[cb_lines["SalesOrderCode"].isin(champ_order_codes)].copy()
    print(f"  {len(cb_lines):,} order lines loaded")

    # Build SalesOrderCode -> list of ItemDescriptions
    order_to_items = (
        cb_lines.groupby("SalesOrderCode")["ItemDescription"]
        .apply(list)
        .to_dict()
    )

    # ------------------------------------------------------------------
    # Step 4: Load Rithum orders — supplementary source for direct
    # eBay/Amazon orders with buyer_email
    # ------------------------------------------------------------------
    print("\nLoading Rithum orders for supplementary vehicle data...")
    rithum = pd.read_parquet(
        RITHUM_ORDERS,
        columns=["buyer_email", "item_title", "created_date_utc", "site_name"]
    )
    rithum["email_lower"] = rithum["buyer_email"].str.lower().str.strip()
    rithum = rithum[rithum["email_lower"].isin(champ_set)].copy()
    rithum["created_date_utc"] = pd.to_datetime(rithum["created_date_utc"], errors="coerce")
    print(f"  {len(rithum):,} Rithum rows for Champions")

    # Build email -> list of (item_title, date, site_name) from Rithum
    rithum_by_email = defaultdict(list)
    for _, row in rithum.iterrows():
        rithum_by_email[row["email_lower"]].append((
            row["item_title"],
            row["created_date_utc"],
            row["site_name"],
        ))

    # ------------------------------------------------------------------
    # Step 5: For each Champion, gather all purchase events with dates
    # and parse vehicle + category from product titles
    # ------------------------------------------------------------------
    print("\nParsing vehicle data for each Champion...")

    # Structure: email -> list of {date, vehicle_dict, category, marketplace}
    enriched = {}

    for email_lower in champ_set:
        purchase_events = []

        # --- CB chain ---
        for ccode in email_to_codes.get(email_lower, []):
            for (order_code, order_date, src, seller) in code_to_orders.get(ccode, []):
                marketplace = infer_marketplace(src, seller)
                for item_desc in order_to_items.get(order_code, []):
                    vehicle = parse_vehicle_from_title(item_desc)
                    category = classify_category(item_desc) if item_desc else None
                    purchase_events.append({
                        "date":        order_date,
                        "vehicle":     vehicle,
                        "category":    category,
                        "marketplace": marketplace,
                        "title":       item_desc,
                    })

        # --- Rithum supplementary ---
        for (item_title, date, site_name) in rithum_by_email.get(email_lower, []):
            # Derive marketplace from site_name
            if isinstance(site_name, str) and "amazon" in site_name.lower():
                mktplace = "Amazon"
            elif isinstance(site_name, str) and "ebay" in site_name.lower():
                mktplace = "eBay"
            else:
                mktplace = "Marketplace"

            vehicle = parse_vehicle_from_title(item_title)
            category = classify_category(item_title) if item_title else None
            purchase_events.append({
                "date":        date,
                "vehicle":     vehicle,
                "category":    category,
                "marketplace": mktplace,
                "title":       item_title,
            })

        # Sort all events newest-first.
        # Normalize timestamps: strip tz info so tz-aware (Rithum) and
        # tz-naive (CB) can be compared safely.
        def _sort_key(e):
            d = e["date"]
            if d is None or (isinstance(d, float)) or not pd.notna(d):
                return pd.Timestamp.min
            ts = pd.Timestamp(d)
            if ts.tzinfo is not None:
                ts = ts.tz_localize(None)
            return ts

        purchase_events.sort(key=_sort_key, reverse=True)

        enriched[email_lower] = purchase_events

    # ------------------------------------------------------------------
    # Step 6: Roll up per-email into summary fields
    # ------------------------------------------------------------------
    print("Rolling up vehicle summary per Champion...")

    rows = []
    for _, champ_row in champs.iterrows():
        email_lower = champ_row["email_lower"]
        events = enriched.get(email_lower, [])

        # Collect vehicles with frequency counting
        vehicle_freq = Counter()       # vehicle_label -> purchase count
        vehicle_data = {}              # vehicle_label -> vehicle dict (latest)
        last_category = None
        last_purchase_date = None
        primary_marketplace = None
        marketplace_counts = Counter()

        for ev in events:
            if last_category is None and ev["category"]:
                last_category = ev["category"]
            if last_purchase_date is None and pd.notna(ev["date"]):
                last_purchase_date = ev["date"]
            if ev["marketplace"]:
                marketplace_counts[ev["marketplace"]] += 1

            if ev["vehicle"]:
                label = ev["vehicle"]["vehicle_label"]
                vehicle_freq[label] += 1
                if label not in vehicle_data:
                    vehicle_data[label] = ev["vehicle"]

        # Primary marketplace (most frequent)
        if marketplace_counts:
            primary_marketplace = marketplace_counts.most_common(1)[0][0]

        # Build distinct vehicle list sorted by frequency (desc), then recency as tiebreaker
        seen_labels = [vehicle_data[label] for label, _ in vehicle_freq.most_common()]

        # Build output fields
        if seen_labels:
            primary = seen_labels[0]   # most purchased vehicle (frequency wins)
            top3    = seen_labels[:3]
            vehicle_year  = primary["year"]
            vehicle_make  = primary["make"]
            vehicle_model = primary["model"]
            vehicle_label = primary["vehicle_label"]
            all_vehicles  = "|".join(v["vehicle_label"] for v in top3)
            vehicle_count = len(seen_labels)
        else:
            vehicle_year  = None
            vehicle_make  = None
            vehicle_model = None
            vehicle_label = None
            all_vehicles  = None
            vehicle_count = 0

        last_purchase_str = (
            last_purchase_date.strftime("%Y-%m-%d")
            if last_purchase_date and pd.notna(last_purchase_date)
            else champ_row.get("last_order_date")
        )

        out = champ_row.drop("email_lower").to_dict()
        out.update({
            "vehicle_year":        vehicle_year,
            "vehicle_make":        vehicle_make,
            "vehicle_model":       vehicle_model,
            "vehicle_label":       vehicle_label,
            "all_vehicles":        all_vehicles,
            "vehicle_count":       vehicle_count,
            "last_category":       last_category,
            "last_purchase_date":  last_purchase_str,
            "marketplace":         primary_marketplace,
        })
        rows.append(out)

    result = pd.DataFrame(rows)

    # ------------------------------------------------------------------
    # Step 7: Write output
    # ------------------------------------------------------------------
    OUTPUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    result.to_csv(OUTPUT_CSV, index=False)
    print(f"\nWrote {len(result):,} rows to {OUTPUT_CSV}")

    # ------------------------------------------------------------------
    # Step 8: Summary
    # ------------------------------------------------------------------
    with_vehicle = result[result["vehicle_label"].notna()]
    without_vehicle = result[result["vehicle_label"].isna()]

    print("\n" + "=" * 60)
    print("ENRICHMENT SUMMARY")
    print("=" * 60)
    print(f"Total Champions:              {len(result):>8,}")
    print(f"With vehicle data:            {len(with_vehicle):>8,}  ({len(with_vehicle)/len(result)*100:.1f}%)")
    print(f"Without vehicle data:         {len(without_vehicle):>8,}  ({len(without_vehicle)/len(result)*100:.1f}%)")
    print(f"With multiple vehicles (2+):  {(result['vehicle_count'] >= 2).sum():>8,}")
    print(f"With 3 vehicles:              {(result['vehicle_count'] >= 3).sum():>8,}")

    print("\nTop 10 Makes:")
    make_counts = with_vehicle["vehicle_make"].value_counts().head(10)
    for make, count in make_counts.items():
        pct = count / len(with_vehicle) * 100
        print(f"  {make:<20} {count:>6,}  ({pct:.1f}%)")

    print("\nTop 10 Make + Model combos:")
    with_vehicle_copy = with_vehicle.copy()
    with_vehicle_copy["make_model"] = (
        with_vehicle_copy["vehicle_make"].fillna("") + " " +
        with_vehicle_copy["vehicle_model"].fillna("")
    ).str.strip()
    mm_counts = with_vehicle_copy["make_model"].value_counts().head(10)
    for mm, count in mm_counts.items():
        pct = count / len(with_vehicle) * 100
        print(f"  {mm:<30} {count:>6,}  ({pct:.1f}%)")

    print("\nTop 10 Last Categories:")
    cat_counts = result["last_category"].dropna().value_counts().head(10)
    for cat, count in cat_counts.items():
        print(f"  {cat:<25} {count:>6,}")

    print("\nTop Marketplaces:")
    mp_counts = result["marketplace"].dropna().value_counts()
    for mp, count in mp_counts.items():
        print(f"  {mp:<20} {count:>6,}")

    print("\nVehicle count distribution:")
    vc_dist = result["vehicle_count"].value_counts().sort_index()
    for vc, cnt in vc_dist.items():
        print(f"  {vc} vehicle(s): {cnt:>6,}")

    print("\nDone.")
    print(f"Output: {OUTPUT_CSV}")


if __name__ == "__main__":
    main()
