import {screen,waitFor} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {describe,it,expect,vi,afterEach} from 'vitest'
import {mockApi} from '@/test/fetch-mock'
import {renderWithProviders} from '@/test/render'
import {ProductEditorPage} from './product-editor-page'
vi.mock('@/features/organizations/provider-context',()=>({useProviderContext:()=>({provider:{id:'shop',status:'ACTIVE'}})}))
afterEach(()=>vi.unstubAllGlobals())
describe('Store product editor',()=>{
 it('creates a draft without selecting any catalogue model and saves its own typed data',async()=>{
  const m=mockApi({'GET /catalog/families':{body:[{code:'PUMPS',name:'Bombas'}]},'POST /providers/shop/listings':{body:{id:'new-product'}},'PATCH /providers/shop/commerce/products/new-product':{body:{id:'new-product'}}})
  renderWithProviders(<ProductEditorPage />)
  await userEvent.type(screen.getByLabelText('Nombre del producto'),'Bomba propia')
  await userEvent.selectOptions(await screen.findByLabelText('Categoría'),'PUMPS')
  await userEvent.type(screen.getByLabelText('Marca'),'Mi marca')
  await userEvent.click(screen.getByRole('button',{name:'Guardar borrador'}))
  await waitFor(()=>expect(m.calls.some(c=>c.method==='PATCH')).toBe(true))
  const body=JSON.parse(m.calls.find(c=>c.method==='POST')!.init.body as string)
  expect(body).toMatchObject({title:'Bomba propia',assetFamilyCode:'PUMPS'})
  expect(body).not.toHaveProperty('assetModelId')
  expect(JSON.parse(m.calls.find(c=>c.method==='PATCH')!.init.body as string)).toMatchObject({brand:'Mi marca',saleMode:'QUOTE',specifications:[]})
 })
})
