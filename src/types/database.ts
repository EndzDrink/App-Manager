export type AppCategory = 'Entertainment' | 'Productivity' | 'Games' | 'Communication' | 'Utilities' | 'Finance';

export interface App {
  id: string;
  name: string;
  category: AppCategory;
  icon_url?: string;
  description?: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  app_id: string;
  plan_name: string;
  price: number;
  currency: string;
  billing_cycle: 'monthly' | 'yearly';
  status: 'active' | 'unused' | 'cancelled';
  renewal_date: string;
  // Joined data for the UI
  app?: App;
}

export interface UsageLog {
  id: string;
  subscription_id: string;
  minutes_used: number;
  log_date: string;
}