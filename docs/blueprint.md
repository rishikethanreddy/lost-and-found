# **App Name**: TraceIt

## Core Features:

- User Authentication & Profiles: Secure sign-up and login using Supabase Auth (email + password, with option for OAuth). Profile page with verified details (name, email, role: student/staff). Users can update their info but cannot impersonate others.
- Lost Item Reporting: Allow users to report lost items with details such as item name, category, description, location lost, date lost, and optional photo upload.
- Found Item Reporting: Enable users to report found items with similar details as lost items, encouraging honest reporting with a disclaimer.
- Item Search and Filtering: Implement a search bar with filters (lost/found, category, date, location) to efficiently find items. Display items in a grid with basic info.
- Claim Verification Process: On a found item’s details page, include a “Claim Item” button. When a user (loser) clicks Claim, show a form asking for: Three identification marks (text fields where the loser describes unique details like scratches, brand name, serial number, etc.). Optional proof images (upload up to 3 images: receipts, similar items, ID cards, or photos with the item). On form submission: Save all details securely in Supabase database under a claims table. Store uploaded images in Supabase Storage, linked to the claim record. Notify the finder (person who reported the found item) that a claim has been submitted. In the finder’s dashboard, display the claim request: Identification marks entered, uploaded proof images, and claimant’s anonymized profile (first name only, email partially hidden). Finder can: Approve claim → Marks item as “Claimed” and notifies both parties. Reject claim → Sends rejection notification to claimant with an optional reason.

## Style Guidelines:

- Primary color: Deep, calming blue (#4A777A) to evoke trust and security in handling important lost items. Avoids the cliche of a brighter blue.
- Background color: Light desaturated blue (#E0E5E5) to provide a clean and neutral backdrop that complements the primary color.
- Accent color: Soft lavender (#B0A2B3) to highlight interactive elements and provide a gentle contrast to the blue tones.
- Body and headline font: 'Inter' sans-serif for a clean and modern look, suitable for all text.
- Use simple, clear icons to represent item categories and actions. Icons should be consistent in style and easily recognizable.
- Employ a clean, modern, mobile-responsive UI with rounded corners for a professional yet approachable look. Use light gray for neutral sections.
- Incorporate subtle animations, such as smooth transitions when filtering or claiming items, to enhance user engagement without being distracting.