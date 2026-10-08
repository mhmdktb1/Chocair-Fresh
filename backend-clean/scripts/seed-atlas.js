import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import models
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';
import Order from '../models/orderModel.js';

// Sample data
const categories = [
  {
    name: "Fruits",
    description: "Fresh and organic fruits",
    isVisible: true,
    featured: false,
    subCategories: ['Apples', 'Grapes', 'Citrus', 'Bananas & Tropical', 'Stone Fruits', 'Berries', 'Melons']
  },
  {
    name: "Seasonal Fruits",
    description: "Peak harvest seasonal fruits and fresh berries",
    isVisible: true,
    featured: true,
    subCategories: ['Berries', 'Stone Fruits', 'Melons', 'Figs & Pomegranates']
  },
  {
    name: "Vegetables",
    description: "Farm fresh vegetables",
    isVisible: true,
    featured: false,
    subCategories: ['Tomatoes & Cucumbers', 'Leafy Greens', 'Root Vegetables', 'Peppers & Squash']
  },
  {
    name: "Herbs",
    description: "Fresh aromatic herbs",
    isVisible: true,
    featured: false,
    subCategories: ['Fresh Herbs', 'Cooking Herbs', 'Tea & Wild Herbs']
  },
  {
    name: "Nuts",
    description: "Raw and roasted nuts",
    isVisible: true,
    featured: false,
    subCategories: ['Raw Nuts', 'Roasted Nuts', 'Seeds & Mixes']
  },
  {
    name: "Fresh Juices",
    description: "Freshly squeezed natural juices",
    isVisible: true,
    featured: true,
    subCategories: ['Citrus Juices', 'Fruit Blends', 'Detox & Greens']
  },
  {
    name: "Dates",
    description: "Premium quality dates",
    isVisible: true,
    featured: false,
    subCategories: ['Medjool Dates', 'Traditional Dates', 'Stuffed & Specialty']
  },
  {
    name: "Imported Fruits",
    description: "High quality imported fruits",
    isVisible: true,
    featured: true,
    subCategories: ['Exotics', 'Imported Berries', 'Stone Fruits']
  },
  {
    name: "Mouneh Baladiye",
    description: "Traditional homemade Lebanese mouneh",
    isVisible: true,
    featured: false,
    subCategories: ['Jams & Molasses', 'Pickles & Olives', 'Dairy & Ghee']
  },
  {
    name: "Ready to Eat",
    description: "Fresh ready-to-eat items and prepared snacks",
    isVisible: true,
    featured: true,
    subCategories: ['Fruit Cups', 'Salad Bowls', 'Platters']
  }
];

const users = [
  {
    name: "Admin User",
    phone: "+96170516382",
    email: "admin@Choucair.com",
    location: "Beirut",
    isAdmin: true,
    addresses: []
  },
  {
    name: "mhmd ktb",
    phone: "+9618199999",
    email: null,
    location: "Beirut",
    isAdmin: true,
    addresses: []
  },
  {
    name: "jasmen koko",
    phone: "+9617966666",
    email: "m@gmail.com",
    location: "Tima",
    isAdmin: false,
    addresses: []
  },

  {
    name: "Ahmad Khalil",
    phone: "+96170000001",
    email: "ahmad1@mail.com",
    location: "Dbayeh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "Rana Haddad",
    phone: "+96170000002",
    email: "rana2@mail.com",
    location: "Jounieh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "Joseph Elias",
    phone: "+96170000003",
    email: null,
    location: "Zalka",
    isAdmin: false,
    addresses: []
  },
  {
    name: "Lina Mansour",
    phone: "+96170000004",
    email: "lina4@mail.com",
    location: "Beirut",
    isAdmin: false,
    addresses: []
  },
  {
    name: "Omar Saleh",
    phone: "+96170000005",
    email: null,
    location: "Antelias",
    isAdmin: false,
    addresses: []
  },
  {
    name: "Sara Nasser",
    phone: "+96170000006",
    email: "sara6@mail.com",
    location: "Dbayeh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "Ali Hussein",
    phone: "+96170000007",
    email: null,
    location: "Jdeideh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "Maya Farah",
    phone: "+96170000008",
    email: "maya8@mail.com",
    location: "Zouk",
    isAdmin: false,
    addresses: []
  },

  {
    name: "User 11",
    phone: "+96170000009",
    email: null,
    location: "Beirut",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 12",
    phone: "+96170000010",
    email: "user12@mail.com",
    location: "Dbayeh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 13",
    phone: "+96170000011",
    email: null,
    location: "Antelias",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 14",
    phone: "+96170000012",
    email: "user14@mail.com",
    location: "Jounieh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 15",
    phone: "+96170000013",
    email: null,
    location: "Zalka",
    isAdmin: false,
    addresses: []
  },

  {
    name: "User 16",
    phone: "+96170000014",
    email: "user16@mail.com",
    location: "Beirut",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 17",
    phone: "+96170000015",
    email: null,
    location: "Dbayeh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 18",
    phone: "+96170000016",
    email: "user18@mail.com",
    location: "Antelias",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 19",
    phone: "+96170000017",
    email: null,
    location: "Jdeideh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 20",
    phone: "+96170000018",
    email: "user20@mail.com",
    location: "Zouk",
    isAdmin: false,
    addresses: []
  },

  {
    name: "User 21",
    phone: "+96170000019",
    email: null,
    location: "Beirut",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 22",
    phone: "+96170000020",
    email: "user22@mail.com",
    location: "Dbayeh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 23",
    phone: "+96170000021",
    email: null,
    location: "Antelias",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 24",
    phone: "+96170000022",
    email: "user24@mail.com",
    location: "Jounieh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 25",
    phone: "+96170000023",
    email: null,
    location: "Zalka",
    isAdmin: false,
    addresses: []
  },

  {
    name: "User 26",
    phone: "+96170000024",
    email: "user26@mail.com",
    location: "Beirut",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 27",
    phone: "+96170000025",
    email: null,
    location: "Dbayeh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 28",
    phone: "+96170000026",
    email: "user28@mail.com",
    location: "Antelias",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 29",
    phone: "+96170000027",
    email: null,
    location: "Jdeideh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 30",
    phone: "+96170000028",
    email: "user30@mail.com",
    location: "Zouk",
    isAdmin: false,
    addresses: []
  },

  {
    name: "User 31",
    phone: "+96170000029",
    email: null,
    location: "Beirut",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 32",
    phone: "+96170000030",
    email: "user32@mail.com",
    location: "Dbayeh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 33",
    phone: "+96170000031",
    email: null,
    location: "Antelias",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 34",
    phone: "+96170000032",
    email: "user34@mail.com",
    location: "Jounieh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 35",
    phone: "+96170000033",
    email: null,
    location: "Zalka",
    isAdmin: false,
    addresses: []
  },

  {
    name: "User 36",
    phone: "+96170000034",
    email: "user36@mail.com",
    location: "Beirut",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 37",
    phone: "+96170000035",
    email: null,
    location: "Dbayeh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 38",
    phone: "+96170000036",
    email: "user38@mail.com",
    location: "Antelias",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 39",
    phone: "+96170000037",
    email: null,
    location: "Jdeideh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 40",
    phone: "+96170000038",
    email: "user40@mail.com",
    location: "Zouk",
    isAdmin: false,
    addresses: []
  },

  {
    name: "User 41",
    phone: "+96170000039",
    email: null,
    location: "Beirut",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 42",
    phone: "+96170000040",
    email: "user42@mail.com",
    location: "Dbayeh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 43",
    phone: "+96170000041",
    email: null,
    location: "Antelias",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 44",
    phone: "+96170000042",
    email: "user44@mail.com",
    location: "Jounieh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 45",
    phone: "+96170000043",
    email: null,
    location: "Zalka",
    isAdmin: false,
    addresses: []
  },

  {
    name: "User 46",
    phone: "+96170000044",
    email: "user46@mail.com",
    location: "Beirut",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 47",
    phone: "+96170000045",
    email: null,
    location: "Dbayeh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 48",
    phone: "+96170000046",
    email: "user48@mail.com",
    location: "Antelias",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 49",
    phone: "+96170000047",
    email: null,
    location: "Jdeideh",
    isAdmin: false,
    addresses: []
  },
  {
    name: "User 50",
    phone: "+96170000048",
    email: "user50@mail.com",
    location: "Zouk",
    isAdmin: false,
    addresses: []
  }
];

