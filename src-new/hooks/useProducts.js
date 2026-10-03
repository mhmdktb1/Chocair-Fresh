import { productsStore, useResource } from '../utils/resourceStore';

/** Raw product catalog from the API, shared across the whole app. */
export const useProducts = () => {
  const { data, loading, error, refetch } = useResource(productsStore);
  return { products: data, loading, error, refetch };
};
