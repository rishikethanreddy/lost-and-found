
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Item } from '@/lib/types';
import Image from 'next/image';

const formSchema = z.object({
  name: z.string().min(3, { message: 'Item name must be at least 3 characters.' }),
  category: z.string({ required_error: 'Please select a category.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  location: z.string().min(3, { message: 'Location must be at least 3 characters.' }),
  item_date: z.date({ required_error: 'A date is required.' }),
  photos: z.any().optional(),
});

type ReportItemFormProps = {
  type: 'lost' | 'found';
  itemToEdit?: Item;
};

type ImagePreview = {
  file: File;
  url: string;
};

export function ReportItemForm({ type, itemToEdit }: ReportItemFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<ImagePreview | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(itemToEdit?.image_urls?.[0] || null);

  const defaultItemDate = itemToEdit?.item_date ? new Date(itemToEdit.item_date) : undefined;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: itemToEdit?.name || '',
      description: itemToEdit?.description || '',
      location: itemToEdit?.location || '',
      category: itemToEdit?.category || '',
      item_date: defaultItemDate,
      photos: undefined,
    },
  });

  const { setValue } = form;

  useEffect(() => {
    if (imagePreview) {
      const fileList = new DataTransfer();
      fileList.items.add(imagePreview.file);
      setValue('photos', fileList.files);
    } else {
      setValue('photos', undefined);
    }
  }, [imagePreview, setValue]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (existingImageUrl || imagePreview) {
        toast({
            title: "Only one image allowed",
            description: "Please remove the existing image before uploading a new one.",
            variant: "destructive"
        });
        e.target.value = '';
        return;
      }

      setImagePreview({
        file,
        url: URL.createObjectURL(file),
      });
    }
  };

  const removeNewPreview = () => {
    setImagePreview(null);
  };

  const removeExistingImage = () => {
    setExistingImageUrl(null);
  }
  
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        toast({ title: 'Error', description: 'You must be logged in to report an item.', variant: 'destructive' });
        setLoading(false);
        return;
    }

    let finalImageUrl: string | null = existingImageUrl;

    // Delete image that was removed by the user
    if (itemToEdit?.image_urls?.[0] && !existingImageUrl) {
        const removedUrl = itemToEdit.image_urls[0];
        const filePathToRemove = removedUrl.substring(removedUrl.lastIndexOf('public/'));
        const { error: removeError } = await supabase.storage.from('item_images').remove([filePathToRemove]);
        if (removeError) {
          console.error("Error removing image:", removeError.message);
          toast({ title: 'Error Removing Image', description: removeError.message, variant: 'destructive' });
        }
    }

    // Upload new image if one was selected
    if (imagePreview) {
        const fileExt = imagePreview.file.name.split('.').pop();
        const newFileName = `public/${user.id}-${Date.now()}-${Math.random()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
            .from('item_images')
            .upload(newFileName, imagePreview.file);

        if (uploadError) {
            toast({ title: 'Image Upload Error', description: uploadError.message, variant: 'destructive' });
            setLoading(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('item_images')
            .getPublicUrl(newFileName);
        
        if (publicUrl) {
            finalImageUrl = publicUrl;
        }
    }

    const reportData = {
        user_id: user.id,
        name: values.name,
        category: values.category,
        description: values.description,
        location: values.location,
        item_date: values.item_date.toISOString(),
        image_urls: finalImageUrl ? [finalImageUrl] : [],
        status: type,
    };

    if (itemToEdit) {
        const { error: updateError } = await supabase
            .from('items')
            .update(reportData)
            .eq('id', itemToEdit.id);
        
        if (updateError) {
            toast({ title: 'Error updating report', description: updateError.message, variant: 'destructive' });
        } else {
            toast({ title: 'Success!', description: 'Your report has been updated.' });
            router.push('/my-reports');
            router.refresh();
        }
    } else {
        const { error: insertError } = await supabase.from('items').insert(reportData);
        
        if (insertError) {
            toast({ title: 'Error submitting report', description: insertError.message, variant: 'destructive' });
        } else {
            toast({ title: 'Success!', description: 'Your report has been submitted.' });
            router.push('/');
        }
    }
    setLoading(false);
  }

  const hasImage = !!existingImageUrl || !!imagePreview;
  const buttonText = hasImage ? 'Change Image' : 'Choose a file';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., iPhone 13, Blue Water Bottle" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide details like color, brand, and any identifying marks."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location {type === 'lost' ? 'Lost' : 'Found'}</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Library 2nd floor" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="item_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date {type === 'lost' ? 'Lost' : 'Found'}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date('1900-01-01')
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <FormItem>
            <FormLabel>Upload Photo ({itemToEdit ? 'Add, replace, or remove' : 'Optional'})</FormLabel>
            <FormControl>
              <div className="relative">
                 <Input 
                      id="photos"
                      type="file" 
                      accept="image/*"
                      className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={handleFileChange}
                      disabled={hasImage}
                  />
                 <Button asChild variant="outline" className={cn("w-full pointer-events-none", hasImage && "cursor-not-allowed opacity-50")}>
                    <label htmlFor="photos">
                      <Upload className="mr-2 h-4 w-4" />
                      {buttonText}
                    </label>
                  </Button>
              </div>
            </FormControl>
            <FormDescription>A clear photo can help others identify the item.</FormDescription>
            <FormMessage />
          </FormItem>

          {(existingImageUrl || imagePreview) && (
            <div className="flex flex-wrap gap-4">
              {existingImageUrl && (
                <div className="relative">
                  <Image src={existingImageUrl} alt="Existing image" width={96} height={96} className="h-24 w-24 rounded-md object-cover" />
                   <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-white text-black hover:bg-white/80"
                      onClick={removeExistingImage}
                    >
                      <X className="h-3 w-3" />
                   </Button>
                </div>
              )}
              {imagePreview && (
                <div className="relative">
                  <Image src={imagePreview.url} alt="Image preview" width={96} height={96} className="h-24 w-24 rounded-md object-cover" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-white text-black hover:bg-white/80"
                    onClick={removeNewPreview}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {type === 'found' && !itemToEdit && (
             <div className="rounded-md border border-yellow-300 bg-yellow-50 p-4 text-sm text-yellow-800">
                <p><strong>Honest Reporting:</strong> Please ensure you report found items accurately and handle them with care. You are responsible for coordinating the return with the verified owner.</p>
             </div>
        )}
        <div className="flex justify-center">
            <Button type="submit" className="w-full sm:w-auto" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {itemToEdit ? 'Save Changes' : 'Submit Report'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
