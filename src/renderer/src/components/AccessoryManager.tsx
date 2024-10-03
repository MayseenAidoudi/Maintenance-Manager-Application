import React, { useState, useEffect } from 'react';
import { SpecialAccessory, Machine } from '../interfaces';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { ScrollArea } from './ui/scroll-area';
import { Plus, ArrowUpDown, MoreHorizontal, CalendarIcon } from 'lucide-react';
import { database } from '@renderer/db';
import { specialAccessories as accessoriesTable } from '../../../main/schema';
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
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format } from 'date-fns';

interface AccessoryManagerProps {
  machineId: number;
  machine: Machine;
}

export const AccessoryManager: React.FC<AccessoryManagerProps> = ({ machineId, machine }) => {
  const [accessories, setAccessories] = useState<SpecialAccessory[]>([]);
  const [editingAccessory, setEditingAccessory] = useState<SpecialAccessory | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const { toast } = useToast();

  useEffect(() => {
    fetchAccessories();
  }, [machineId]);

  const fetchAccessories = async () => {
    try {
      let fetchedAccessories: any;
      if (machine.machineGroupId) {
        fetchedAccessories = await database.query.specialAccessories.findMany({
          where: or(eq(accessoriesTable.machineId, machineId), eq(accessoriesTable.machineGroupId, machine.machineGroupId)),
        });
      } else {
        fetchedAccessories = await database.query.specialAccessories.findMany({
          where: eq(accessoriesTable.machineId, machineId),
        });
      }
      setAccessories(fetchedAccessories.map(accessory => ({
        ...accessory,
        machineId: accessory.machineId ?? machineId,
        qualificationDate: accessory.qualificationDate ? new Date(accessory.qualificationDate) : null,
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

  const handleEdit = (accessory: SpecialAccessory) => {
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

  const handleSave = async (accessory: SpecialAccessory) => {
    try {
      const accessoryData = { ...accessory, qualificationDate: date };

      if (accessory.id >0) {
        if (machine.machineGroupId) {
          accessoryData.machineGroupId = machine.machineGroupId;
        }
        await database.update(accessoriesTable)
          .set(accessoryData)
          .where(eq(accessoriesTable.id, accessoryData.id));
      } else {
        await database.insert(accessoriesTable).values({ ...accessoryData, machineId, id: undefined, machineGroupId: machine.machineGroupId }).execute();
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

  const columns: ColumnDef<SpecialAccessory>[] = [
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
      accessorKey: 'length',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Length
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'diameter',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Diameter
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: 'angle',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Angle
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
      accessorKey: 'qualificationDate',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Qualification Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const date = row.getValue('qualificationDate') as Date | null;
        return date ? format(date, 'PP') : 'Not set';
      },
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
      <Label htmlFor="length">Length</Label>
      <Input
        id="length"
        type="number"
        value={editingAccessory?.length?.toString() || ''}
        onChange={(e) => setEditingAccessory(prev => ({ ...prev!, length: Number(e.target.value) }))}
        placeholder="Length"
      />
      <Label htmlFor="diameter">Diameter</Label>
      <Input
        id="diameter"
        type="number"
        value={editingAccessory?.diameter?.toString() || ''}
        onChange={(e) => setEditingAccessory(prev => ({ ...prev!, diameter: Number(e.target.value) }))}
        placeholder="Diameter"
      />
      <Label htmlFor="angle">Angle</Label>
      <Input
        id="angle"
        type="number"
        value={editingAccessory?.angle?.toString() || ''}
        onChange={(e) => setEditingAccessory(prev => ({ ...prev!, angle: Number(e.target.value) }))}
        placeholder="Angle"
      />
        <Label htmlFor="quantity">Quantity</Label>
        <Input
            id="quantity"
            type="number"
            value={editingAccessory?.quantity?.toString() || 1}
            onChange={(e) => setEditingAccessory(prev => ({ ...prev!, quantity: Number(e.target.value) }))}
            placeholder="Quantity"
        />
<Label htmlFor="qualificationDate">Qualification Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={`w-full justify-start text-left font-normal ${!date && "text-muted-foreground"}`}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, 'PPP') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      <Label htmlFor="notes">Notes</Label>

      <Input
        id="notes"
        value={editingAccessory?.notes || ''}
        onChange={(e) => setEditingAccessory(prev => ({ ...prev!, notes: e.target.value }))}
        placeholder="Notes"
      />
    </div>
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Accessories for {machine.name}</h2>
      <ScrollArea className="h-[400px]">
        <DataTable
          columns={columns}
          data={accessories}
        />
      </ScrollArea>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4" onClick={() => setEditingAccessory({ id: 0, machineId, name: '', length: null, diameter: null, angle: null, quantity: 1, notes: null })}>
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

export default AccessoryManager;