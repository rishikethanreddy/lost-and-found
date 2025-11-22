
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
import { useState } from "react";
import { FoundItemForm } from "./forms/found-item-form";
import { HandHelping } from "lucide-react";

type FoundItemDialogProps = {
    lostItemId: string;
}

export function FoundItemDialog({ lostItemId }: FoundItemDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full text-lg">
          <HandHelping className="mr-2 h-5 w-5" />
          I Found This Item
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Report a Match</DialogTitle>
          <DialogDescription className="text-sm">
            You think you found this lost item? Great! Please provide a brief message and contact details to help the owner verify.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto pr-6 -mr-6">
            <FoundItemForm lostItemId={lostItemId} onSuccess={() => setOpen(false)} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
