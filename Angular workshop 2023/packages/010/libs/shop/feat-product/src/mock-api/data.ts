import { Category, Product } from '@shoppie/frontend/type-product';

export const products: Product[] = [...new Array(10)].map((v, i) => {
  return {
    name: `product ${i + 1}`,
    price: 1690,
    description: `Fake description ${i + 1}`,
    advice: `Fake advice ${i + 1}`,
    id: i + 1,
    categoryId: 1,
    quantity: 16
  }
})

export const categories: Category[] = [...new Array(5)].map((v, i) => {
  return {
    name: `category ${i + 1}`,
    description: `Fake description ${i + 1}`,
    id: i + 1
  }
})
