import os
import pandas as pd
import numpy as np
from pymongo import MongoClient
from dotenv import load_dotenv
from collections import defaultdict
import sys
import json

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '../backend-clean/.env')
load_dotenv(env_path)

MONGO_URI = os.getenv('MONGO_URI')
if not MONGO_URI:
    print("Error: MONGO_URI not found in .env file")
    # Fallback for local development if .env is missing or empty
    MONGO_URI = "mongodb://localhost:27017/chocair"
    print(f"Using fallback URI: {MONGO_URI}")

def extract_features():
    print("Connecting to MongoDB...")
    try:
        client = MongoClient(MONGO_URI)
        db = client.get_database()
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")
        return

    print("Fetching products...")
    products_cursor = db.products.find({}, {'_id': 1, 'category': 1})
    product_categories = {}
    for p in products_cursor:
        # Normalize category name (remove special chars, lowercase if needed, but keep consistent)
        cat = p.get('category', 'Unknown')
        product_categories[str(p['_id'])] = cat

    print(f"Loaded {len(product_categories)} products.")
    
    # Save product categories for the backend engine to use
    cat_output_path = os.path.join(os.path.dirname(__file__), 'product_categories.json')
    with open(cat_output_path, 'w') as f:
        json.dump(product_categories, f)
    print(f"Product categories saved to {cat_output_path}")

    print("Fetching orders...")
    orders_cursor = db.orders.find({})
    
    user_data = defaultdict(lambda: {
        'total_orders': 0,
        'total_items': 0,
        'total_quantity': 0,
        'categories': defaultdict(int)
    })

    order_count = 0
    for order in orders_cursor:
        order_count += 1
        # Identify user by phone (most reliable in this schema)
        user_id = order.get('customerInfo', {}).get('phone')
        if not user_id:
            continue

        user_data[user_id]['total_orders'] += 1
        
        for item in order.get('orderItems', []):
            qty = item.get('qty', 0)
            product_id = str(item.get('product'))
            
            user_data[user_id]['total_items'] += 1 # Count unique items (lines) or total quantity? 
            # User request: "avg_items_per_order" usually means line items. 
            # "avg_quantity_per_item" means qty per line item.
            
            user_data[user_id]['total_quantity'] += qty
            
            category = product_categories.get(product_id, 'Unknown')
            user_data[user_id]['categories'][category] += qty # Weight category by quantity

    print(f"Processed {order_count} orders for {len(user_data)} users.")

    # Compute final features
    features_list = []
    
    # Define categories of interest based on user request + common ones
    # "Fruit-focused", "Vegetable-focused", "Nuts", "Drinks"
    # I need to know the exact category strings in DB. 
    # For now I will compute ratios for all found categories, then select specific ones or use all.
    # To be safe and generic, I'll collect all unique categories found.
    
    all_categories = set()
    for u in user_data.values():
        all_categories.update(u['categories'].keys())
    
    # Filter categories to main ones if possible, or just use what's there.
    # Based on user prompt: Fruit, Vegetable, Nuts, Drinks.
    # I will try to map them if the DB has different names, but for now assume they match or are similar.
    # Let's just output all category ratios to be flexible.

    sorted_categories = sorted(list(all_categories))
    print(f"Categories found: {sorted_categories}")

    for user_id, data in user_data.items():
        row = {'user_id': user_id}
        
        # Basic stats
        row['total_orders'] = data['total_orders']
        row['avg_items_per_order'] = data['total_items'] / data['total_orders'] if data['total_orders'] > 0 else 0
        row['avg_quantity_per_item'] = data['total_quantity'] / data['total_items'] if data['total_items'] > 0 else 0
        
        # Category ratios
        total_qty = data['total_quantity']
        for cat in sorted_categories:
            # Create a feature name like 'ratio_Fruits'
            # Clean string to be safe
            safe_cat = "".join(x for x in cat if x.isalnum())
            row[f'ratio_{safe_cat}'] = data['categories'][cat] / total_qty if total_qty > 0 else 0
            
        features_list.append(row)

    # Create DataFrame
    df = pd.DataFrame(features_list)
    
    # Fill NaNs with 0
    df = df.fillna(0)
    
    output_path = os.path.join(os.path.dirname(__file__), 'user_features.csv')
    df.to_csv(output_path, index=False)
    print(f"Features saved to {output_path}")

if __name__ == "__main__":
    extract_features()
