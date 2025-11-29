import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  price: z.number().min(0, 'Price must be positive'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  stock: z.number().int().min(0, 'Stock must be a non-negative integer'),
  image: z.string().url('Invalid image URL').optional(),
});
