import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';
import slugify from 'slugify';
import Product from '../models/productModel.js';
import Category from '../models/categoryModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuration
const PUBLIC_DIR = path.join(__dirname, '../../public');
const IMAGES_BASE_DIR = path.join(PUBLIC_DIR, 'assets/images/products');
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const WIKI_USER_AGENT = 'ChocairFreshBot/1.0 (admin@chocair.com) BasedOnAxios/1.0';

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Search Strategies
const strategies = {
  wikimedia: async (query) => {
    try {
      const searchUrl = 'https://commons.wikimedia.org/w/api.php';
      const params = {
        action: 'query',
        generator: 'search',
        gsrnamespace: 6, // File namespace
        gsrsearch: `File:${query} -dish -plate -cooked filetype:bitmap`,
        gsrlimit: 5,
        prop: 'imageinfo',
        iiprop: 'url',
        format: 'json',
        origin: '*'
      };

      const response = await axios.get(searchUrl, { 
          params, 
          headers: { 'User-Agent': WIKI_USER_AGENT } 
      });
      
      if (response.data.query && response.data.query.pages) {
        const pages = response.data.query.pages;
        for (const pageId of Object.keys(pages)) {
            const imageInfo = pages[pageId].imageinfo;
            if (imageInfo && imageInfo.length > 0) {
                const url = imageInfo[0].url;
                const ext = path.extname(url).toLowerCase();
                if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
                    return url;
                }
            }
        }
      }
      return null;
    } catch (error) {
      console.error(`Wikimedia search error for "${query}":`, error.message);
      return null;
    }
  },

  google: async (query) => {
      try {
          // Simple Google Images scraper (very basic, might break)
          const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&tbm=isch&tbs=isz:m`;
          const response = await axios.get(searchUrl, {
              headers: {
                  'User-Agent': USER_AGENT,
                  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                  'Accept-Language': 'en-US,en;q=0.5'
              }
          });
          
          // Look for image URLs in the script tags or img tags
          const html = response.data;
          // Improved regex to avoid malformed URLs
          const regex = /https?:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^"]*?\.(jpg|jpeg|png)/gi;
          const matches = html.match(regex);
          
          if (matches) {
              // Filter out small thumbnails, icons, and known bad domains
              const validMatches = matches.filter(url => 
                  !url.includes('encrypted-tbn0') && 
                  !url.includes('gstatic.com') &&
                  !url.includes('favicon') &&
                  url.length > 20
              );
              
              if (validMatches.length > 0) {
                  return validMatches[0];
              }
          }
          return null;
      } catch (error) {
          return null;
      }
  },

  bing: async (query) => {
      try {
          const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(query)}`;
          const response = await axios.get(searchUrl, {
              headers: {
                  'User-Agent': USER_AGENT
              }
          });
          
          const html = response.data;
          // Bing stores images in murl (media url) inside JSON-like structures
          const regex = /murl&quot;:&quot;(https?:\/\/[^&]+?\.(jpg|jpeg|png))&quot;/gi;
          let match;
          const urls = [];
          while ((match = regex.exec(html)) !== null) {
              urls.push(match[1]);
          }
          
          if (urls.length > 0) {
              return urls[0];
          }
          return null;
      } catch (error) {
          return null;
      }
  },

  pexels: async (query) => {
    try {
      const searchUrl = `https://www.pexels.com/search/${encodeURIComponent(query)}/`;
      const response = await axios.get(searchUrl, { 
        headers: { 
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
        } 
      });
      
      const $ = cheerio.load(response.data);
      const img = $('img[src*="images.pexels.com/photos"]').first();
      
      if (img.length) {
        let src = img.attr('src');
        if (src) {
            src = src.split('?')[0] + '?auto=compress&cs=tinysrgb&w=800';
            return src;
        }
      }
      return null;
    } catch (error) {
      return null;
    }
  },
  
  unsplash: async (query) => {
      try {
          const searchUrl = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
          const response = await axios.get(searchUrl, {
              headers: {
                  'User-Agent': USER_AGENT
              }
          });
          const $ = cheerio.load(response.data);
          const img = $('img[src*="images.unsplash.com/photo-"]').first();
          if (img.length) {
              let src = img.attr('src');
              if (src) {
                  src = src.split('?')[0] + '?w=800&q=80';
                  return src;
              }
          }
          return null;
      } catch (error) {
          return null;
      }
  }
};

