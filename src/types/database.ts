export type OfferStatus = 'draft' | 'ready' | 'sent' | 'viewed' | 'revision' | 'accepted' | 'won' | 'lost';
export type LeadStatus = 'new' | 'qualifying' | 'offer_sent' | 'follow_up' | 'negotiation' | 'won' | 'lost';
export type EventType = 'KOM' | 'WES' | 'FIR' | 'KON' | 'PRY' | 'GAL' | 'STY' | 'GRI' | 'B2B' | 'BOX' | 'KAW' | 'SPE';
export type DishCategory = 'appetizer' | 'soup' | 'main_course' | 'dessert' | 'salad' | 'drink' | 'bread' | 'addition';

export interface Dish {
  id: string;
  name: string;
  description: string | null;
  category: DishCategory;
  price_per_person: number;
  is_vegetarian: boolean;
  is_vegan: boolean;
  is_gluten_free: boolean;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: string;
  title: string;
  client_id: string | null;
  event_type: EventType;
  event_date: string | null;
  guest_count: number;
  status: OfferStatus;
  total_price: number;
  price_per_person: number;
  notes: string | null;
  public_token: string;
  theme: string | null;
  terms_and_conditions: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OfferItem {
  id: string;
  offer_id: string;
  dish_id: string;
  quantity: number;
  unit_price: number;
  notes: string | null;
  sort_order: number;
}

export interface OfferProposal {
  id: string;
  offer_id: string;
  version: number;
  changes_summary: string | null;
  created_by: string;
  created_at: string;
  snapshot: Record<string, unknown>;
}

export interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  event_type: EventType | null;
  event_date: string | null;
  guest_count: number | null;
  budget: number | null;
  status: LeadStatus;
  source: string | null;
  notes: string | null;
  assigned_to: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
