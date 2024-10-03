import React, { useState, useEffect } from 'react';
import { GenericAccessory, Machine } from '../interfaces';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Plus, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { database } from '@renderer/db';
import { genericAccessories as accessoriesTable } from '../../../main/schema';
import { eq, or } from 'drizzle-orm';
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

interface GenericAccessoryManagerProps {
  machineId: number;
  machine: Machine;
}

export const GenericAccessoryManager: React.FC<GenericAccessoryManagerProps> = ({ machineId, machine }) => {
  const [accessories, setAccessories] = useState<GenericAccessory[]>([]);
  const [editingAccessory, setEditingAccessory] = useState<GenericAccessory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccessories();
  }, [machineId]);

  const fetchAccessories = async () => {
    try {
      let fetchedAccessories : any;
      if (machine.machineGroupId) {
        fetchedAccessories = await database.query.genericAccessories.findMany({
          where: or(eq(accessoriesTable.machineId, machineId), eq(accessoriesTable.machineGroupId, machine.machineGroupId)),
        });
      } else {
        fetchedAccessories = await database.query.genericAccessories.findMany({
          where: eq(accessoriesTable.machineId, machineId),
        });
      }
      setAccessories(fetchedAccessories.map(accessory => ({
        ...accessory,
        machineId: accessory.machineId ?? machineId, // Ensure machineId is never null
      })));
    } catch (error) {
      console.error('Error fetching accessories:', error);
      toast({
        title: 'Error fetching accessories',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = (accessory: GenericAccessory) => {
    setEditingAccessory(accessory);
    setIsDialogOpen(true);
  };

  const handleDelete = async (accessoryId: number) => {
    try {
      await database.delete(accessoriesTable).where(eq(accessoriesTable.id, accessoryId));
      await fetchAccessories();
      toast({
        title: 'Accessory deleted',
        description: 'The accessory has been successfully deleted.',
      });
    } catch (error) {
      console.error('Error deleting accessory:', error);
      toast({
        title: 'Error deleting accessory',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async (accessory: GenericAccessory) => {
    try {
      if (accessory.id > 0) {
        if (machine.machineGroupId) {
          accessory.machineGroupId = machine.machineGroupId;
        }
        await database.update(accessoriesTable)
          .set(accessory)
          .where(eq(accessoriesTable.id, accessory.id));
      } else {
        await database.insert(accessoriesTable).values({ ...accessory, machineId, id: undefined, machineGroupId: machine.machineGroupId }).execute();
      }
      await fetchAccessories();
      setEditingAccessory(null);
      setIsDialogOpen(false);
      toast({
        title: 'Accessory saved',
        description: 'The accessory has been successfully saved.',
      });
    } catch (error) {
      console.error('Error saving accessory:', error);
      toast({
        title: 'Error saving accessory',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const columns: ColumnDef<GenericAccessory>[] = [
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'quantity',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Quantity
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'notes',
      header: 'Notes',
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const accessory = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEdit(accessory)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(accessory.id)} className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  
  const renderAccessoryForm = () => (
    <div className="space-y-4">
      <Label htmlFor="name">Name</Label>
      <Input
        id="name"
        value={editingAccessory?.name || ''}
        onChange={(e) => setEditingAccessory(prev => ({ ...prev!, name: e.target.value }))}
        placeholder="Accessory Name"
      />
      <Label htmlFor="quantity">Quantity</Label>
      <Input
        id="quantity"
        type="number"
        value={editingAccessory?.quantity?.toString() || 1}
        onChange={(e) => setEditingAccessory(prev => ({ ...prev!, quantity: Number(e.target.value) }))}
        placeholder="Quantity"
      />
      <Label htmlFor="note">Notes</Label>
      <Input
        id="notes"
        value={editingAccessory?.notes}
        onChange={(e) => setEditingAccessory(prev => ({ ...prev!, notes: e.target.value }))}
        placeholder="Notes"
      />
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Generic Accessories for {machine.name}</h2>
      <ScrollArea className="h-[400px]">
        <DataTable
          columns={columns}
          data={accessories}
        />
      </ScrollArea>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4" onClick={() => setEditingAccessory({ id: 0, machineId, name: '', quantity: 1, notes: '', machineGroupId: machine.machineGroupId })}>
            <Plus size={16} className="mr-2" /> Add Accessory
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAccessory?.id ? 'Edit Accessory' : 'Add Accessory'}</DialogTitle>
          </DialogHeader>
          {renderAccessoryForm()}
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => handleSave(editingAccessory!)}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GenericAccessoryManager;
