

export type Item = {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  item_date: string; // ISO string
  image_urls?: string[];
  status: 'lost' | 'found' | 'claimed';
  user_id: string; // User ID
  created_at: string; // ISO string
};

export type Claim = {
  id: string;
  item_id: string;
  claimant_id: string;
  identification_marks: string[];
  proof_image_urls?: string[];
  contact_number?: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string; // ISO string
};

export type Match = {
  id: string;
  lost_item_id: string;
  finder_id: string;
  message?: string | null;
  contact_details?: string | null;
  image_urls?: string[];
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string; // ISO string
};

export type Notification = {
  id: string;
  claimant_name: string | null;
  item_name: string | null;
  created_at: string;
  type: 'claim' | 'match';
  message: string;
};
