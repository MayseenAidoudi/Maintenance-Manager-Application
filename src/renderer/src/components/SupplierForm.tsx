import React from 'react';
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@renderer/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@renderer/components/ui/form";
import { Input } from '@renderer/components/ui/input';
import { Button } from '@renderer/components/ui/button';
import { Supplier } from '@renderer/interfaces';

interface SupplierFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Supplier) => Promise<void>;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ isOpen, onOpenChange, onSubmit }) => {
  const form = useForm<Supplier>({
    defaultValues: {
      name: '',
      website: '',
      email: '',
      phoneNumber: '',
    },
  });

  const handleSubmit = async (data: Supplier) => {
    if (data.website) {
        if (!data.website.startsWith('http://') && !data.website.startsWith('https://')) {
          data.website = 'http://' + data.website;
        }
      }
    await onSubmit(data);
    onOpenChange(false);
    form.reset();
  };


  const validateWebsite = (value: string | undefined | null) => {
    if (!value) return true; // Allow empty value
    value = value?.trim() || '';
    if (value === '') return true;
    if (!value.match(/^https?:\/\//i)) {
      value = 'http://' + value;
    }
    try {
      new URL(value);
      return true;
    } catch (error) {
      return 'Please enter a valid website address';
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Supplier</DialogTitle>
          <DialogDescription>
            Enter the details for the new supplier.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} required />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="website"
              rules={{ validate: validateWebsite }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Website</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" value={field.value || ''}/>
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input {...field} type="tel" value={field.value || ''}/>
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Add Supplier</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default SupplierForm;