const downloadImage = async (url, filepath, retries = 3) => {
  try {
    const isWiki = url.includes('wikimedia') || url.includes('wikipedia');
    const headers = {
        'User-Agent': isWiki ? WIKI_USER_AGENT : USER_AGENT,
        'Referer': isWiki ? 'https://commons.wikimedia.org/' : 'https://www.google.com/'
    };

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      headers,
      timeout: 10000
    });

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(filepath);
      response.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  } catch (error) {
    if (error.response && error.response.status === 429 && retries > 0) {
        console.log(`⏳ Rate limited. Waiting 10s before retry... (${retries} left)`);
        await delay(10000);
        return downloadImage(url, filepath, retries - 1);
    }
    throw new Error(`Failed to download image: ${error.message}`);
  }
};

const processProducts = async () => {
  await connectDB();

  console.log('📚 Fetching categories...');
  const categories = await Category.find({});
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat._id.toString()] = cat.name;
  });

  const products = await Product.find({});
  console.log(`Found ${products.length} products. Starting image download process...`);

  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (const product of products) {
    const categoryName = categoryMap[product.category] || 'uncategorized';
    const categorySlug = slugify(categoryName, { lower: true });
    const productSlug = slugify(product.name, { lower: true });
    
    const categoryDir = path.join(IMAGES_BASE_DIR, categorySlug);
    ensureDir(categoryDir);

    const fileName = `${productSlug}.jpg`;
    const filePath = path.join(categoryDir, fileName);
    const publicPath = `/assets/images/products/${categorySlug}/${fileName}`;

    // Check if file already exists
    if (fs.existsSync(filePath)) {
      // UpdateBing
        imageUrl = await strategies.bing(query);
        if (imageUrl) { source = 'Bing'; break; }

        // Try  DB just in case
      if (product.image !== publicPath) {
          product.image = publicPath;
          await product.save();
          console.log(`Updated DB path for existing image: ${product.name}`);
      }
      skipCount++;
      continue;
    }

    console.log(`🔍 Searching for: ${product.name} (${categoryName})...`);

    const queries = [
        `fresh ${product.name} isolated`,
        `fresh ${product.name} vegetable`,
        `${product.name} grocery`
    ];

    let imageUrl = null;
    let source = '';

    // Try strategies
    for (const query of queries) {
        if (imageUrl) break;
        
        // Try Wikimedia
        imageUrl = await strategies.wikimedia(query);
        if (imageUrl) { source = 'Wikimedia'; break; }
        
        // Try Google
        imageUrl = await strategies.google(query);
        if (imageUrl) { source = 'Google'; break; }

        // Try Pexels
        imageUrl = await strategies.pexels(query);
        if (imageUrl) { source = 'Pexels'; break; }

        // Try Unsplash
        imageUrl = await strategies.unsplash(query);
        if (imageUrl) { source = 'Unsplash'; break; }
        
        await delay(1000); // Polite delay
    }

    if (imageUrl) {
      try {
        console.log(`⬇️  Downloading from ${source}: ${imageUrl}`);
        await downloadImage(imageUrl, filePath);
        
        product.image = publicPath;
        await product.save();
        
        console.log(`✅ Saved image for ${product.name}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to download/save for ${product.name}: ${error.message}`);
        failCount++;
      }
    } else {
      console.log(`⚠️  No image found for ${product.name}`);
      failCount++;
    }

    await delay(3000); // Delay between products
  }

  console.log('\n==========================================');
  console.log(`Process Complete!`);
  console.log(`Success: ${successCount}`);
  console.log(`Skipped (Existing): ${skipCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('==========================================');

  process.exit();
};

processProducts();
