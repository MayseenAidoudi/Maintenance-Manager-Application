import React, { useEffect, useState } from 'react';
import { Machine, Supplier, User } from '../interfaces';
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@renderer/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@renderer/components/ui/form";
import { Input } from '@renderer/components/ui/input';
import { Textarea } from '@renderer/components/ui/textarea';
import { Button } from '@renderer/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem } from "@renderer/components/ui/select";
import SupplierForm from './SupplierForm';
import { database } from '../db';
import { suppliers as suppliersTable } from '../../../main/schema';
import { toast } from '@renderer/components/ui/use-toast';
import { Checkbox } from "@renderer/components/ui/checkbox";

interface MachineFormProps {
  users: User[],
  suppliers: Supplier[],
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Machine) => void;
  onSuppliersUpdated: () => void;
  setSuppliers: (suppliers: Supplier[]) => void;
  machine: Machine | null;
}

interface ExtendedMachine extends Machine {
  calibrationInterval: number;
}

const MachineForm: React.FC<MachineFormProps> = ({
  users,
  suppliers,
  isOpen,
  onOpenChange,
  onSubmit,
  onSuppliersUpdated,
  setSuppliers,
  machine
}) => {
  const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);

  const form = useForm<Machine>({
    defaultValues: {
      id: machine?.id,
      sapNumber: machine?.sapNumber || '',
      serialNumber: machine?.serialNumber || '',
      name: machine?.name || '',
      description: machine?.description || '',
      location: machine?.location || '',
      userId: machine?.userId || 0,
      supplierId: machine?.supplierId || 0,
      hasGenericAccessories: machine?.hasGenericAccessories || false,
      machineClass: machine?.machineClass || '', 
    },
  });

  useEffect(() => {
    if (machine) {
      form.reset({
        ...machine,
      });
    } else {
      form.reset({
        sapNumber: '',
        serialNumber: '',
        name: '',
        description: '',
        location: '',
        userId: 0,
        supplierId: 0,
        hasGenericAccessories: false,
        machineClass: '',
      });
    }
  }, [machine, form]);

  const handleSubmit = (data: Machine) => {

    const submissionData: Machine = {
      ...data
    };
    onSubmit(submissionData);
    onOpenChange(false);
  };

  const addSupplier = async (supplier: Supplier) => {
    try {
      await database.insert(suppliersTable).values({
        name: supplier.name,
        website: supplier.website,
        email: supplier.email,
        phoneNumber: supplier.phoneNumber,
      });

      toast({
        title: 'Supplier added successfully',
        description: `${supplier.name} has been added to the suppliers list.`,
      });
      onSuppliersUpdated();

      setSuppliers([...suppliers, supplier]);
      setIsSupplierFormOpen(false);
    } catch (error) {
      console.error('Error adding supplier:', error);
      toast({
        title: 'Error adding supplier',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{machine ? 'Edit Machine' : 'Add New Machine'}</DialogTitle>
            <DialogDescription>
              {machine ? 'Make changes to the machine details here.' : 'Enter the details for the new machine.'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sapNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SAP Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="serialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Serial Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="resize-none" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="userId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign User</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={String(field.value)}>
                          <SelectTrigger>{field.value ? users.find(user => user.id === Number(field.value))?.username || 'Select User' : 'Select User'}</SelectTrigger>
                          <SelectContent>
                            {users.map(user => (
                              <SelectItem key={user.id} value={String(user.id)}>{user.username}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="machineClass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Machine Class</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Supplier</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={String(field.value)}>
                          <SelectTrigger>{field.value ? suppliers.find(supplier => supplier.id === Number(field.value))?.name || 'Select Supplier' : 'Select Supplier'}</SelectTrigger>
                          <SelectContent>
                            {suppliers.map(supplier => (
                              <SelectItem key={supplier.id} value={String(supplier.id)}>{supplier.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="button" onClick={() => setIsSupplierFormOpen(true)} className="self-end mt-6">
                  Add New Supplier
                </Button>
              </div>
              <FormField
                control={form.control}
                name="hasGenericAccessories"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Has Accessories
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">{machine ? 'Save changes' : 'Add Machine'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      <SupplierForm
        isOpen={isSupplierFormOpen}
        onOpenChange={setIsSupplierFormOpen}
        onSubmit={addSupplier}
      />
    </>
  );
};

export default MachineForm;