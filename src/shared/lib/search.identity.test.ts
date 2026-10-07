import { describe, expect, it } from 'vitest';
import { searchProducts } from './search';
import type { Product } from '@/shared/types/product';
const product = (id: string, code: string, barcode: string, title: string): Product => ({ id, code, barcode, title, description: 'Descripción', category: 'flores', price_1: 10, img: '/image.jpg' });
describe('Commercial identity search', () => {
  it('ranks exact code before barcode and descriptive matches', () => {
    const rows = [product('uuid-a','OTHER','CT-554','CT-554'), product('uuid-b','CT-554','00123','Rosa'), product('uuid-c','TITLE','00234','CT-554')];
    expect(searchProducts(rows,'CT-554').map(row => row.id)).toEqual(['uuid-b','uuid-a','uuid-c']);
  });
  it('finds exact barcode with leading zeroes and still finds names', () => {
    const rows = [product('uuid-a','CT-554','00123','Rosa')];
    expect(searchProducts(rows,'00123')[0].code).toBe('CT-554');
    expect(searchProducts(rows,'Rosa')[0].id).toBe('uuid-a');
  });
});
