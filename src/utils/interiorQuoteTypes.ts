export interface InteriorQuoteProject {
  name: string;
  clientName: string;
  type: 'chung_cu' | 'nha_o' | 'shop';
  area: number;
  tier: 'basic' | 'premium' | 'luxury';
  marginStrategy: 'aggressive' | 'target' | 'premium_margin';
  isOutOfTown: boolean;
}

export interface BOQLineItem {
  id: string;
  category: string;
  subcategory: string;
  itemKey: string;
  itemName: string;
  unit: string;
  quantity: number;
  wasteFactor: number;
  scope: string;
  priceBasic: number | null;
  pricePremium: number | null;
  priceLuxury: number | null;
  selectedPrice: number;
  note: string;
}
