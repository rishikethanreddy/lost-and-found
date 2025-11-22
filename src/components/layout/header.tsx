
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CircleUser, ChevronLeft } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Notifications } from './notifications';
import { ThemeToggle } from './theme-toggle';


export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const showBackButton = pathname !== '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
              >
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">Back</span>
              </Button>
            )}
          <Link href="/" className="flex items-center gap-2 font-semibold">
             <span className="text-xl font-bold text-primary">TraceIt</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          {loading ? null : user ? (
            <>
              <Notifications />
              <Button asChild variant="secondary" size="icon" className="rounded-full">
                  <Link href="/account">
                      <CircleUser className="h-5 w-5" />
                      <span className="sr-only">My Account</span>
                  </Link>
              </Button>
            </>
          ) : (
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
