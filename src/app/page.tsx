
'use client';

import { useState, useEffect, useMemo } from 'react';
import { ItemCard } from '@/components/item-card';
import type { Item } from '@/lib/types';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Frown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { ItemFilters } from '@/components/item-filters';

export default function Home() {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching items:', error.message);
      } else {
        setAllItems(data as Item[]);
      }
      setLoading(false);
    };
    fetchItems();
  }, []);

  const resetFilters = () => {
    setSearchQuery('');
    setCategory('all');
  };

  const filteredItems = useMemo(() => {
    let items = allItems.filter((item) => item.status === activeTab);

    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(lowercasedQuery) ||
          item.description.toLowerCase().includes(lowercasedQuery)
      );
    }

    if (category !== 'all') {
      items = items.filter((item) => item.category === category);
    }
    
    return items;
  }, [allItems, activeTab, searchQuery, category]);

  return (
    <div>
      <div className="bg-muted dark:bg-card py-12 px-4">
        <div className="container mx-auto max-w-7xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Find What You've Lost
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            A Cloud-Based platform to report and recover lost items.
          </p>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8 flex w-full rounded-full bg-muted p-1">
          <button
            onClick={() => {
                setActiveTab('lost');
                resetFilters();
            }}
            className={cn(
              'w-1/2 rounded-full py-2.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              activeTab === 'lost'
                ? 'bg-card text-card-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-card/50'
            )}
          >
            Lost Items
          </button>
          <button
            onClick={() => {
                setActiveTab('found');
                resetFilters();
            }}
            className={cn(
              'w-1/2 rounded-full py-2.5 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              activeTab === 'found'
                ? 'bg-card text-card-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-card/50'
            )}
          >
            Found Items
          </button>
        </div>

        <ItemFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          category={category}
          setCategory={setCategory}
          resetFilters={resetFilters}
        />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-4 gap-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Reported as {activeTab === 'lost' ? 'Lost' : 'Found'}
          </h2>
          <Button asChild className="w-full sm:w-auto">
            <Link href={activeTab === 'lost' ? '/report-lost' : '/report-found'}>
              <Plus className="mr-2 h-4 w-4" />
              Report a {activeTab === 'lost' ? 'Lost' : 'Found'} Item
            </Link>
          </Button>
        </div>

        <div className="mt-8">
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-24 text-center">
                <Frown className="h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Items Found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                    Try adjusting your filters or check back later.
                </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
