
import Link from 'next/link';
import Image from 'next/image';
import type { Item } from '@/lib/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, MapPin } from 'lucide-react';

type ItemCardProps = {
  item: Item;
};

const getBadgeVariant = (status: Item['status']) => {
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

export function ItemCard({ item }: ItemCardProps) {
  const imageUrl = (item.image_urls && item.image_urls.length > 0) ? item.image_urls[0] : 'https://picsum.photos/600/400';

  return (
    <Link href={`/items/${item.id}`} className="group">
      <Card className="flex h-full flex-col overflow-hidden transition-all duration-200 ease-in-out group-hover:shadow-lg group-hover:-translate-y-1">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full">
            <Image
              src={imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              data-ai-hint={getItemHint(item.category)}
            />
            <Badge
              variant={getBadgeVariant(item.status)}
              className="absolute right-3 top-3 capitalize"
            >
              {item.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col p-4">
          <CardTitle className="mb-2 text-lg font-semibold">{item.name}</CardTitle>
          <div className="flex items-center text-sm text-muted-foreground">
            <MapPin className="mr-2 h-4 w-4" />
            <span>{item.location}</span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
           <Button variant="ghost" className="w-full justify-start p-0 text-primary hover:bg-transparent hover:text-primary/80">
              View Details <ArrowRight className="ml-2 h-4 w-4" />
           </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
