import { Order } from "../types";

export interface PicklistItem {
  sku: string;
  quantity: number;
}

export interface PicklistResult {
  items: PicklistItem[];
  totalQuantity: number;
}

export const generatePicklist = (
  orders: Order[],
  selectedRows: number[],
): PicklistResult => {
  // Only selected orders
  const selectedOrders = orders.filter((order) =>
    selectedRows.includes(order.id),
  );

  // Group by SKU
  const skuMap = new Map<string, number>();

  let totalQuantity = 0;

  selectedOrders.forEach((order) => {
    const currentQty = skuMap.get(order.sku) ?? 0;

    skuMap.set(order.sku, currentQty + order.quantity);

    totalQuantity += order.quantity;
  });

  const items: PicklistItem[] = Array.from(skuMap.entries()).map(
    ([sku, quantity]) => ({
      sku,
      quantity,
    }),
  );

  // Optional: sort by SKU
  items.sort((a, b) => a.sku.localeCompare(b.sku));

  return {
    items,
    totalQuantity,
  };
};