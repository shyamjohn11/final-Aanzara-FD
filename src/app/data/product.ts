export interface Product {
  id: string;
  name: string;
  description: string;
  brand: string;
  sku: string;
  price: number;
  mrp: number;
  moq: number;
  pack: string;
  dispatch: string;
  swatch: string;
  accent: string;
  discount: number;
  rating: number;
  reviews: number;
  bulkRate: number;
  bulkMoq: number;
  inStock: boolean; // Add this field
}