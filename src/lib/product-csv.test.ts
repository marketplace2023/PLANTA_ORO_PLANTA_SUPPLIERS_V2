import { describe, it, expect } from 'vitest'
import { parseProductCsv } from './product-csv'

describe('Product import CSV', () => {
  it('reads UTF-8 BOM, quoted commas, escaped quotes, multiline cells and numeric fields', () => {
    const csv = '\ufefftitle,family,sku,price,stock\r\n"Bomba, modelo ""A""\nindustrial",PUMP,SKU-1,25.50,10\r\n'
    expect(parseProductCsv(csv)).toEqual([{ title: 'Bomba, modelo "A"\nindustrial', family: 'PUMP', sku: 'SKU-1', price: 25.5, stock: 10 }])
  })
  it('rejects malformed quotes, missing headers and excessive row counts', () => {
    expect(() => parseProductCsv('title,sku\nBomba,A')).toThrow(/plantilla/)
    expect(() => parseProductCsv('title,family,sku,price,stock\n"Bomba,A,B,1,2')).toThrow(/comillas/)
    expect(() => parseProductCsv('title,family,sku,price,stock\n' + Array.from({ length: 201 }, (_, i) => `Bomba,PUMP,SKU-${i},1,2`).join('\n'))).toThrow(/200/)
  })
})
