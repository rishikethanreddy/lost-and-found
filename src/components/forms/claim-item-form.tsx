
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
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Image from 'next/image';

const formSchema = z.object({
  mark1: z.string().min(5, { message: 'Please provide a descriptive mark.' }),
  mark2: z.string().min(5, { message: 'Please provide a descriptive mark.' }),
  mark3: z.string().min(5, { message: 'Please provide a descriptive mark.' }),
  contactNumber: z.string().optional(),
  proofImages: z.any().optional(),
});

type ClaimItemFormProps = {
  itemId: string;
  onSuccess: () => void;
};

type ImagePreview = {
  file: File;
  url: string;
};

export function ClaimItemForm({ itemId, onSuccess }: ClaimItemFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<ImagePreview[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      mark1: '',
      mark2: '',
      mark3: '',
      contactNumber: '',
      proofImages: undefined,
    },
  });

  const { setValue } = form;

  useEffect(() => {
    const fileList = new DataTransfer();
    imagePreviews.forEach(preview => fileList.items.add(preview.file));
    setValue('proofImages', fileList.files);
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
        toast({ title: 'Error', description: 'You must be logged in to submit a claim.', variant: 'destructive' });
        setLoading(false);
        return;
    }

    const identificationMarks = [values.mark1, values.mark2, values.mark3];
    let uploadedImageUrls: string[] = [];
    
    if (values.proofImages && values.proofImages.length > 0) {
      for (const file of Array.from(values.proofImages as FileList)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `claims/${user.id}-${Date.now()}.${fileExt}`;
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
    
    const { error } = await supabase.from('claims').insert({
      item_id: itemId,
      claimant_id: user.id,
      identification_marks: identificationMarks,
      proof_image_urls: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
      contact_number: values.contactNumber,
      status: 'pending',
    });

    setLoading(false);

    if (error) {
      toast({ title: 'Error Submitting Claim', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: "Claim Submitted!",
        description: "The person who found the item has been notified. You will receive an update soon.",
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
          name="mark1"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Identification Mark 1</FormLabel>
              <FormControl>
                <Textarea className="text-sm min-h-[60px]" placeholder="e.g., A specific scratch on the back..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="mark2"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Identification Mark 2</FormLabel>
              <FormControl>
                <Textarea className="text-sm min-h-[60px]" placeholder="e.g., Brand name, model number..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
         <FormField
          control={form.control}
          name="mark3"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Identification Mark 3</FormLabel>
              <FormControl>
                <Textarea className="text-sm min-h-[60px]" placeholder="e.g., A password hint, contents..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Contact Number (Optional)</FormLabel>
              <FormControl>
                <Input placeholder="e.g., 555-123-4567" {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                Provide a number if you'd like the finder to call you directly.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-4">
           <FormItem>
              <FormLabel className="text-xs">Proof of Ownership (Optional, up to 3 images)</FormLabel>
              <FormControl>
                 <div className="relative">
                   <Input 
                        id="proofImages"
                        type="file" 
                        accept="image/*"
                        multiple
                        className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={handleFileChange}
                        disabled={currentPhotoCount >= 3}
                    />
                   <Button asChild variant="outline" className={cn("w-full pointer-events-none text-sm", currentPhotoCount >= 3 && "cursor-not-allowed opacity-50")}>
                      <label htmlFor="proofImages">
                        <Upload className="mr-2 h-4 w-4" />
                        {buttonText}
                      </label>
                    </Button>
                </div>
              </FormControl>
              <FormDescription className="text-xs">Receipts, photos of you with the item, etc. {currentPhotoCount}/3</FormDescription>
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
          Submit Claim
        </Button>
      </form>
    </Form>
  );
}
    
    