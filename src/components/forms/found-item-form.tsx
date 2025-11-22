
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Upload, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  message: z.string().min(10, { message: 'Message must be at least 10 characters.' }),
  contactDetails: z.string().min(5, { message: 'Please provide valid contact details.' }),
  photos: z.any().optional(),
});

type FoundItemFormProps = {
  lostItemId: string;
  onSuccess: () => void;
};

type ImagePreview = {
  file: File;
  url: string;
};

export function FoundItemForm({ lostItemId, onSuccess }: FoundItemFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: '',
      contactDetails: '',
      photos: undefined,
    },
  });

  const { setValue } = form;

  useEffect(() => {
    const fileList = new DataTransfer();
    imagePreviews.forEach(preview => fileList.items.add(preview.file));
    setValue('photos', fileList.files);
  }, [imagePreviews, setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      if (imagePreviews.length + files.length > 3) {
        toast({
            title: "Too many files",
            description: "You can only upload a maximum of 3 images.",
            variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      const newPreviews = Array.from(files).map(file => ({
        file,
        url: URL.createObjectURL(file),
      }));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeNewPreview = (urlToRemove: string) => {
    setImagePreviews(prev => prev.filter(preview => preview.url !== urlToRemove));
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: 'Error', description: 'You must be logged in to report a match.', variant: 'destructive' });
        setLoading(false);
        return;
    }

    let uploadedImageUrls: string[] = [];
    if (values.photos && values.photos.length > 0) {
      for (const file of Array.from(values.photos as FileList)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `matches/${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('item_images').upload(fileName, file);

        if (uploadError) {
          toast({ title: 'Image Upload Error', description: uploadError.message, variant: 'destructive' });
          setLoading(false);
          return;
        }
        
        const { data: { publicUrl } } = supabase.storage.from('item_images').getPublicUrl(fileName);
        if (publicUrl) {
          uploadedImageUrls.push(publicUrl);
        }
      }
    }
    
    const { error } = await supabase.from('matches').insert({
      lost_item_id: lostItemId,
      finder_id: user.id,
      message: values.message,
      contact_details: values.contactDetails,
      image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
      status: 'pending',
    });

    setLoading(false);

    if (error) {
      toast({ title: 'Error Submitting Match', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: "Match Reported!",
        description: "The person who lost the item has been notified. Thank you for your help!",
      });
      onSuccess();
    }
  }
  
  const currentPhotoCount = imagePreviews.length;
  const buttonText = 'Choose up to 3 files';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Message to Owner</FormLabel>
              <FormControl>
                <Textarea className="text-sm min-h-[100px]" placeholder="e.g., I found this near the main library. It looks like it's in good condition. Let me know how to return it." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactDetails"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Your Contact Details</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 555-123-4567 or student@email.com" {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                How the owner can reach you to coordinate the return.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-4">
           <FormItem>
              <FormLabel className="text-xs">Attach Photos (Optional, up to 3 images)</FormLabel>
              <FormControl>
                 <div className="relative">
                   <Input 
                        id="photos"
                        type="file" 
                        accept="image/*"
                        multiple
                        className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleFileChange}
                        disabled={currentPhotoCount >= 3}
                    />
                   <Button asChild variant="outline" className={cn("w-full pointer-events-none text-sm", currentPhotoCount >= 3 && "cursor-not-allowed opacity-50")}>
                      <label htmlFor="photos">
                        <Upload className="mr-2 h-4 w-4" />
                        {buttonText}
                      </label>
                    </Button>
                </div>
              </FormControl>
              <FormDescription className="text-xs">Photos can help the owner confirm it's their item. {currentPhotoCount}/3</FormDescription>
              <FormMessage />
            </FormItem>
            {imagePreviews.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {imagePreviews.map((preview) => (
                  <div key={preview.url} className="relative">
                    <Image src={preview.url} alt="Image preview" width={96} height={96} className="h-24 w-24 rounded-md object-cover" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-white text-black hover:bg-white/80"
                      onClick={() => removeNewPreview(preview.url)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
        </div>
        <Button type="submit" className="w-full" size="sm" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Submit Match
        </Button>
      </form>
    </Form>
  );
}
