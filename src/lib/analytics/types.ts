export type EventName =
  | "page_view"
  | "view_item"
  | "view_item_list"
  | "add_to_cart"
  | "remove_from_cart"
  | "view_cart"
  | "begin_checkout"
  | "purchase"
  | "search"
  | "select_vehicle"
  | "sign_up"
  | "login";

export type AnalyticsItem = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
  price: number;
  quantity?: number;
};

export type AnalyticsPayload = {
  // Standard GA4 fields — also forwarded to Klaviyo + Clarity custom events.
  currency?: string;
  value?: number;
  items?: AnalyticsItem[];
  search_term?: string;
  vehicle_year?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  // Catchall
  [key: string]: unknown;
};
