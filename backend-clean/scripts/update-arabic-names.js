import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/productModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const ARABIC_PRODUCT_NAMES = {
  // Apples
  "Red Delicious Apple": "تفاح أحمر ديلشس",
  "Granny Smith Green Apple": "تفاح أخضر غراني سميث",
  "Grany Apple Local": "تفاح غراني بلدي",
  "Apple mwashah": "تفاح موشح بلدي",
  "Royal Gala Apple": "تفاح رويال غالا",
  "Golden Delicious Apple": "تفاح أصفر غولدن",
  "Crispy Honeycrisp Apple": "تفاح هاني كريسب",
  "Fuji Sweet Apple": "تفاح فوجي حلو",
  "Pink Lady Crisp Apple": "تفاح بينك ليدي",
  "Red Apple": "تفاح أحمر",
  "Green Apple": "تفاح أخضر",
  "Yellow Apple": "تفاح أصفر",
  "Apple": "تفاح",

  // Grapes
  "White Seedless Grapes": "عنب أبيض بدون بذر",
  "White seedless grapes": "عنب أبيض بدون بذر",
  "Black Seedless Grapes": "عنب أسود بدون بذر",
  "Black grapes": "عنب أسود بلدي",
  "Crimson Red Seedless Grapes": "عنب أحمر كريمسون",
  "Red seedless grapes": "عنب أحمر بدون بذر",
  "Red grapes sweet and seedless": "عنب أحمر حلو بدون بذر",
  "Grapes baytamouni": "عنب بيتموني بلدي",
  "Sweet Globe Green Grapes": "عنب سويت غلوب أخضر",
  "Baladi Muscat Aromatic Grapes": "عنب مسك بلدي",
  "White Grapes": "عنب أبيض",
  "Black Grapes": "عنب أسود",
  "Red Grapes": "عنب أحمر",
  "Grapes": "عنب",

  // Citrus
  "Valencia Orange": "برتقال فالنسيا للعصير",
  "Mandarin Clementine": "كلمنتين أفندي حلو",
  "Fresh Lemon": "حامض / ليمون بلدي",
  "Pink Grapefruit": "جريب فروت وردي",
  "Orange": "برتقال",
  "Mandarin": "كلمنتين / أفندي",
  "Lemon": "حامض بلدي",
  "Grapefruit": "جريب فروت",

  // Bananas & Tropical
  "Banana": "موز طازج",
  "Fresh Bananas": "موز طازج",
  "Hass Avocado": "أفوكادو هاس",
  "Avocado": "أفوكادو",
  "Green Kiwi": "كيوي أخضر",
  "Kiwi": "كيوي",
  "Fresh Pineapple": "أناناس طازج",
  "Pineapple": "أناناس",
  "Fresh Mango": "مانجو طازجة",
  "Mango": "مانجو",

  // Seasonal & Stone Fruits
  "Fresh Strawberry": "فريز / فراولة طازجة",
  "Strawberry": "فراولة / فريز",
  "Fresh Blueberries": "توت أزرق طازج",
  "Blueberries": "توت أزرق",
  "Fresh Raspberry": "توت أحمر (راسبيري)",
  "Raspberry": "توت أحمر",
  "Fresh Blackberries": "توت أسود",
  "Blackberries": "توت أسود",
  "Plump Red Cherries": "كرز أحمر بلدي",
  "Red Cherries": "كرز أحمر",
  "Cherries": "كرز",
  "Juicy Peach": "دراق حلو طازج",
  "Fresh Peach": "دراق طازج",
  "Peach": "دراق",
  "Fresh Nectarine": "نكتارين حلو",
  "Nectarine": "نكتارين",
  "Sweet Apricot": "مشمش بلدي حلو",
  "Fresh Apricot": "مشمش بلدي",
  "Apricot": "مشمش",
  "Sweet Watermelon": "بطيخ أحمر حلو",
  "Watermelon": "بطيخ أحمر",
  "Cantaloupe Melon": "شمام / بطيخ أصفر",
  "Melon": "شمام",
  "Ruby Pomegranate": "رمان ياقوتي حلو",
  "Pomegranate": "رمان",
  "Fresh Baladi Fig": "تين بلدي طازج",
  "Baladi Fig": "تين بلدي",
  "Fig": "تين",
  "Fresh Bartlett Pear": "إجاص / كمثرى طازج",
  "Pear": "إجاص / كمثرى",
  "Persimmon (Kaki)": "كاكا / خرما حلوة",
  "Persimmon": "كاكا / خرما",
  "Plum": "خوخ / بر 자ك",
  "Fresh Plums": "خوخ أسود وأحمر",

  // Vegetables - Tomatoes & Cucumbers
  "Fresh Vine Tomato": "بندورة عنقودية طازجة",
  "Vine Tomato": "بندورة عنقودية",
  "Cherry Tomatoes": "بندورة كرزية حلوة",
  "Tomato": "بندورة / طماطم",
  "Fresh Tomatoes": "بندورة طازجة",
  "Local Cucumbers": "خيار بلدي طازج",
  "Fresh Cucumber": "خيار طازج",
  "Cucumber": "خيار",

  // Vegetables - Root & Alliums
  "Local Potatoes": "بطاطا بلدية طازجة",
  "Potato": "بطاطا",
  "Potatoes": "بطاطا بلدية",
  "Sweet Potato": "بطاطا حلوة",
  "Red Onion": "بصل أحمر بلدي",
  "White Onion": "بصل أبيض للطبخ",
  "Onion": "بصل",
  "Fresh Garlic": "ثوم بلدي طازج",
  "Garlic": "ثوم بلدي",
  "Fresh Carrots": "جزر طازج مقرمش",
  "Carrot": "جزر",
  "Carrots": "جزر طازج",
  "Fresh Beetroot": "شمندر بلدي أحمر",
  "Beetroot": "شمندر أحمر",
  "Red Radish (Fijel)": "فجل أحمر بلدي",
  "Radish": "فجل أحمر",
  "White Turnip (Lift)": "لفت أبيض بلدي",
  "Turnip": "لفت أبيض",

  // Vegetables - Leafy & Greens
  "Romaine Lettuce": "خس روماني بلدي (للفتوش)",
  "Iceberg Lettuce": "خس آيسبيرغ مقرمش",
  "Lettuce": "خس بلدي",
  "Fresh Spinach Leaves": "سبانخ بلدي طازج",
  "Spinach": "سبانخ",
  "Swiss Chard (Selleq)": "سلق بلدي طازج",
  "Swiss Chard": "سلق بلدي",
  "White Cabbage": "ملفوف أبيض (للملفوف والسلطة)",
  "Red Cabbage": "ملفوف أحمر للسلطة",
  "Cabbage": "ملفوف",
  "Fresh Broccoli": "بروكلي طازج",
  "Broccoli": "بروكلي",
  "White Cauliflower": "قرنبيط / زهرة بيضاء",
  "Cauliflower": "قرنبيط / زهرة",

  // Vegetables - Peppers & Squash & Others
  "Green Bell Pepper": "فليفلة خضراء حلوة",
  "Red Bell Pepper": "فليفلة حمراء حلوة",
  "Yellow Bell Pepper": "فليفلة صفراء حلوة",
  "Bell Pepper": "فليفلة حلوة",
  "Hot Chili Pepper": "حر حار أحمر وأخضر",
  "Chili Pepper": "حر حار",
  "Dark Eggplant": "باذنجان أسود (للمتبل والمقالي)",
  "Eggplant": "باذنجان أسود",
  "Fresh Zucchini (Kousa)": "كوسا بلدية للمحشي والطبخ",
  "Zucchini": "كوسا بلدية",
  "Snap Green Beans (Loubieh)": "لوبية خضراء بلدية",
  "Green Beans": "لوبية / فاصولياء خضراء",
  "White Button Mushrooms": "فطر أبيض طازج",
  "Mushroom": "فطر طازج",
  "Mushrooms": "فطر طازج",
  "Baby Okra (Bamia)": "بامية بلدية صغيرة",
  "Okra": "بامية بلدية",
  "Green Peas": "بازلاء خضراء",
  "Sweet Corn": "ذرة صفراء حلوة",
  "Fresh Pumpkin": "قرع / يقطين عسلي",
  "Pumpkin": "قرع / يقطين",

  // Herbs
  "Fresh Parsley (Baqdounis)": "بقدونس بلدي للتبولة",
  "Parsley": "بقدونس بلدي",
  "Fresh Basil (Rihan)": "ريحان / حبق طازج",
  "Basil": "ريحان / حبق",
  "Fresh Rosemary": "إكليل الجبل (روزماري)",
  "Rosemary": "إكليل الجبل",
  "Fresh Oregano / Green Zaatar": "زعتر أخضر / أوريغانو بلدي",
  "Oregano": "أوريغانو / زعتر أخضر",
  "Fresh Green Onion (Scallions)": "بصل أخضر طازج",
  "Green Onion": "بصل أخضر",
  "Fresh Leek": "كراث / كرات طازج",
  "Leek": "كراث",
  "Fresh Fennel Bulb": "شمر / شومر طازج",
  "Fennel": "شمر / شومر",
  "Fresh Chives": "ثوم معمر (شايفز)",
  "Chives": "ثوم معمر",
  "Fresh Bay Leaves": "ورق غار عطري",
  "Bay Leaves": "ورق غار",
  "Fresh Tarragon (Tarkhoun)": "طرخون بلدي طازج",
  "Tarragon": "طرخون",
  "Fresh Mint": "نعنع بلدي طازج",
  "Mint": "نعنع بلدي",
  "Fresh Coriander": "كزبرة خضراء طازجة",
  "Coriander": "كزبرة خضراء",
  "Fresh Thyme": "زعتر بلدي بري",
  "Thyme": "زعتر بري",
  "Fresh Dill": "شبت طازج",
  "Dill": "شبت",
  "Fresh Sage (Maramia)": "ميرمية بلدية طازجة",
  "Sage": "ميرمية",

  // Raw Nuts & Seeds
  "Raw Whole Almonds": "لوز ني كامل ممتاز",
  "Raw Almonds": "لوز ني",
  "Raw Walnut Halves": "جوز ني أنصاف فاخر",
  "Raw Walnuts": "جوز ني",
  "Raw Pine Nuts (Snobar Baladi)": "صنوبر بلدي ني فاخر",
  "Raw Pine Nuts": "صنوبر بلدي ني",
  "Pine Nuts": "صنوبر بلدي",
  "Raw Macadamia Nuts": "ماكاداميا نية فاخرة",
  "Macadamia": "ماكاداميا",
  "Raw Pumpkin Seeds (Pepitas)": "بزر قرع ني مقشور",
  "Pumpkin Seeds": "بزر قرع",
  "Raw Sunflower Seeds": "بزر دوار الشمس ني مقشور",
  "Sunflower Seeds": "بزر دوار الشمس",
  "Raw Cashews": "كاجو ني",
  "Raw Pistachios": "فستق حلبي ني",
  "Pecan Nuts": "جوز البيكان",
  "Sesame Seeds": "سمسم ني طبيعي",

  // Cooked & Roasted Nuts
  "Oven Roasted Cashews": "كاجو محمص ومملح بالفرن",
  "Roasted Cashews": "كاجو محمص ومملح",
  "Roasted Pistachios In-Shell": "فستق حلبي محمص ومملح بقشره",
  "Roasted Pistachios": "فستق حلبي محمص",
  "Shelled Roasted Pistachios": "فستق حلبي محمص مقشور",
  "Roasted Hazelnuts (Bandouk)": "بندق محمص مقشور",
  "Roasted Hazelnuts": "بندق محمص",
  "Salted Roasted Peanuts": "فول سوداني محمص ومملح",
  "Roasted Peanuts": "فستق سوداني محمص",
  "Deluxe Roasted Mixed Nuts": "مكسرات مشكلة محمصة فاخرة",
  "Mixed Nuts": "مكسرات مشكلة",
  "Crispy Roasted Chickpeas (Qadameh)": "قضامة صفراء مقرمشة",
  "Roasted Chickpeas": "قضامة صفراء",
  "Roasted Almonds": "لوز محمص ومملح",
  "Corn Nuts": "ذرة محمصة ومقرمشة",

  // Dates
  "Jumbo Medjool Dates": "تمر مجدول جمبو فاخر",
  "Medjool Dates": "تمر مجدول فاخر",
  "Ajwa Al-Madinah Dates": "تمر عجوة المدينة المنورة",
  "Ajwa Dates": "تمر عجوة المدينة",
  "Golden Sukkari Dates": "تمر سكري ذهبي طري",
  "Sukkari Dates": "تمر سكري ذهبي",
  "Deglet Noor Dates": "تمر دقلة نور طبيعي",
  "Deglet Noor": "تمر دقلة نور",
  "Khudri Dates": "تمر خضري فاخر",
  "Khudri": "تمر خضري",
  "Fresh Barhi Dates": "بلح برحي طازج",
  "Barhi Dates": "بلح برحي",
  "Mabroom Dates": "تمر مبروم فاخر",
  "Mabroom": "تمر مبروم",
  "Safawi Dates": "تمر صفاوي أسود",
  "Safawi": "تمر صفاوي",
  "Stuffed Gourmet Dates Gift Box": "علبة تمر فاخر محشي بالمكسرات",
  "Stuffed Dates": "تمر محشي بالمكسرات",
  "Pure Natural Date Paste": "عجينة تمر طبيعية للمعمول والحلويات",
  "Date Paste": "عجينة تمر طبيعية",

  // Juices & Drinks
  "Fresh Orange Juice": "عصير برتقال طبيعي طازج",
  "Fresh Lemonade": "عصير ليموناضة طازج منعش",
  "Fresh Carrot Juice": "عصير جزر طبيعي طازج",
  "Fresh Apple Juice": "عصير تفاح طبيعي",
  "Fresh Strawberry Juice": "عصير فراولة طبيعي",
  "Fresh Mango Juice": "عصير مانجو طبيعي",
  "Fresh Pineapple Juice": "عصير أناناس طبيعي",

  // Mouneh & Pantry
  "Extra Virgin Olive Oil": "زيت زيتون بكر ممتاز",
  "Pomegranate Molasses": "دبس رمان بلدي أصلي",
  "Carob Molasses": "دبس خروب بلدي",
  "Green Olives": "زيتون أخضر بلدي مكبوس",
  "Black Olives": "زيتون أسود بلدي",
  "Wild Thyme Mix (Zaatar Baladi)": "زعتر بلدي مخلط بالسمسم"
};

