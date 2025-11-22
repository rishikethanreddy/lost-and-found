import type { Item } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "./ui/button";
import { ArrowRight } from "lucide-react";

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

export function ReportedItemsList({ items }: { items: Item[] }) {
    if (items.length === 0) {
        return (
            <Card className="mt-4">
                <CardHeader>
                    <CardTitle>No Reported Items</CardTitle>
                    <CardDescription>You have not reported any lost or found items yet.</CardDescription>
                </CardHeader>
            </Card>
        )
    }

    return (
        <Card className="mt-4">
            <CardHeader>
                <CardTitle>My Reported Items</CardTitle>
                <CardDescription>A list of items you've reported as lost or found.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {items.map(item => (
                        <div key={item.id} className="flex items-center justify-between rounded-md border p-4">
                            <div>
                                <h3 className="font-semibold">{item.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                    Reported on {format(new Date(item.date), "PPP")}
                                </p>
                            </div>
                            <div className="flex items-center gap-4">
                               <Badge variant={getBadgeVariant(item.status)} className="capitalize">{item.status}</Badge>
                               <Button asChild variant="ghost" size="sm">
                                   <Link href={`/items/${item.id}`}>View <ArrowRight className="ml-2 h-4 w-4" /></Link>
                               </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
