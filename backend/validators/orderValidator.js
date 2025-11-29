import { z } from 'zod';

const orderItemSchema = z.object({
  product: z.string().min(1, 'Product ID is required'),
  name: z.string().min(1, 'Product name is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  price: z.number().min(0, 'Price must be positive'),
  total: z.number().min(0),
  image: z.string().optional(),
});

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
  shippingAddress: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().min(1, 'Phone is required'),
    street: z.string().min(1, 'Street is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().optional(),
    zipCode: z.string().optional(),
    country: z.string().optional(),
  }),
  paymentMethod: z.enum(['cash', 'card', 'online']),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0).optional(),
  shippingCost: z.number().min(0).optional(),
  discount: z.number().min(0).optional(),
  total: z.number().min(0),
});
