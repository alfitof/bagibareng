import { BillState } from "./types";

const KEY = "bagibareng_share";
const STEP_KEY = "bagibareng_step";

export interface SharePayload {
  people: BillState["people"];
  items: BillState["items"];
  assignments: BillState["assignments"];
  createdAt: string;
}

export function saveShareData(bill: BillState): void {
  const payload: SharePayload = {
    people: bill.people,
    items: bill.items,
    assignments: bill.assignments,
    createdAt: new Date().toISOString(),
  };
  sessionStorage.setItem(KEY, JSON.stringify(payload));
  sessionStorage.setItem(STEP_KEY, String(bill.step));
}

export function loadShareData(): SharePayload | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SharePayload;
  } catch {
    return null;
  }
}

export function loadSavedStep(): number {
  if (typeof window === "undefined") return 0;
  const s = sessionStorage.getItem(STEP_KEY);
  return s ? parseInt(s) : 0;
}
