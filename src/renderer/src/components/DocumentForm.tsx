import React from 'react';
import { MachineDocument } from '../interfaces';
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@renderer/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@renderer/components/ui/form";
import { Input } from '@renderer/components/ui/input';
import { Button } from '@renderer/components/ui/button';

interface DocumentFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Omit<MachineDocument, 'id'>) => void;
  machineName: string | undefined;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ isOpen, onOpenChange, onSubmit, machineName }) => {
  const form = useForm<Omit<MachineDocument, 'id'>>({
    defaultValues: {
      documentName: '',
      documentType: '',
      documentPath: '',
    },
  });

  const handleSubmit = (data: Omit<MachineDocument, 'id'>) => {
    onSubmit(data);
    onOpenChange(false);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Document for {machineName}</DialogTitle>
          <DialogDescription>Enter the details for the new document.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="documentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentPath"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Path</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Add Document</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentForm;