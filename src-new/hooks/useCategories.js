import { categoriesStore, useResource } from '../utils/resourceStore';

/** Category list from the API, shared across the whole app. */
export const useCategories = () => {
  const { data, loading, error, refetch } = useResource(categoriesStore);
  return { categories: data, loading, error, refetch };
};