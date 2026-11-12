import { ShopOrders } from '@/components/shop-orders';
import { useProviderContext } from '@/features/organizations/provider-context';
export function ShopOrdersPage() { const { provider } = useProviderContext(); return <ShopOrders key={provider!.id} providerId={provider!.id}/>; }
