
"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ClaimItemForm } from "./forms/claim-item-form";
import { useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Info } from "lucide-react";

type ClaimItemDialogProps = {
    itemId: string;
}

export function ClaimItemDialog({ itemId }: ClaimItemDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full text-lg">
          Claim Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Submit a Claim</DialogTitle>
          <Alert className="mt-2 text-left border-blue-200 bg-blue-50 text-blue-800 [&>svg]:text-blue-800">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-blue-800">
              To verify ownership, provide at least three unique identifying marks.
              <strong className="font-medium block mt-1">For best results, describe details NOT visible in the item&apos;s photos.</strong>
            </AlertDescription>
          </Alert>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-6 -mr-6">
          <ClaimItemForm itemId={itemId} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
