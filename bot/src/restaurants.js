// Curated registry of well-known Pakistani restaurants.
//
// Used by Food Help → Restaurant Guidance to (1) inject the correct
// Pakistani context into the food coach's system prompt (so "BBQ Tonight"
// isn't mistaken for an American burger joint), (2) surface a menu link
// when we have a verified one, and (3) give the LLM a short prior on the
// menu's signature dishes so healthy-swap suggestions stay on-menu.
//
// menu_url is intentionally left null when I do not have a *verified*
// current URL. The bot never invents URLs. Populate them in the admin
// spreadsheet or edit this file when you have a real link.
//
// aliases: match patterns (lower-cased, case-insensitive). Include common
// mis-spellings ("BBQ Tonite" for "BBQ Tonight") and short forms.

export const PK_RESTAURANTS = [
  {
    id: "bbq_tonight",
    name: "BBQ Tonight",
    aliases: ["bbq tonight", "bbq tonite", "bbqt"],
    signature_dishes: [
      "seekh kebab", "chicken tikka", "malai boti", "beef bihari kebab",
      "mutton karahi", "chicken karahi", "chapli kebab", "naan / roghni naan",
      "daal makhani", "sajji", "kheer",
    ],
    menu_url: null,
    notes: "Karachi/Lahore/Dubai Pakistani BBQ and grill house. Menu is heavy on charcoal-grilled kebabs, tikka, karahi and naan — NOT American BBQ (no ribs / no burgers). Healthier picks: grilled kebabs (seekh, chapli, malai boti), tandoori chicken, karahi with less oil requested, salad on the side; go easy on naan and kheer.",
  },
  {
    id: "kolachi",
    name: "Kolachi",
    aliases: ["kolachi"],
    signature_dishes: [
      "kolachi special karahi", "seafood platter", "sizzling brownie",
      "biryani", "handi", "bar b que",
    ],
    menu_url: null,
    notes: "Karachi seaside Pakistani/continental restaurant. Big portions. Healthier picks: grilled fish/prawns, kebabs, karahi with a small portion of rice or one naan shared, dessert shared.",
  },
  {
    id: "bundu_khan",
    name: "Bundu Khan",
    aliases: ["bundu khan", "bundu khaan"],
    signature_dishes: [
      "seekh kebab", "beef boti", "chicken tikka", "mutton karahi",
      "naan", "daal", "raita",
    ],
    menu_url: null,
    notes: "Legacy Lahori kebab/karahi chain. Healthier picks: seekh or chicken tikka, small karahi, share naan; avoid extra ghee.",
  },
  {
    id: "karachi_broast",
    name: "Karachi Broast",
    aliases: ["karachi broast", "kbroast"],
    signature_dishes: ["chicken broast", "fries", "coleslaw", "buns"],
    menu_url: null,
    notes: "Broasted (fried) chicken chain. Healthier tips: pick 1 piece not 2, skip the fries or share, ask for salad instead, avoid the bun; not ideal for frequent visits.",
  },
  {
    id: "student_biryani",
    name: "Student Biryani",
    aliases: ["student biryani"],
    signature_dishes: ["chicken biryani", "beef biryani", "raita", "salad"],
    menu_url: null,
    notes: "Karachi biryani chain. Portion is very carb-heavy. Healthier tips: ask for a half plate, load up on the raita and salad, add a boiled egg for protein, avoid the fried snacks side.",
  },
  {
    id: "cheezious",
    name: "Cheezious",
    aliases: ["cheezious", "cheezy"],
    signature_dishes: ["pizza", "wings", "garlic bread", "pasta"],
    menu_url: null,
    notes: "Pakistani pizza chain. Healthier picks: thin-crust or personal-size, chicken tikka or veggie topping (not extra cheese), grilled wings not fried, side salad; skip garlic bread and soda.",
  },
  {
    id: "broadway_pizza",
    name: "Broadway Pizza",
    aliases: ["broadway pizza", "broadway"],
    signature_dishes: ["pizza", "chicken wings", "pasta", "sandwiches"],
    menu_url: null,
    notes: "Pakistani pizza chain. Same principles as Cheezious: thin crust, chicken toppings, small size, side salad.",
  },
  {
    id: "kfc_pk",
    name: "KFC Pakistan",
    aliases: ["kfc"],
    signature_dishes: ["zinger burger", "hot & crispy chicken", "rice n spice", "krunch burger", "krushers"],
    menu_url: null,
    notes: "American chain, Pakistan menu. Fried chicken is high in oil. Healthier tips: grilled Twister if available, single piece of chicken (remove skin), rice-n-spice with extra salad, plain water instead of Krushers/soda.",
  },
  {
    id: "mcd_pk",
    name: "McDonald's Pakistan",
    aliases: ["mcdonald's", "mcdonalds", "mcd"],
    signature_dishes: ["big mac", "mcchicken", "spicy mcchicken", "fries", "mcflurry"],
    menu_url: null,
    notes: "American chain, Pakistan menu. Healthier tips: grilled chicken option if on menu, single burger not double, water not soda, skip the fries or share.",
  },
  {
    id: "hardees_pk",
    name: "Hardee's Pakistan",
    aliases: ["hardee's", "hardees", "hardee"],
    signature_dishes: ["thickburger", "chicken fillet burger", "curly fries", "milkshakes"],
    menu_url: null,
    notes: "American burger chain, Pakistan menu. Burgers are very calorie-dense. Healthier tips: single patty, chicken fillet grilled if available, share the fries, water instead of shake.",
  },
  {
    id: "sajjad",
    name: "Sajjad",
    aliases: ["sajjad", "sajjad karahi", "sajjad broast"],
    signature_dishes: ["broasted chicken", "karahi", "handi", "biryani"],
    menu_url: null,
    notes: "Karachi Pakistani restaurant. Healthier picks: karahi/handi with less oil, share the biryani, salad and raita on the side.",
  },
  {
    id: "meat_one",
    name: "Meat One",
    aliases: ["meat one", "meatone"],
    signature_dishes: ["kebabs", "steaks", "burgers", "sandwiches"],
    menu_url: null,
    notes: "Al Shaheer Foods casual grill chain. Healthier picks: grilled steak or kebab plate with salad, avoid heavy sauces, share the fries.",
  },
];

