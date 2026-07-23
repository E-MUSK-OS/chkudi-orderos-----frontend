export interface Order {
  id: number;
  orderId: string;
  sku: string;
  orderedOn: string;
  onHold: boolean;
  items: number;
  quantity: number;
  processStartTime: string;
  store: string;

  status: "OPEN" | "PRIORITY" | "PICKING" | "TRANSIT";
}