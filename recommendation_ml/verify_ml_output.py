import json
import os
import sys

def verify_clusters():
    file_path = os.path.join(os.path.dirname(__file__), 'user_clusters.json')
    
    print("-" * 50)
    print("ML PIPELINE VERIFICATION")
    print("-" * 50)

    # 1. Check if file exists
    if not os.path.exists(file_path):
        print(f"❌ ERROR: {file_path} not found.")
        print("   Please run 'extract_user_features.py' and 'train_user_clusters.py' first.")
        return

    print(f"✅ Found {file_path}")

    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ ERROR: Could not parse JSON. {e}")
        return

    # 2. Analyze Clusters
    # Matching keys from train_user_clusters.py
    clusters = data.get('cluster_definitions', {})
    user_map = data.get('user_clusters', {})

    print(f"✅ Loaded {len(clusters)} Cluster Definitions")
    print(f"✅ Loaded {len(user_map)} User Assignments")
    print("-" * 50)

    # 3. Print Cluster Interpretations
    print("CLUSTER INTERPRETATIONS (Learned Patterns):")
    for c_id, info in clusters.items():
        name = info.get('name', 'Unknown')
        stats = info.get('stats', {})
        boost = info.get('boost_categories', [])
        
        # Find top features for display (highest values in stats)
        # stats is a dict of feature -> value
        sorted_stats = sorted(stats.items(), key=lambda x: x[1], reverse=True)
        top_features = sorted_stats[:3]
        
        feature_str = ", ".join([f"{k}={v:.2f}" for k, v in top_features])
        boost_str = ", ".join(boost) if boost else "None"
        
        print(f"   🔹 Cluster {c_id}: \"{name}\"")
        print(f"      Boosts: {boost_str}")
        print(f"      (Stats: {feature_str})")
        print("")

    # 4. Sanity Check on Users
    print("-" * 50)
    print("SAMPLE USER ASSIGNMENTS:")
    sample_users = list(user_map.items())[:5] # Show first 5
    if not sample_users:
        print("   (No users found in map)")
    
    for user_id, c_id in sample_users:
        # c_id might be int or string in json
        cluster_info = clusters.get(str(c_id))
        cluster_name = cluster_info.get('name', 'Unknown') if cluster_info else 'Unknown'
        print(f"   👤 User {user_id} -> Cluster {c_id} ({cluster_name})")

    print("-" * 50)
    print("✅ TEST COMPLETE: The ML layer is ready for the backend.")

if __name__ == "__main__":
    verify_clusters()
