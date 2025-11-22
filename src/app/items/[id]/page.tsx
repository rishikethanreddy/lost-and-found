

import { supabase } from "@/lib/supabase/client";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, MapPin, User, ChevronLeft, ChevronRight, CheckCircle, Info } from "lucide-react";
import { format } from "date-fns";
import { ClaimItemDialog } from "@/components/claim-item-dialog";
import type { Item } from "@/lib/types";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { FoundItemDialog } from "@/components/found-item-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const getBadgeVariant = (status: 'lost' | 'found' | 'claimed') => {
  switch (status) {
    case 'lost':
      return 'destructive';
    case 'found':
      return 'default';
    case 'claimed':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getItemHint = (category: string) => {
    switch (category.toLowerCase()) {
        case 'electronics': return 'gadget tech';
        case 'documents-ids': return 'passport id';
        case 'bags-wallets': return 'backpack wallet';
        case 'clothing-accessories': return 'jacket watch';
        case 'keys-access-cards': return 'keys lock';
        case 'books-stationery': return 'book pen';
        case 'cash-valuables': return 'money jewelry';
        case 'sports-fitness-gear': return 'ball dumbbell';
        case 'personal-belongings': return 'glasses umbrella';
        default: return 'object item';
    }
}

async function getItemById(id: string): Promise<(Item & { user_name: string | null }) | null> {
    const { data: item, error: itemError } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .single();

    if (itemError || !item) {
        console.error("Error fetching item:", itemError?.message);
        return null;
    }

    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', item.user_id)
        .single();

    if (profileError) {
        console.error("Error fetching profile:", profileError.message);
    }

    const userName = profile?.full_name || 'Anonymous';

    return {
        ...item,
        user_name: userName
    };
}


export default async function ItemDetailsPage({ params }: { params: { id: string } }) {
  const itemPromise = getItemById(params.id);
  const userPromise = supabase.auth.getUser();

  const [item, { data: { user } }] = await Promise.all([itemPromise, userPromise]);


  if (!item) {
    notFound();
  }
  
  const hasImages = item.image_urls && item.image_urls.length > 0;
  const isReporter = user?.id === item.user_id;
  
  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div>
          {hasImages ? (
             <Carousel className="w-full rounded-lg overflow-hidden">
                <CarouselContent>
                  {item.image_urls!.map((url, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-video w-full">
                        <Image
                          src={url}
                          alt={`${item.name} - image ${index + 1}`}
                          fill
                          className="object-cover"
                          data-ai-hint={getItemHint(item.category)}
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {item.image_urls!.length > 1 && (
                  <>
                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                  </>
                )}
              </Carousel>
          ) : (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center">
                 <Image
                    src={"https://picsum.photos/1200/800"}
                    alt={item.name}
                    fill
                    className="object-cover"
                    data-ai-hint={getItemHint(item.category)}
                />
            </div>
          )}
        </div>
        <div className="flex flex-col space-y-6">
          <div>
            <Badge variant={getBadgeVariant(item.status)} className="capitalize mb-2 text-sm">{item.status}</Badge>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{item.name}</h1>
          </div>

          <p className="text-lg text-muted-foreground">{item.description}</p>

          <Card>
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center">
                <MapPin className="mr-3 h-5 w-5 text-muted-foreground" />
                <span><strong className="font-medium">Location:</strong> {item.location}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="mr-3 h-5 w-5 text-muted-foreground" />
                <span><strong className="font-medium">Date:</strong> {format(new Date(item.item_date), "PPP")}</span>
              </div>
              <div className="flex items-center">
                <User className="mr-3 h-5 w-5 text-muted-foreground" />
                <span><strong className="font-medium">Reported by:</strong> {item.user_name}</span>
              </div>
            </CardContent>
          </Card>
          
          {item.status === 'found' && !isReporter && (
            <ClaimItemDialog itemId={item.id} />
          )}

          {item.status === 'found' && isReporter && (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>This is your report</AlertTitle>
                <AlertDescription>
                    You cannot claim an item you have reported as found.
                </AlertDescription>
            </Alert>
          )}

          {item.status === 'lost' && !isReporter && (
            <FoundItemDialog lostItemId={item.id} />
          )}
          
          {item.status === 'lost' && isReporter && (
            <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>This is your report</AlertTitle>
                <AlertDescription>
                    You cannot report finding an item you have reported as lost.
                </AlertDescription>
            </Alert>
          )}

          {item.status === 'claimed' && (
            <div className="rounded-md bg-green-100 p-4 text-green-800 flex items-center gap-4">
                <CheckCircle className="h-5 w-5"/>
                <span>This item has been successfully claimed and returned to its owner.</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