function findArabicName(name) {
  if (!name) return '';
  const trimmed = name.trim();
  if (ARABIC_PRODUCT_NAMES[trimmed]) return ARABIC_PRODUCT_NAMES[trimmed];

  const lower = trimmed.toLowerCase();
  for (const [en, ar] of Object.entries(ARABIC_PRODUCT_NAMES)) {
    if (en.toLowerCase() === lower) return ar;
  }

  for (const [en, ar] of Object.entries(ARABIC_PRODUCT_NAMES)) {
    if (lower.includes(en.toLowerCase()) || en.toLowerCase().includes(lower)) return ar;
  }

  return '';
}

async function updateAllProducts() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected!');

    const products = await Product.find({});
    console.log(`Found ${products.length} products to check.`);

    let updatedCount = 0;
    for (const prod of products) {
      const arName = findArabicName(prod.name) || prod.nameAr;
      if (arName && prod.nameAr !== arName) {
        prod.nameAr = arName;
        await prod.save();
        updatedCount++;
        console.log(`Updated: "${prod.name}" -> "${arName}"`);
      } else if (prod.nameAr) {
        console.log(`Already has Arabic: "${prod.name}" -> "${prod.nameAr}"`);
      } else {
        console.log(`No Arabic match for: "${prod.name}"`);
      }
    }

    console.log(`\nSuccessfully updated ${updatedCount} products with Arabic names!`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

updateAllProducts();