const products = [

/* ===================== FRUITS ===================== */
{
  name: "Apple Red",
  image: "/assets/images/products/fruits/apple-red-user.jpeg",
  description: "Fresh red apples",
  brand: "Choucair",
  category: "Fruits",
  unit: "kg",
  price: 2.5,
  countInStock: 40,
  rating: 0,
  numReviews: 0
},
{
  name: "Apple Green",
  image: "/assets/images/products/fruits/apple-green-user.jpeg",
  description: "Fresh green apples",
  brand: "Choucair",
  category: "Fruits",

  unit: "kg",
  price: 2.8,
  countInStock: 35,
  rating: 0,
  numReviews: 0
},
{
  name: "Banana",
  image: "/assets/images/products/fruits/banana-user.jpeg",
  description: "Fresh bananas",
  brand: "Choucair",
  category: "Fruits",
  unit: "kg",
  price: 1.9,
  countInStock: 50,
  rating: 0,
  numReviews: 0
},
{
  name: "Orange",
  image: "/assets/images/products/fruits/orange.jpg",
  description: "Juicy oranges",
  brand: "Choucair",
  category: "Fruits",
  unit: "kg",
  price: 2.2,
  countInStock: 45,
  rating: 0,
  numReviews: 0
},
{
  name: "Mandarin",
  image: "/assets/images/products/fruits/mandarin.jpg",
  description: "Sweet mandarin oranges",
  brand: "Choucair",
  category: "Fruits",
  unit: "kg",
  price: 2.3,
  countInStock: 40,
  rating: 0,
  numReviews: 0
},
{
  name: "Lemon",
  image: "/assets/images/products/fruits/lemon.jpg",
  description: "Fresh lemons",
  brand: "Choucair",
  category: "Fruits",
  unit: "kg",
  price: 1.8,
  countInStock: 60,
  rating: 0,
  numReviews: 0
},
{
  name: "Grapefruit",
  image: "/assets/images/products/fruits/grapefruit.jpg",
  description: "Fresh grapefruit",
  brand: "Choucair",
  category: "Fruits",
  unit: "kg",
  price: 2.6,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Strawberry",
  image: "/assets/images/products/fruits/strawberry-user.jpeg",
  description: "Fresh strawberries",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 4.5,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Cherry",
  image: "/assets/images/products/fruits/cherry.jpg",
  description: "Fresh cherries",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 9.0,
  countInStock: 12,
  rating: 0,
  numReviews: 0
},
{
  name: "Peach",
  image: "/assets/images/products/fruits/peach.jpg",
  description: "Fresh peaches",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 3.5,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Nectarine",
  image: "/assets/images/products/nectarine",
  description: "Fresh nectarines",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 3.8,
  countInStock: 18,
  rating: 0,
  numReviews: 0
},
{
  name: "Apricot",
  image: "/assets/images/products/apricot",
  description: "Fresh apricots",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 4.0,
  countInStock: 16,
  rating: 0,
  numReviews: 0
},
{
  name: "Plum",
  image: "/assets/images/products/plum",
  description: "Fresh plums",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 3.2,
  countInStock: 18,
  rating: 0,
  numReviews: 0
},
{
  name: "Grape White",
  image: "/assets/images/products/grapes-white",
  description: "White grapes",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 3.2,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Grape Black",
  image: "/assets/images/products/grapes-black",
  description: "Black grapes",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 3.0,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Watermelon",
  image: "/assets/images/products/watermelon",
  description: "Fresh watermelon",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 1.2,
  countInStock: 80,
  rating: 0,
  numReviews: 0
},
{
  name: "Melon",
  image: "/assets/images/products/melon",
  description: "Sweet melon",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 1.6,
  countInStock: 40,
  rating: 0,
  numReviews: 0
},
{
  name: "Pineapple",
  image: "/assets/images/products/pineapple",
  description: "Fresh pineapple",
  brand: "Choucair",
  category: "Fruits",
  unit: "piece",
  price: 2.8,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Mango",
  image: "/assets/images/products/mango",
  description: "Sweet mango",
  brand: "Choucair",
  category: "Fruits",
  unit: "kg",
  price: 4.0,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Kiwi",
  image: "/assets/images/products/kiwi",
  description: "Fresh kiwi",
  brand: "Choucair",
  category: "Fruits",
  unit: "kg",
  price: 5.5,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Avocado",
  image: "/assets/images/products/avocado",
  description: "Fresh avocado",
  brand: "Choucair",
  category: "Fruits",
  unit: "kg",
  price: 4.8,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Pomegranate",
  image: "/assets/images/products/pomegranate",
  description: "Fresh pomegranate",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 3.5,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Fig",
  image: "/assets/images/products/fig",
  description: "Fresh figs",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 6.0,
  countInStock: 12,
  rating: 0,
  numReviews: 0
},
{
  name: "Pear",
  image: "/assets/images/products/pear",
  description: "Fresh pears",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 3.0,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Persimmon",
  image: "/assets/images/products/persimmon",
  description: "Fresh persimmons",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 3.8,
  countInStock: 15,
  rating: 0,
  numReviews: 0
},
{
  name: "Blueberry",
  image: "/assets/images/products/blueberry",
  description: "Fresh blueberries",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 12.0,
  countInStock: 10,
  rating: 0,
  numReviews: 0
},
{
  name: "Raspberry",
  image: "/assets/images/products/raspberry",
  description: "Fresh raspberries",
  brand: "Choucair",
  category: "Seasonal Fruits",
  unit: "kg",
  price: 14.0,
  countInStock: 8,
  rating: 0,
  numReviews: 0
},

/* ===================== VEGETABLES ===================== */
{
  name: "Tomato",
  image: "/assets/images/products/tomato",
  description: "Fresh tomatoes",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 3.0,
  countInStock: 50,
  rating: 0,
  numReviews: 0
},
{
  name: "Cherry Tomato",
  image: "/assets/images/products/cherry-tomato",
  description: "Fresh cherry tomatoes",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 4.0,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Cucumber",
  image: "/assets/images/products/cucumber",
  description: "Fresh cucumber",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 2.0,
  countInStock: 45,
  rating: 0,
  numReviews: 0
},
{
  name: "Lettuce",
  image: "/assets/images/products/lettuce",
  description: "Fresh lettuce",
  brand: "Choucair",
  category: "Vegetables",
  unit: "piece",
  price: 1.0,
  countInStock: 40,
  rating: 0,
  numReviews: 0
},
{
  name: "Iceberg Lettuce",
  image: "/assets/images/products/iceberg-lettuce",
  description: "Fresh iceberg lettuce",
  brand: "Choucair",
  category: "Vegetables",
  unit: "piece",
  price: 1.2,
  countInStock: 35,
  rating: 0,
  numReviews: 0
},
{
  name: "Onion Red",
  image: "/assets/images/products/onion-red",
  description: "Fresh red onions",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 1.8,
  countInStock: 60,
  rating: 0,
  numReviews: 0
},
{
  name: "Onion White",
  image: "/assets/images/products/onion-white",
  description: "Fresh white onions",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 1.6,
  countInStock: 60,
  rating: 0,
  numReviews: 0
},
{
  name: "Garlic",
  image: "/assets/images/products/garlic",
  description: "Fresh garlic",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 4.0,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Potato",
  image: "/assets/images/products/vegetables/potato-user.jpeg",
  description: "Fresh potatoes",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 1.8,
  countInStock: 90,
  rating: 0,
  numReviews: 0
},
{
  name: "Sweet Potato",
  image: "/assets/images/products/sweet-potato",
  description: "Fresh sweet potatoes",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 2.5,
  countInStock: 55,
  rating: 0,
  numReviews: 0
},
{
  name: "Carrot",
  image: "/assets/images/products/carrot",
  description: "Fresh carrots",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 1.9,
  countInStock: 70,
  rating: 0,
  numReviews: 0
},
{
  name: "Beetroot",
  image: "/assets/images/products/beetroot",
  description: "Fresh beetroot",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 2.2,
  countInStock: 35,
  rating: 0,
  numReviews: 0
},
{
  name: "Cabbage White",
  image: "/assets/images/products/cabbage-white",
  description: "Fresh white cabbage",
  brand: "Choucair",
  category: "Vegetables",
  unit: "piece",
  price: 1.5,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Cabbage Red",
  image: "/assets/images/products/cabbage-red",
  description: "Fresh red cabbage",
  brand: "Choucair",
  category: "Vegetables",
  unit: "piece",
  price: 1.8,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Cauliflower",
  image: "/assets/images/products/cauliflower",
  description: "Fresh cauliflower",
  brand: "Choucair",
  category: "Vegetables",
  unit: "piece",
  price: 2.0,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Broccoli",
  image: "/assets/images/products/broccoli",
  description: "Fresh broccoli",
  brand: "Choucair",
  category: "Vegetables",
  unit: "piece",
  price: 2.2,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Eggplant",
  image: "/assets/images/products/eggplant",
  description: "Fresh eggplant",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 2.6,
  countInStock: 40,
  rating: 0,
  numReviews: 0
},
{
  name: "Zucchini",
  image: "/assets/images/products/zucchini",
  description: "Fresh zucchini",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 2.4,
  countInStock: 40,
  rating: 0,
  numReviews: 0
},
{
  name: "Bell Pepper Green",
  image: "/assets/images/products/bell-pepper-green",
  description: "Fresh green bell pepper",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 3.5,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Bell Pepper Red",
  image: "/assets/images/products/bell-pepper-red",
  description: "Fresh red bell pepper",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 4.0,
  countInStock: 22,
  rating: 0,
  numReviews: 0
},
{
  name: "Bell Pepper Yellow",
  image: "/assets/images/products/bell-pepper-yellow",
  description: "Fresh yellow bell pepper",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 4.2,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Chili Pepper",
  image: "/assets/images/products/chili-pepper",
  description: "Fresh chili pepper",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 5.0,
  countInStock: 15,
  rating: 0,
  numReviews: 0
},
{
  name: "Spinach",
  image: "/assets/images/products/spinach",
  description: "Fresh spinach",
  brand: "Choucair",
  category: "Vegetables",
  unit: "bunch",
  price: 1.2,
  countInStock: 45,
  rating: 0,
  numReviews: 0
},
{
  name: "Swiss Chard",
  image: "/assets/images/products/swiss-chard",
  description: "Fresh swiss chard",
  brand: "Choucair",
  category: "Vegetables",
  unit: "bunch",
  price: 1.2,
  countInStock: 40,
  rating: 0,
  numReviews: 0
},
{
  name: "Green Beans",
  image: "/assets/images/products/green-beans",
  description: "Fresh green beans",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 4.2,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Peas",
  image: "/assets/images/products/peas",
  description: "Fresh peas",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 4.0,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Corn",
  image: "/assets/images/products/corn",
  description: "Fresh corn",
  brand: "Choucair",
  category: "Vegetables",
  unit: "piece",
  price: 0.8,
  countInStock: 60,
  rating: 0,
  numReviews: 0
},
{
  name: "Mushroom",
  image: "/assets/images/products/mushroom",
  description: "Fresh mushrooms",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 6.0,
  countInStock: 18,
  rating: 0,
  numReviews: 0
},
{
  name: "Pumpkin",
  image: "/assets/images/products/pumpkin",
  description: "Fresh pumpkin",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 2.0,
  countInStock: 35,
  rating: 0,
  numReviews: 0
},
{
  name: "Radish",
  image: "/assets/images/products/radish",
  description: "Fresh radish",
  brand: "Choucair",
  category: "Vegetables",
  unit: "bunch",
  price: 1.0,
  countInStock: 35,
  rating: 0,
  numReviews: 0
},
{
  name: "Turnip",
  image: "/assets/images/products/turnip",
  description: "Fresh turnip",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 1.6,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Okra",
  image: "/assets/images/products/okra",
  description: "Fresh okra",
  brand: "Choucair",
  category: "Vegetables",
  unit: "kg",
  price: 5.0,
  countInStock: 18,
  rating: 0,
  numReviews: 0
},

/* ===================== HERBS ===================== */
{
  name: "Parsley",
  image: "/assets/images/products/parsley",
  description: "Fresh parsley",
  brand: "Choucair",
  category: "Herbs",
  unit: "bunch",
  price: 0.5,
  countInStock: 120,
  rating: 0,
  numReviews: 0
},
{
  name: "Coriander",
  image: "/assets/images/products/coriander",
  description: "Fresh coriander",
  brand: "Choucair",
  category: "Herbs",
  unit: "bunch",
  price: 0.5,
  countInStock: 110,
  rating: 0,
  numReviews: 0
},
{
  name: "Mint",
  image: "/assets/images/products/mint",
  description: "Fresh mint",
  brand: "Choucair",
  category: "Herbs",
  unit: "bunch",
  price: 0.6,
  countInStock: 110,
  rating: 0,
  numReviews: 0
},
{
  name: "Basil",
  image: "/assets/images/products/basil",
  description: "Fresh basil",
  brand: "Choucair",
  category: "Herbs",
  unit: "bunch",
  price: 0.8,
  countInStock: 80,
  rating: 0,
  numReviews: 0
},
{
  name: "Thyme",
  image: "/assets/images/products/thyme",
  description: "Fresh thyme",
  brand: "Choucair",
  category: "Herbs",
  unit: "bunch",
  price: 0.8,
  countInStock: 80,
  rating: 0,
  numReviews: 0
},
{
  name: "Rosemary",
  image: "/assets/images/products/rosemary",
  description: "Fresh rosemary",
  brand: "Choucair",
  category: "Herbs",
  unit: "bunch",
  price: 0.9,
  countInStock: 60,
  rating: 0,
  numReviews: 0
},
{
  name: "Oregano",
  image: "/assets/images/products/oregano",
  description: "Fresh oregano",
  brand: "Choucair",
  category: "Herbs",
  unit: "bunch",
  price: 0.9,
  countInStock: 60,
  rating: 0,
  numReviews: 0
},
{
  name: "Dill",
  image: "/assets/images/products/dill",
  description: "Fresh dill",
  brand: "Choucair",
  category: "Herbs",
  unit: "bunch",
  price: 0.7,
  countInStock: 70,
  rating: 0,
  numReviews: 0
},
{
  name: "Bay Leaves",
  image: "/assets/images/products/bay-leaves",
  description: "Fresh bay leaves",
  brand: "Choucair",
  category: "Herbs",
  unit: "bunch",
  price: 0.9,
  countInStock: 55,
  rating: 0,
  numReviews: 0
},
{
  name: "Sage",
  image: "/assets/images/products/sage",
  description: "Fresh sage",
  brand: "Choucair",
  category: "Herbs",
  unit: "bunch",
  price: 1.0,
  countInStock: 50,
  rating: 0,
  numReviews: 0
},
{
  name: "Green Onion",
  image: "/assets/images/products/green-onion",
  description: "Fresh green onion",
  brand: "Choucair",
  category: "Herbs",
  unit: "bunch",
  price: 0.6,
  countInStock: 90,
  rating: 0,
  numReviews: 0
},
{
  name: "Leek",
  image: "/assets/images/products/leek",
  description: "Fresh leek",
  brand: "Choucair",
  category: "Herbs",
  unit: "bunch",
  price: 1.2,
  countInStock: 40,
  rating: 0,
  numReviews: 0
},
{
  name: "Fennel",
  image: "/assets/images/products/fennel",
  description: "Fresh fennel",
  brand: "Choucair",
  category: "Herbs",
  unit: "piece",
  price: 1.5,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Tarragon",
  image: "/assets/images/products/tarragon",
  description: "Fresh tarragon",
  brand: "Choucair",
  category: "Herbs",
  unit: "bunch",
  price: 1.2,
  countInStock: 35,
  rating: 0,
  numReviews: 0
},
{
  name: "Chives",
  image: "/assets/images/products/chives",
  description: "Fresh chives",
  brand: "Choucair",
  category: "Herbs",
  unit: "bunch",
  price: 1.0,
  countInStock: 40,
  rating: 0,
  numReviews: 0
},

/* ===================== NUTS ===================== */
{
  name: "Almond Raw",
  image: "/assets/images/products/almond-raw",
  description: "Raw almonds",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 12.0,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Almond Roasted",
  image: "/assets/images/products/almond-roasted",
  description: "Roasted almonds",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 13.0,
  countInStock: 15,
  rating: 0,
  numReviews: 0
},
{
  name: "Cashew Raw",
  image: "/assets/images/products/cashew-raw",
  description: "Raw cashew nuts",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 14.0,
  countInStock: 15,
  rating: 0,
  numReviews: 0
},
{
  name: "Cashew Roasted",
  image: "/assets/images/products/cashew-roasted",
  description: "Roasted cashew nuts",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 15.0,
  countInStock: 12,
  rating: 0,
  numReviews: 0
},
{
  name: "Pistachio Shelled",
  image: "/assets/images/products/pistachio-shelled",
  description: "Shelled pistachio",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 18.0,
  countInStock: 10,
  rating: 0,
  numReviews: 0
},
{
  name: "Pistachio Unshelled",
  image: "/assets/images/products/pistachio-unshelled",
  description: "Unshelled pistachio",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 16.0,
  countInStock: 10,
  rating: 0,
  numReviews: 0
},
{
  name: "Walnut",
  image: "/assets/images/products/walnut",
  description: "Walnuts",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 11.0,
  countInStock: 15,
  rating: 0,
  numReviews: 0
},
{
  name: "Hazelnut",
  image: "/assets/images/products/hazelnut",
  description: "Hazelnuts",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 13.0,
  countInStock: 12,
  rating: 0,
  numReviews: 0
},
{
  name: "Peanut",
  image: "/assets/images/products/peanut",
  description: "Peanuts",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 6.0,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Pine Nuts",
  image: "/assets/images/products/pine-nuts",
  description: "Pine nuts",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 28.0,
  countInStock: 6,
  rating: 0,
  numReviews: 0
},
{
  name: "Macadamia",
  image: "/assets/images/products/macadamia",
  description: "Macadamia nuts",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 30.0,
  countInStock: 6,
  rating: 0,
  numReviews: 0
},
{
  name: "Pecan",
  image: "/assets/images/products/pecan",
  description: "Pecan nuts",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 22.0,
  countInStock: 8,
  rating: 0,
  numReviews: 0
},
{
  name: "Mixed Nuts",
  image: "/assets/images/products/mixed-nuts",
  description: "Mixed nuts",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 16.0,
  countInStock: 18,
  rating: 0,
  numReviews: 0
},
{
  name: "Sunflower Seeds",
  image: "/assets/images/products/sunflower-seeds",
  description: "Sunflower seeds",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 5.0,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Pumpkin Seeds",
  image: "/assets/images/products/pumpkin-seeds",
  description: "Pumpkin seeds",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 10.0,
  countInStock: 15,
  rating: 0,
  numReviews: 0
},
{
  name: "Sesame Seeds",
  image: "/assets/images/products/sesame-seeds",
  description: "Sesame seeds",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 6.0,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Chickpeas Roasted",
  image: "/assets/images/products/roasted-chickpeas",
  description: "Roasted chickpeas",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 6.5,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Corn Nuts",
  image: "/assets/images/products/corn-nuts",
  description: "Crunchy corn nuts",
  brand: "Choucair",
  category: "Nuts",
  unit: "kg",
  price: 7.0,
  countInStock: 18,
  rating: 0,
  numReviews: 0
},

/* ===================== FRESH JUICES ===================== */
{
  name: "Orange Juice",
  image: "/assets/images/products/orange-juice",
  description: "Fresh orange juice",
  brand: "Choucair",
  category: "Fresh Juices",
  unit: "cup",
  price: 2.5,
  countInStock: 60,
  rating: 0,
  numReviews: 0
},
{
  name: "Lemonade",
  image: "/assets/images/products/lemonade",
  description: "Fresh lemonade",
  brand: "Choucair",
  category: "Fresh Juices",
  unit: "cup",
  price: 2.2,
  countInStock: 60,
  rating: 0,
  numReviews: 0
},
{
  name: "Carrot Juice",
  image: "/assets/images/products/carrot-juice",
  description: "Fresh carrot juice",
  brand: "Choucair",
  category: "Fresh Juices",
  unit: "cup",
  price: 2.8,
  countInStock: 45,
  rating: 0,
  numReviews: 0
},
{
  name: "Apple Juice",
  image: "/assets/images/products/apple-juice",
  description: "Fresh apple juice",
  brand: "Choucair",
  category: "Fresh Juices",
  unit: "cup",
  price: 2.8,
  countInStock: 45,
  rating: 0,
  numReviews: 0
},
{
  name: "Strawberry Juice",
  image: "/assets/images/products/strawberry-juice",
  description: "Fresh strawberry juice",
  brand: "Choucair",
  category: "Fresh Juices",
  unit: "cup",
  price: 3.2,
  countInStock: 35,
  rating: 0,
  numReviews: 0
},
{
  name: "Mango Juice",
  image: "/assets/images/products/mango-juice",
  description: "Fresh mango juice",
  brand: "Choucair",
  category: "Fresh Juices",
  unit: "cup",
  price: 3.5,
  countInStock: 35,
  rating: 0,
  numReviews: 0
},
{
  name: "Pineapple Juice",
  image: "/assets/images/products/pineapple-juice",
  description: "Fresh pineapple juice",
  brand: "Choucair",
  category: "Fresh Juices",
  unit: "cup",
  price: 3.2,
  countInStock: 35,
  rating: 0,
  numReviews: 0
},
{
  name: "Pomegranate Juice",
  image: "/assets/images/products/pomegranate-juice",
  description: "Fresh pomegranate juice",
  brand: "Choucair",
  category: "Fresh Juices",
  unit: "cup",
  price: 4.0,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Watermelon Juice",
  image: "/assets/images/products/watermelon-juice",
  description: "Fresh watermelon juice",
  brand: "Choucair",
  category: "Fresh Juices",
  unit: "cup",
  price: 2.5,
  countInStock: 40,
  rating: 0,
  numReviews: 0
},
{
  name: "Avocado Smoothie",
  image: "/assets/images/products/avocado-smoothie",
  description: "Avocado smoothie",
  brand: "Choucair",
  category: "Fresh Juices",
  unit: "cup",
  price: 4.5,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Banana Milkshake",
  image: "/assets/images/products/banana-milkshake",
  description: "Banana milkshake",
  brand: "Choucair",
  category: "Fresh Juices",
  unit: "cup",
  price: 3.5,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Mixed Fruits Juice",
  image: "/assets/images/products/mixed-fruits-juice",
  description: "Mixed fruits juice",
  brand: "Choucair",
  category: "Fresh Juices",
  unit: "cup",
  price: 3.0,
  countInStock: 45,
  rating: 0,
  numReviews: 0
},
{
  name: "Detox Green Juice",
  image: "/assets/images/products/detox-green-juice",
  description: "Detox green juice",
  brand: "Choucair",
  category: "Fresh Juices",
  unit: "cup",
  price: 3.8,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Beetroot Juice",
  image: "/assets/images/products/beetroot-juice",
  description: "Fresh beetroot juice",
  brand: "Choucair",
  category: "Fresh Juices",
  unit: "cup",
  price: 3.0,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Ginger Lemon Juice",
  image: "/assets/images/products/ginger-lemon-juice",
  description: "Ginger lemon juice",
  brand: "Choucair",
  category: "Fresh Juices",
  unit: "cup",
  price: 2.8,
  countInStock: 35,
  rating: 0,
  numReviews: 0
},

/* ===================== DATES ===================== */
{
  name: "Medjool Dates",
  image: "/assets/images/products/medjool-dates",
  description: "Premium Medjool dates",
  brand: "Choucair",
  category: "Dates",
  unit: "kg",
  price: 10.0,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Ajwa Dates",
  image: "/assets/images/products/ajwa-dates",
  description: "Ajwa dates",
  brand: "Choucair",
  category: "Dates",
  unit: "kg",
  price: 14.0,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Deglet Noor",
  image: "/assets/images/products/deglet-noor",
  description: "Deglet Noor dates",
  brand: "Choucair",
  category: "Dates",
  unit: "kg",
  price: 8.0,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Sukkari Dates",
  image: "/assets/images/products/sukkari-dates",
  description: "Sukkari dates",
  brand: "Choucair",
  category: "Dates",
  unit: "kg",
  price: 11.0,
  countInStock: 22,
  rating: 0,
  numReviews: 0
},
{
  name: "Khudri Dates",
  image: "/assets/images/products/khudri-dates",
  description: "Khudri dates",
  brand: "Choucair",
  category: "Dates",
  unit: "kg",
  price: 9.0,
  countInStock: 24,
  rating: 0,
  numReviews: 0
},
{
  name: "Barhi Dates",
  image: "/assets/images/products/barhi-dates",
  description: "Barhi dates",
  brand: "Choucair",
  category: "Dates",
  unit: "kg",
  price: 12.0,
  countInStock: 18,
  rating: 0,
  numReviews: 0
},
{
  name: "Mabroom Dates",
  image: "/assets/images/products/mabroom-dates",
  description: "Mabroom dates",
  brand: "Choucair",
  category: "Dates",
  unit: "kg",
  price: 13.0,
  countInStock: 18,
  rating: 0,
  numReviews: 0
},
{
  name: "Safawi Dates",
  image: "/assets/images/products/safawi-dates",
  description: "Safawi dates",
  brand: "Choucair",
  category: "Dates",
  unit: "kg",
  price: 10.5,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Stuffed Dates",
  image: "/assets/images/products/stuffed-dates",
  description: "Stuffed dates assorted",
  brand: "Choucair",
  category: "Dates",
  unit: "box",
  price: 7.0,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Date Paste",
  image: "/assets/images/products/date-paste",
  description: "Date paste",
  brand: "Choucair",
  category: "Dates",
  unit: "box",
  price: 5.0,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},

/* ===================== IMPORTED FRUITS ===================== */
{
  name: "Dragon Fruit",
  image: "/assets/images/products/dragon-fruit",
  description: "Imported dragon fruit",
  brand: "Choucair",
  category: "Imported Fruits",
  unit: "piece",
  price: 4.0,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Passion Fruit",
  image: "/assets/images/products/passion-fruit",
  description: "Imported passion fruit",
  brand: "Choucair",
  category: "Imported Fruits",
  unit: "kg",
  price: 12.0,
  countInStock: 10,
  rating: 0,
  numReviews: 0
},
{
  name: "Papaya",
  image: "/assets/images/products/papaya",
  description: "Imported papaya",
  brand: "Choucair",
  category: "Imported Fruits",
  unit: "piece",
  price: 5.0,
  countInStock: 15,
  rating: 0,
  numReviews: 0
},
{
  name: "Lychee",
  image: "/assets/images/products/lychee",
  description: "Imported lychee",
  brand: "Choucair",
  category: "Imported Fruits",
  unit: "kg",
  price: 16.0,
  countInStock: 8,
  rating: 0,
  numReviews: 0
},
{
  name: "Rambutan",
  image: "/assets/images/products/rambutan",
  description: "Imported rambutan",
  brand: "Choucair",
  category: "Imported Fruits",
  unit: "kg",
  price: 17.0,
  countInStock: 8,
  rating: 0,
  numReviews: 0
},
{
  name: "Mangosteen",
  image: "/assets/images/products/mangosteen",
  description: "Imported mangosteen",
  brand: "Choucair",
  category: "Imported Fruits",
  unit: "kg",
  price: 18.0,
  countInStock: 7,
  rating: 0,
  numReviews: 0
},
{
  name: "Kiwi Gold",
  image: "/assets/images/products/kiwi-gold",
  description: "Imported golden kiwi",
  brand: "Choucair",
  category: "Imported Fruits",
  unit: "kg",
  price: 8.0,
  countInStock: 12,
  rating: 0,
  numReviews: 0
},
{
  name: "Blueberry Imported",
  image: "/assets/images/products/blueberry-imported",
  description: "Imported blueberries",
  brand: "Choucair",
  category: "Imported Fruits",
  unit: "kg",
  price: 14.0,
  countInStock: 10,
  rating: 0,
  numReviews: 0
},
{
  name: "Raspberry Imported",
  image: "/assets/images/products/raspberry-imported",
  description: "Imported raspberries",
  brand: "Choucair",
  category: "Imported Fruits",
  unit: "kg",
  price: 16.0,
  countInStock: 8,
  rating: 0,
  numReviews: 0
},
{
  name: "Blackberry",
  image: "/assets/images/products/blackberry",
  description: "Imported blackberry",
  brand: "Choucair",
  category: "Imported Fruits",
  unit: "kg",
  price: 16.0,
  countInStock: 8,
  rating: 0,
  numReviews: 0
},
{
  name: "Cranberry",
  image: "/assets/images/products/cranberry",
  description: "Imported cranberry",
  brand: "Choucair",
  category: "Imported Fruits",
  unit: "kg",
  price: 15.0,
  countInStock: 8,
  rating: 0,
  numReviews: 0
},
{
  name: "Coconut",
  image: "/assets/images/products/coconut",
  description: "Imported coconut",
  brand: "Choucair",
  category: "Imported Fruits",
  unit: "piece",
  price: 3.5,
  countInStock: 18,
  rating: 0,
  numReviews: 0
},
{
  name: "Star Fruit",
  image: "/assets/images/products/star-fruit",
  description: "Imported star fruit",
  brand: "Choucair",
  category: "Imported Fruits",
  unit: "kg",
  price: 9.0,
  countInStock: 10,
  rating: 0,
  numReviews: 0
},
{
  name: "Guava",
  image: "/assets/images/products/guava",
  description: "Imported guava",
  brand: "Choucair",
  category: "Imported Fruits",
  unit: "kg",
  price: 7.0,
  countInStock: 12,
  rating: 0,
  numReviews: 0
},
{
  name: "Physalis",
  image: "/assets/images/products/physalis",
  description: "Imported physalis",
  brand: "Choucair",
  category: "Imported Fruits",
  unit: "box",
  price: 5.0,
  countInStock: 12,
  rating: 0,
  numReviews: 0
},

/* ===================== MOUNEH BALADIYE ===================== */
{
  name: "Olive Oil",
  image: "/assets/images/products/olive-oil",
  description: "Baladi olive oil",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "jar",
  price: 9.0,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Olives Green",
  image: "/assets/images/products/olives-green",
  description: "Green olives",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "jar",
  price: 4.0,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Olives Black",
  image: "/assets/images/products/olives-black",
  description: "Black olives",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "jar",
  price: 4.0,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Labneh Balls in Oil",
  image: "/assets/images/products/labneh-balls",
  description: "Labneh balls in oil",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "jar",
  price: 6.0,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Pickled Cucumber",
  image: "/assets/images/products/pickled-cucumber",
  description: "Pickled cucumber",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "jar",
  price: 3.0,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Pickled Turnip",
  image: "/assets/images/products/pickled-turnip",
  description: "Pickled turnip",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "jar",
  price: 3.0,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Pickled Eggplant",
  image: "/assets/images/products/pickled-eggplant",
  description: "Pickled eggplant",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "jar",
  price: 4.0,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Tomato Paste",
  image: "/assets/images/products/tomato-paste",
  description: "Homemade tomato paste",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "jar",
  price: 4.5,
  countInStock: 18,
  rating: 0,
  numReviews: 0
},
{
  name: "Chili Paste",
  image: "/assets/images/products/chili-paste",
  description: "Homemade chili paste",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "jar",
  price: 4.5,
  countInStock: 18,
  rating: 0,
  numReviews: 0
},
{
  name: "Dried Mint",
  image: "/assets/images/products/dried-mint",
  description: "Dried mint",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "jar",
  price: 3.5,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Dried Thyme",
  image: "/assets/images/products/dried-thyme",
  description: "Dried thyme",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "jar",
  price: 3.5,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Dried Oregano",
  image: "/assets/images/products/dried-oregano",
  description: "Dried oregano",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "jar",
  price: 3.5,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Makdous",
  image: "/assets/images/products/makdous",
  description: "Traditional makdous",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "jar",
  price: 6.0,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Kishk",
  image: "/assets/images/products/kishk",
  description: "Traditional kishk",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "bag",
  price: 5.0,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Grape Molasses (Dibs)",
  image: "/assets/images/products/dibs",
  description: "Grape molasses (dibs)",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "jar",
  price: 5.0,
  countInStock: 20,
  rating: 0,
  numReviews: 0
},
{
  name: "Fig Jam",
  image: "/assets/images/products/fig-jam",
  description: "Homemade fig jam",
  brand: "Choucair",
  category: "Mouneh Baladiye",
  unit: "jar",
  price: 4.5,
  countInStock: 22,
  rating: 0,
  numReviews: 0
},

/* ===================== READY TO EAT ===================== */
{
  name: "Cut Fruit Cup",
  image: "/assets/images/products/cut-fruit-cup",
  description: "Fresh cut fruit cup",
  brand: "Choucair",
  category: "Ready to Eat",
  unit: "cup",
  price: 3.0,
  countInStock: 40,
  rating: 0,
  numReviews: 0
},
{
  name: "Mixed Fruit Cup",
  image: "/assets/images/products/mixed-fruit-cup",
  description: "Mixed fruit cup",
  brand: "Choucair",
  category: "Ready to Eat",
  unit: "cup",
  price: 3.5,
  countInStock: 35,
  rating: 0,
  numReviews: 0
},
{
  name: "Fruit Salad",
  image: "/assets/images/products/fruit-salad",
  description: "Fresh fruit salad",
  brand: "Choucair",
  category: "Ready to Eat",
  unit: "box",
  price: 4.0,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Ready Green Salad",
  image: "/assets/images/products/ready-green-salad",
  description: "Ready green salad",
  brand: "Choucair",
  category: "Ready to Eat",
  unit: "box",
  price: 4.0,
  countInStock: 35,
  rating: 0,
  numReviews: 0
},
{
  name: "Coleslaw",
  image: "/assets/images/products/coleslaw",
  description: "Fresh coleslaw",
  brand: "Choucair",
  category: "Ready to Eat",
  unit: "box",
  price: 3.5,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Cut Vegetables Box",
  image: "/assets/images/products/cut-vegetables-box",
  description: "Fresh cut vegetables box",
  brand: "Choucair",
  category: "Ready to Eat",
  unit: "box",
  price: 4.0,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Avocado Cup",
  image: "/assets/images/products/avocado-cup",
  description: "Avocado cup",
  brand: "Choucair",
  category: "Ready to Eat",
  unit: "cup",
  price: 4.0,
  countInStock: 25,
  rating: 0,
  numReviews: 0
},
{
  name: "Hummus Cup",
  image: "/assets/images/products/hummus-cup",
  description: "Hummus cup",
  brand: "Choucair",
  category: "Ready to Eat",
  unit: "cup",
  price: 2.5,
  countInStock: 35,
  rating: 0,
  numReviews: 0
},
{
  name: "Baba Ghanoush Cup",
  image: "/assets/images/products/baba-ghanoush-cup",
  description: "Baba ghanoush cup",
  brand: "Choucair",
  category: "Ready to Eat",
  unit: "cup",
  price: 2.8,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Tabouleh",
  image: "/assets/images/products/tabouleh",
  description: "Fresh tabouleh",
  brand: "Choucair",
  category: "Ready to Eat",
  unit: "box",
  price: 3.5,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Fattoush",
  image: "/assets/images/products/fattoush",
  description: "Fresh fattoush",
  brand: "Choucair",
  category: "Ready to Eat",
  unit: "box",
  price: 3.5,
  countInStock: 30,
  rating: 0,
  numReviews: 0
},
{
  name: "Boiled Corn Cup",
  image: "/assets/images/products/boiled-corn-cup",
  description: "Boiled corn cup",
  brand: "Choucair",
  category: "Ready to Eat",
  unit: "cup",
  price: 2.0,
  countInStock: 40,
  rating: 0,
  numReviews: 0
},
{
  name: "Roasted Nuts Cup",
  image: "/assets/images/products/roasted-nuts-cup",
  description: "Roasted nuts cup",
  brand: "Choucair",
  category: "Ready to Eat",
  unit: "cup",
  price: 2.5,
  countInStock: 35,
  rating: 0,
  numReviews: 0
},
{
  name: "Fresh Juice Cup",
  image: "/assets/images/products/fresh-juice-cup",
  description: "Fresh juice cup",
  brand: "Choucair",
  category: "Ready to Eat",
  unit: "cup",
  price: 2.5,
  countInStock: 40,
  rating: 0,
  numReviews: 0
}

];


