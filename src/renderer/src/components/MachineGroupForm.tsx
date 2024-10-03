import React, { useState } from 'react';
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@renderer/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@renderer/components/ui/form";
import { Input } from '@renderer/components/ui/input';
import { Textarea } from '@renderer/components/ui/textarea';
import { Button } from '@renderer/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem } from "@renderer/components/ui/select";
import { Checkbox } from "@renderer/components/ui/checkbox";
import SupplierForm from './SupplierForm';
import { database } from '../db';
import { suppliers as suppliersTable, machineGroups as machineGroupsTable } from '../../../main/schema';
import { toast } from '@renderer/components/ui/use-toast';
import { User, Supplier, MachineGroup } from '@renderer/interfaces';

interface MachineGroupFormProps {
    users: User[];
    suppliers: Supplier[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: { machines: MachineForm[]; machineGroup: MachineGroup }) => void;
    onSuppliersUpdated: () => void;
}

export interface MachineForm {
    name: string;
    location: string;
    sapNumber: string;
    serialNumber: string;
    description?: string;
    status: string;
    userId: number;
    supplierId?: number;
    hasGenericAccessories: boolean;
    machineGroupId?: number;
    machineClass?: string;
    user?: User;
    calibrationInterval?: number;
}

const MachineGroupForm: React.FC<MachineGroupFormProps> = ({
    users,
    suppliers,
    isOpen,
    onOpenChange,
    onSubmit,
    onSuppliersUpdated,
}) => {
    const [isSupplierFormOpen, setIsSupplierFormOpen] = useState(false);
    const [supplierSelectMode, setSupplierSelectMode] = useState<'select' | 'add'>('select');
    const [currentStep, setCurrentStep] = useState(1);

    const form = useForm<{ machines: MachineForm[]; machineGroup: MachineGroup }>({
        defaultValues: {
            machines: [
                {

                }
            ],
            machineGroup: {
                name: '',
                description: '',
                hasAccessories: false,
                supplierId: 0,
            },
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "machines",
    });

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
            setIsSupplierFormOpen(false);
            setSupplierSelectMode('select');
        } catch (error) {
            console.error('Error adding supplier:', error);
            toast({
                title: 'Error adding supplier',
                description: 'Please try again later.',
                variant: 'destructive',
            });
        }
    };

    const handleMachineGroupSubmit = async (data: MachineGroup) => {
        try {
            const [newMachineGroup] = await database.insert(machineGroupsTable).values(data as typeof machineGroupsTable.$inferInsert).returning();
            toast({
                title: 'Machine Group Created',
                description: `${data.name} has been created.`,
            });

            return newMachineGroup;
        } catch (error) {
            console.error('Error creating machine group:', error);
            toast({
                title: 'Error creating machine group',
                description: 'Please try again later.',
                variant: 'destructive',
            });
            throw error;
        }
    };

    const handleFormSubmit: SubmitHandler<{ machines: MachineForm[]; machineGroup: MachineGroup }> = async (data) => {
        try {
            console.log('Form data:', data.machineGroup);
            const newMachineGroup = await handleMachineGroupSubmit(data.machineGroup);

            const user = users.find(user => user.id === data.machineGroup.supplierId);

            const machinesWithGroup: MachineForm[] = data.machines.map((machine, index) => ({
                hasGenericAccessories: newMachineGroup.hasAccessories,
                status: 'active',
                sapNumber: machine.sapNumber,
                serialNumber: machine.serialNumber,
                name: `${newMachineGroup.name} ${index + 1}`,
                location: machine.location,
                description: newMachineGroup.description || undefined,
                userId: machine.userId,
                calibrationInterval: 12,
                user: user || undefined,
                machineGroupId: newMachineGroup.id,
                machineClass: machine.machineClass,
                supplierId: newMachineGroup.supplierId || undefined,
            }));
            onSubmit({ machines: machinesWithGroup, machineGroup: newMachineGroup });
            onOpenChange(false);
        } catch (error) {
            console.error('Error submitting form:', error);
            toast({
                title: 'Error submitting form',
                description: 'Please try again later.',
                variant: 'destructive',
            });
        }
    };

    const handleNext = () => {
        const machineGroupData = form.getValues('machineGroup');
        if (machineGroupData.name && machineGroupData.supplierId) {
            setCurrentStep(2);
        } else {
            toast({
                title: 'Incomplete Information',
                description: 'Please fill in the Machine Group Name and select a Supplier before proceeding.',
                variant: 'destructive',
            });
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[900px]">
                    <DialogHeader>
                        <DialogTitle>Add Multiple Machines Of The Same Type</DialogTitle>
                        <DialogDescription>
                            {currentStep === 1 ? 'Enter the details for the machine group.' : 'Enter the details for the machines.'}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
                            {currentStep === 1 ? (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-semibold">Machines General Info</h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="machineGroup.name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Machines Name <span className='font-thin'>(will be numbered later)</span></FormLabel>
                                                    <FormControl>
                                                        <Input {...field} className="w-full" />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-6">
                                                <div className="flex items-end space-x-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="machineGroup.supplierId"
                                                        render={({ field }) => (
                                                            <FormItem className="flex-grow">
                                                                <FormLabel>Select Supplier</FormLabel>
                                                                <FormControl>
                                                                    <Select onValueChange={field.onChange} value={String(field.value)}>
                                                                        <SelectTrigger className="w-full">
                                                                            {field.value ? suppliers.find(supplier => supplier.id === Number(field.value))?.name || 'Select Supplier' : 'Select Supplier'}
                                                                        </SelectTrigger>
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
                                                    <Button
                                                        type="button"
                                                        onClick={() => {
                                                            setSupplierSelectMode('add');
                                                            setIsSupplierFormOpen(true);
                                                        }}
                                                    >
                                                        Add New
                                                    </Button>
                                                </div>
                                                <FormField
                                                    control={form.control}
                                                    name="machineGroup.hasAccessories"
                                                    render={({ field }) => (
                                                        <FormItem className="flex items-center space-x-3 space-y-0 rounded-md border p-4">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">
                                                                Machines Have Accessories
                                                            </FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                                {/* Add any other options here */}
                                            </div>
                                            <FormField
                                                control={form.control}
                                                name="machineGroup.description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Machines Description</FormLabel>
                                                        <FormControl>
                                                            <Textarea {...field} className="resize-none w-full h-full min-h-[150px]" value={field.value || ''} />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {fields.map((item, index) => (
                                        <div key={item.id} className="flex items-center gap-4 border p-4 rounded-md w-full">
                                            <div className="flex-1">
                                                <FormField
                                                    control={form.control}
                                                    name={`machines.${index}.sapNumber`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>SAP Number</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} value={field.value || ''} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <FormField
                                                    control={form.control}
                                                    name={`machines.${index}.serialNumber`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Serial Number</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <FormField
                                                    control={form.control}
                                                    name={`machines.${index}.location`}
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
                                            <div className="flex-1">
                                                <FormField
                                                    control={form.control}
                                                    name={`machines.${index}.machineClass`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Machine Class</FormLabel>
                                                            <FormControl>
                                                                <Input {...field} />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <FormField
                                                    control={form.control}
                                                    name={`machines.${index}.userId`}
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
                                            </div>
                                            <div className="flex items-end self-end flex-shrink-0 h-full">
                                                <Button type="button" onClick={() => remove(index)} className="w-full">
                                                    Remove Machine
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button
                                        type="button"
                                        onClick={() => append({
                                            sapNumber: '',
                                            serialNumber: '',
                                            location: '',
                                            userId: 0,
                                            name: '',
                                            status: '',
                                            hasGenericAccessories: false,
                                        })}
                                        className="w-full mt-4"
                                    >
                                        Add Another Machine
                                    </Button>
                                </div>
                            )}

                            <DialogFooter>
                                {currentStep === 1 ? (
                                    <Button type="button" onClick={handleNext}>Next</Button>
                                ) : (
                                    <>
                                        <Button type="button" onClick={() => setCurrentStep(1)}>Back</Button>
                                        <Button type="submit">Save</Button>
                                    </>
                                )}
                                <Button type="button" onClick={() => onOpenChange(false)} variant="outline">Cancel</Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <SupplierForm
                isOpen={isSupplierFormOpen}
                onOpenChange={(open) => {
                    setIsSupplierFormOpen(open);
                    if (!open && supplierSelectMode === 'add') {
                        setSupplierSelectMode('select');
                    }
                }}
                onSubmit={addSupplier}
            />
        </>
    );
};

export default MachineGroupForm;