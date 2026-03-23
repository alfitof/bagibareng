export interface BillItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

export interface Person {
  id: string;
  name: string;
  color: string;
  avatar: string;
}

export type Assignments = Record<string, string[]>; // itemId -> personId[]

export interface BillState {
  step: number;
  imageFile: File | null;
  imagePreviewUrl: string | null;
  ocrRawText: string;
  items: BillItem[];
  people: Person[];
  assignments: Assignments;
}
