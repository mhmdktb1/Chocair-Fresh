import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import json
import os

def train_clusters():
    # Load data
    csv_path = os.path.join(os.path.dirname(__file__), 'user_features.csv')
    if not os.path.exists(csv_path):
        print("Error: user_features.csv not found. Run extract_user_features.py first.")
        return

    df = pd.read_csv(csv_path)
    print(f"Loaded {len(df)} users.")

    if len(df) < 5:
        print("Warning: Not enough data to cluster effectively. Need at least 5 users.")
        # Create a dummy cluster for everyone if data is too small
        # But for the sake of the script, let's proceed or handle gracefully.
        if len(df) == 0:
            return

    # Select features for clustering
    # Exclude user_id
    feature_cols = [c for c in df.columns if c != 'user_id']
    X = df[feature_cols]

    # Normalize
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # K-Means
    # Use 5 clusters as requested/suggested
    n_clusters = min(5, len(df)) # Handle case with very few users
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)

    # Add cluster to DF
    df['cluster'] = clusters

    # Analyze clusters
    cluster_info = {}
    
    # Calculate centroids (mean values in original scale)
    centroids = df.groupby('cluster')[feature_cols].mean()
    global_means = df[feature_cols].mean()

    print("\nCluster Analysis:")
    for cluster_id in range(n_clusters):
        center = centroids.loc[cluster_id]
        
        # Find distinctive features (highest deviation from global mean)
        # We look for features where this cluster is much higher than average
        
        diffs = (center - global_means) / (global_means + 0.001) # Avoid div by zero
        sorted_diffs = diffs.sort_values(ascending=False)
        
        top_features = sorted_diffs.head(3)
        
        # Generate a label
        label_parts = []
        for feat, score in top_features.items():
            if score > 0.2: # Threshold for "significant" difference
                if 'ratio_' in feat:
                    cat_name = feat.replace('ratio_', '')
                    label_parts.append(f"{cat_name} Lover")
                elif feat == 'total_orders':
                    label_parts.append("Frequent Buyer")
                elif feat == 'avg_items_per_order':
                    label_parts.append("Large Basket")
                elif feat == 'avg_quantity_per_item':
                    label_parts.append("Bulk Item Buyer")
        
        if not label_parts:
            label = "Standard User"
        else:
            label = " & ".join(label_parts[:2]) # Take top 2 characteristics
            
        print(f"Cluster {cluster_id}: {label}")
        print(top_features)
        
        # Store info
        # We also want to know which categories to boost.
        # If ratio_X is high, boost category X.
        boost_categories = []
        for feat, val in center.items():
            if 'ratio_' in feat and val > 0.3: # If > 30% of basket is this category
                cat_name = feat.replace('ratio_', '')
                boost_categories.append(cat_name)
        
        cluster_info[int(cluster_id)] = {
            'name': label,
            'boost_categories': boost_categories,
            'stats': center.to_dict()
        }

    # Save results
    output_data = {
        'user_clusters': {},
        'cluster_definitions': cluster_info
    }

    for _, row in df.iterrows():
        output_data['user_clusters'][str(row['user_id'])] = int(row['cluster'])

    json_path = os.path.join(os.path.dirname(__file__), 'user_clusters.json')
    with open(json_path, 'w') as f:
        json.dump(output_data, f, indent=2)

    print(f"\nCluster data saved to {json_path}")

if __name__ == "__main__":
    train_clusters()