const NORMALIZE_RE = /[^a-z0-9\s'&-]/g;

function normalize(s) {
  return String(s || "").toLowerCase().replace(NORMALIZE_RE, " ").replace(/\s+/g, " ").trim();
}

// Match on whole-word alias occurrences to avoid false positives ("mcd" inside
// "amcdonalds" etc.). Returns the first restaurant whose alias appears in the
// input, or null.
export function matchRestaurant(text) {
  const hay = ` ${normalize(text)} `;
  for (const r of PK_RESTAURANTS) {
    for (const a of r.aliases) {
      const needle = normalize(a);
      // Word-boundary-ish check by padding the alias with spaces.
      if (hay.includes(` ${needle} `)) return r;
    }
  }
  return null;
}

// Build the LLM hint that gets injected into extraContext when a restaurant
// is recognized. Compact on purpose — the model already has the user's
// broader profile via profileContext.
export function restaurantHint(r) {
  if (!r) return "";
  const dishes = r.signature_dishes?.length ? `Signature dishes: ${r.signature_dishes.join(", ")}.` : "";
  const menu = r.menu_url ? `Menu link: ${r.menu_url}` : "";
  return [
    `The user is asking about a Pakistani restaurant: ${r.name}.`,
    r.notes,
    dishes,
    menu,
    "Base your suggestions on this restaurant's actual menu categories, not on generic international fast-food. Do not invent items that are not on this menu.",
  ].filter(Boolean).join(" ");
}
