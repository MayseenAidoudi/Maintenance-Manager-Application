import React, { useState, useEffect } from 'react';
import { SparePart, SparePartBase, Machine } from '../interfaces';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Plus, MoreHorizontal } from 'lucide-react';
import { database } from '@renderer/db';
import { spareParts as sparePartsTable } from '../../../main/schema';
import { eq } from 'drizzle-orm';
import { useToast } from './ui/use-toast';
import { DataTable } from './DataTable';
import { ColumnDef } from '@tanstack/react-table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { z } from 'zod';

// Zod schema for validating spare part data
const sparePartSchema = z.object({
  name: z.string().min(1,"Part name is required"),
  partNumber: z.string().min(1,"Part number is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  reorderLevel: z.number().min(1, "Reorder level must be at least 1"),
  location: z.string().min(1,"Location is required"),
  supplier: z.string().min(1, "Supplier name is required"),
});



interface SparePartsManagerProps {
  machineId: number;
  machine: Machine;
}

export const SparePartsManager: React.FC<SparePartsManagerProps> = ({ machineId, machine }) => {
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [editingSparePart, setEditingSparePart] = useState<SparePartBase | null>(null);
  const [detailsSparePart, setDetailsSparePart] = useState<SparePart | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchSpareParts();
  }, [machineId]);

  const fetchSpareParts = async () => {
    try {
      const fetchedSpareParts = await database.query.spareParts.findMany({
        where: eq(sparePartsTable.machineId, machineId),
      });
      setSpareParts(fetchedSpareParts);
    } catch (error) {
      console.error('Error fetching spare parts:', error);
      toast({
        title: 'Error fetching spare parts',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (sparePart: SparePart) => {
    setEditingSparePart(sparePart);
    setIsDialogOpen(true);
  };

  const handleDelete = async (sparePartId: number) => {
    try {
      await database.delete(sparePartsTable).where(eq(sparePartsTable.id, sparePartId));
      await fetchSpareParts();
      toast({
        title: 'Spare part deleted',
        description: 'The spare part has been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting spare part:', error);
      toast({
        title: 'Error deleting spare part',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async (sparePart: SparePartBase & { id?: number }) => {
    // Validate form data
    const parsed = sparePartSchema.safeParse(sparePart);

    if (!parsed.success) {
      // Extract and display form errors
      const errors: Record<string, string> = {};
      parsed.error.errors.forEach((error) => {
        if (error.path[0]) {
          errors[error.path[0] as string] = error.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    try {
      if (sparePart.id) {
        await database.update(sparePartsTable)
          .set(sparePart)
          .where(eq(sparePartsTable.id, sparePart.id));
      } else {
        await database.insert(sparePartsTable).values(sparePart).execute();
      }
      await fetchSpareParts();
      setEditingSparePart(null);
      setIsDialogOpen(false);
      setFormErrors({});
      toast({
        title: 'Spare part saved',
        description: 'The spare part has been successfully saved.',
      });
    } catch (error) {
      console.error('Error saving spare part:', error);
      toast({
        title: 'Error saving spare part',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const openDetailsDialog = (sparePart: SparePart) => {
    setDetailsSparePart(sparePart);
    setIsDetailsDialogOpen(true);
  };

  const renderSparePartForm = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Part Name</Label>
        <Input
          id="name"
          value={editingSparePart?.name || ''}
          onChange={(e) => setEditingSparePart(prev => ({ ...prev!, name: e.target.value }))}
          placeholder="Part Name"
        />
        {formErrors.name && <p className="text-red-600">{formErrors.name}</p>}
      </div>
      <div>
        <Label htmlFor="partNumber">Part Number</Label>
        <Input
          id="partNumber"
          value={editingSparePart?.partNumber || ''}
          onChange={(e) => setEditingSparePart(prev => ({ ...prev!, partNumber: e.target.value }))}
          placeholder="Part Number"
        />
        {formErrors.partNumber && <p className="text-red-600">{formErrors.partNumber}</p>}
      </div>
      <div>
        <Label htmlFor="quantity">Quantity</Label>
        <Input
          id="quantity"
          type="number"
          value={editingSparePart?.quantity?.toString() || ''}
          onChange={(e) => setEditingSparePart(prev => ({ ...prev!, quantity: Number(e.target.value) }))}
          placeholder="Quantity"
        />
        {formErrors.quantity && <p className="text-red-600">{formErrors.quantity}</p>}
      </div>
      <div>
        <Label htmlFor="reorderLevel">Reorder Level</Label>
        <Input
          id="reorderLevel"
          type="number"
          value={editingSparePart?.reorderLevel?.toString() || ''}
          onChange={(e) => setEditingSparePart(prev => ({ ...prev!, reorderLevel: Number(e.target.value) }))}
          placeholder="Reorder Level"
        />
        {formErrors.reorderLevel && <p className="text-red-600">{formErrors.reorderLevel}</p>}
      </div>
      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={editingSparePart?.location || ''}
          onChange={(e) => setEditingSparePart(prev => ({ ...prev!, location: e.target.value }))}
          placeholder="Location"
        />
        {formErrors.location && <p className="text-red-600">{formErrors.location}</p>}
      </div>
      <div>
        <Label htmlFor="supplier">Supplier Name</Label>
        <Input
          id="supplier"
          type="text"
          value={editingSparePart?.supplier?.toString() || ''}
          onChange={(e) => setEditingSparePart(prev => ({ ...prev!, supplier: e.target.value }))}
          placeholder="Supplier Name"
        />
        {formErrors.supplier && <p className="text-red-600">{formErrors.supplier}</p>}
      </div>
    </div>
  );

  const renderDetailsDialog = () => (
    <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Spare Part Details</DialogTitle>
        </DialogHeader>
        {detailsSparePart && (
          <div className="space-y-4">
            <div>
              <Label>Part Name</Label>
              <p>{detailsSparePart.name}</p>
            </div>
            <div>
              <Label>Part Number</Label>
              <p>{detailsSparePart.partNumber}</p>
            </div>
            <div>
              <Label>Quantity</Label>
              <p>{detailsSparePart.quantity}</p>
            </div>
            <div>
              <Label>Reorder Level</Label>
              <p>{detailsSparePart.reorderLevel}</p>
            </div>
            <div>
              <Label>Location</Label>
              <p>{detailsSparePart.location}</p>
            </div>
            <div>
              <Label>Supplier Name</Label>
              <p>{detailsSparePart.supplier}</p>
            </div>
          </div>
        )}
        <div className="flex justify-end mt-4">
          <Button onClick={() => setIsDetailsDialogOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const columns: ColumnDef<SparePart>[] = [
    {
      accessorKey: 'name',
      header: 'Part Name',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'partNumber',
      header: 'Part Number',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'quantity',
      header: 'Quantity',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'reorderLevel',
      header: 'Reorder Level',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'location',
      header: 'Location',
      cell: info => info.getValue(),
    },
    {
      accessorKey: 'supplier',
      header: 'Supplier Name',
      cell: info => info.getValue(),
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }) => {
        const sparePart = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleEdit(sparePart)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDelete(sparePart.id)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Spare Parts for {machine.name}</h2>
      <ScrollArea className="h-[400px]">
        <DataTable
          columns={columns}
          data={spareParts}
          onRowClick={openDetailsDialog}
          actionsColumnId='actions'
        />
      </ScrollArea>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4" onClick={() => setEditingSparePart({ 
            name: '', 
            partNumber: '', 
            quantity: 1, 
            reorderLevel: 1, 
            location: '', 
            supplier: '', 
            machineId 
          })}>
            <Plus size={16} className="mr-2" /> Add Spare Part
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSparePart && 'id' in editingSparePart ? 'Edit Spare Part' : 'Add Spare Part'}</DialogTitle>
          </DialogHeader>
          {renderSparePartForm()}
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (editingSparePart) {
                handleSave(editingSparePart);
              }
            }}>
              {editingSparePart && 'id' in editingSparePart ? 'Save Changes' : 'Add Spare Part'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {renderDetailsDialog()}
    </div>
  );
};

export default SparePartsManager;
