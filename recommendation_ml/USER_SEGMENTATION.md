# User Segmentation & Personalization

This module adds a Machine Learning layer to the recommendation system to personalize product suggestions based on user behavior.

## Overview

We use **Unsupervised Learning (K-Means Clustering)** to group users into distinct segments based on their purchase history. Each segment represents a specific type of buyer (e.g., "Fruit Lover", "Bulk Buyer").

The system then biases recommendations to favor products that align with the user's segment.

## How It Works

### 1. Feature Extraction
We extract behavioral features for each user from the `Orders` collection:
- **Total Orders**: Frequency of purchase.
- **Average Items per Order**: Basket size.
- **Average Quantity per Item**: Bulk buying tendency.
- **Category Ratios**: Percentage of basket dedicated to Fruits, Vegetables, etc.

Script: `recommendation_ml/extract_user_features.py`

### 2. Clustering (ML Model)
We use K-Means clustering to find natural groupings in the data.
- **Algorithm**: K-Means (Scikit-Learn)
- **Input**: Normalized user feature matrix.
- **Output**: Cluster ID for each user.

The model automatically labels clusters based on their dominant features (e.g., if a cluster has high fruit ratio, it's labeled "Fruit Lover").

Script: `recommendation_ml/train_user_clusters.py`
Output: `recommendation_ml/user_clusters.json`

### 3. Recommendation Bias
When generating recommendations:
1. The system checks the user's cluster.
2. It identifies "Boost Categories" for that cluster (e.g., Fruits for "Fruit Lover").
3. It applies a **1.5x score multiplier** to products in those categories.

This ensures that a "Fruit Lover" sees more fruit recommendations, even if they are looking at a non-fruit item (cross-selling) or browsing the cart.

## Integration

The integration is transparent and requires no new API endpoints.
- The `recommendationEngine.js` loads the cluster data on startup.
- The `recommendationController.js` resolves the user's phone number (used as ID) from the `userId` provided in the request body.
- Recommendations are personalized on the fly.

## Why This Approach?

- **Explainable**: We can clearly say "User X is in Cluster Y because they buy a lot of Z".
- **Adaptive**: As users buy more, their features change, and they can move between clusters (requires re-running the scripts).
- **Privacy-Preserving**: We only use aggregated behavioral data, not sensitive personal info.
