
'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

type ItemFiltersProps = {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  category: string;
  setCategory: (category: string) => void;
  resetFilters: () => void;
};

export function ItemFilters({
  searchQuery,
  setSearchQuery,
  category,
  setCategory,
  resetFilters
}: ItemFiltersProps) {

  const hasActiveFilters = searchQuery || category !== 'all';

  return (
    <div className="mb-8 rounded-lg border bg-card p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="electronics">Electronics</SelectItem>
                <SelectItem value="documents-ids">Documents & IDs</SelectItem>
                <SelectItem value="bags-wallets">Bags & Wallets</SelectItem>
                <SelectItem value="clothing-accessories">Clothing & Accessories</SelectItem>
                <SelectItem value="keys-access-cards">Keys & Access Cards</SelectItem>
                <SelectItem value="books-stationery">Books & Stationery</SelectItem>
                <SelectItem value="cash-valuables">Cash & Valuables</SelectItem>
                <SelectItem value="sports-fitness-gear">Sports & Fitness Gear</SelectItem>
                <SelectItem value="personal-belongings">Personal Belongings</SelectItem>
                <SelectItem value="other">Miscellaneous / Other</SelectItem>
                </SelectContent>
            </Select>
        </div>
        {hasActiveFilters && (
            <div className="mt-4 flex justify-end">
                <Button variant="ghost" onClick={resetFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Reset Filters
                </Button>
            </div>
        )}
    </div>
  );
}
