import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/productModel.js';
import connectDB from './config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

const PUBLIC_DIR = path.join(__dirname, '../public');
const IMAGES_DIR = path.join(PUBLIC_DIR, 'assets/images/products');

// Helper to find image file recursively
function findImageFile(dir, filenameBase) {
    if (!fs.existsSync(dir)) return null;
    
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            const found = findImageFile(fullPath, filenameBase);
            if (found) return found;
        } else {
            const nameWithoutExt = path.parse(file).name;
            // Strict match on name
            if (nameWithoutExt === filenameBase && !file.includes('-user')) {
                // Return path relative to public
                return fullPath.replace(PUBLIC_DIR, '').replace(/\\/g, '/');
            }
        }
    }
    return null;
}

const fixImages = async () => {
    try {
        await connectDB();
        
        const products = await Product.find({});
        console.log(`Found ${products.length} products locally.`);

        let updatedCount = 0;
        let missingCount = 0;

        for (const product of products) {
            // Assume current format is /assets/images/products/[name]
            const currentPath = product.image;
            
            // Skip if already has extension or looks like a full URL or placebo
             if (currentPath.endsWith('.jpg') || currentPath.endsWith('.jpeg') || currentPath.endsWith('.png') || currentPath.startsWith('http')) {
                // console.log(`Skipping valid/external: ${product.name} -> ${currentPath}`);
                continue;
            }

            const basename = path.basename(currentPath);
            
            // Try to find the file
            const newPath = findImageFile(IMAGES_DIR, basename);

            if (newPath) {
                console.log(`✅ UPDATING: ${product.name} | ${basename} -> ${newPath}`);
                product.image = newPath;
                await product.save();
                updatedCount++;
            } else {
                console.log(`❌ MISSING: ${product.name} | ${basename}`);
                missingCount++;
            }
        }

        console.log(`Summary: Updated ${updatedCount}, Missing ${missingCount}`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

fixImages();