const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const importData = async () => {
  try {
    await connectDB();

    console.log('🗑️  Clearing existing data...');
    try {
      await mongoose.connection.db.dropCollection('orders');
    } catch (e) {
      console.log('Orders collection not found or already empty');
    }
    await Product.deleteMany();
    await User.deleteMany();
    await Category.deleteMany();

    console.log('👤 Creating users...');
    const createdUsers = await User.insertMany(users.map(user => ({
      ...user,
      password: bcrypt.hashSync('123456', 10)
    })));
    const adminUser = createdUsers[0]._id;
    const regularUsers = createdUsers.slice(1);

    console.log('🏷️  Creating categories...');
    const createdCategories = await Category.insertMany(categories);
    
    // Map category names to IDs
    const categoryMap = {};
    createdCategories.forEach(cat => {
      categoryMap[cat.name] = cat._id;
    });

    console.log('🍎 Creating products...');
    const normalizeUnit = (rawUnit) => {
      if (!rawUnit) return '1kg';
      const u = String(rawUnit).trim().toLowerCase();
      if (u === '1kg' || u === '1 kg' || u === 'kg' || u === 'kilogram' || u === 'kilograms' || u === 'kilo') return '1kg';
      if (u === '500g' || u === '500 g' || u === '0.5kg' || u === 'half kg' || u === 'g') return '500g';
      if (u === '200g' || u === '200 g' || u === '0.2kg' || u === '250g' || u === '250 g') return '200g';
      if (u === 'bunch' || u === 'bunches' || u === 'bundle' || u === 'bundles') return 'bunch';
      if (u === 'piece' || u === 'peice' || u === 'pieces' || u === 'peices' || u === 'pcs' || u === 'pc' || u === 'unit') return 'piece';
      if (u === 'pack' || u === 'packs' || u === 'box' || u === 'boxes' || u === 'jar' || u === 'bottle' || u === 'cup' || u === 'cups' || u === 'bag' || u === 'tub') return 'pack';
      return '1kg';
    };

    const sampleProducts = products.map(product => {
      return { 
        ...product, 
        unit: normalizeUnit(product.unit),
        user: adminUser, 
        category: categoryMap[product.category] || createdCategories[0]._id 
      };
    });
    const createdProducts = await Product.insertMany(sampleProducts);

    console.log('📦 Creating orders (for recommendation engine)...');
    const orders = [];
    
    // Create 50 random orders
    for (let i = 0; i < 50; i++) {
      const randomUser = regularUsers[Math.floor(Math.random() * regularUsers.length)];
      
      // Pick 2-5 random products
      const numItems = Math.floor(Math.random() * 4) + 2;
      const orderItems = [];
      let totalPrice = 0;
      
      // Shuffle products to pick random ones
      const shuffledProducts = [...createdProducts].sort(() => 0.5 - Math.random());
      const selectedProducts = shuffledProducts.slice(0, numItems);
      
      selectedProducts.forEach(product => {
        const qty = Math.floor(Math.random() * 3) + 1;
        orderItems.push({
          name: product.name,
          qty: qty,
          image: product.image,
          price: product.price,
          product: product._id
        });
        totalPrice += product.price * qty;
      });

      orders.push({
        user: randomUser._id,
        orderItems,
        customerInfo: {
          name: randomUser.name,
          email: randomUser.email || `${randomUser.phone.replace('+', '')}@example.com`,
          phone: randomUser.phone,
          address: '123 Main St',
          city: 'New York',
          postalCode: '10001',
          country: 'USA'
        },
        paymentMethod: 'Cash on Delivery',
        itemsPrice: totalPrice,
        shippingPrice: 10,
        totalPrice: totalPrice + 10,
        status: Math.random() > 0.5 ? 'Delivered' : 'Pending',
        isPaid: true,
        isDelivered: Math.random() > 0.5
      });
    }
    
    await Order.insertMany(orders);

    console.log('✅ Data Imported Successfully!');
    process.exit();
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};

importData();
