import React, { useState, useEffect, useMemo } from 'react';
import { Checklist, Machine, MachineDocument, MachineGroup, Supplier, User } from '../interfaces';
import { database } from '../db';
import { machines as machinesTable, machineDocuments as machineDocumentsTable, machineGroups as machineGroupsTable, checklists as checklistsTable, users as usersTable } from '../../../main/schema';
import { eq, lte } from 'drizzle-orm';
import { Button } from '@renderer/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@renderer/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@renderer/components/ui/card";
import { useToast } from "@renderer/components/ui/use-toast";
import MachineForm from './MachineForm';
import { DataTable } from './DataTable';
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import DocumentManager from './DocumentManager';
import MachineGroupForm from './MachineGroupForm';
import { generateEmailTemplate } from './EmailTemplate';
import { sendEmail } from '@renderer/emailSender';
import { addDays, format, set } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { useAuth } from '@renderer/context/AuthContext';
import { check } from 'drizzle-orm/mysql-core';

export interface MachineForm {
  name: string;
  location: string;
  sapNumber: string;
  serialNumber: string;
  description?: string;
  status: string;
  userId: number;
  supplierId?: number; // Optional as it can be null
  hasGenericAccessories: boolean;
  machineGroupId?: number;
  machineClass?:string;
  user?: User;// New field for the machine group
}

interface MachineListProps {
  users: User[];
  machines: Machine[];
  suppliers: Supplier[];
  isLoading: boolean;
  onMachineUpdated: (machine: Machine) => void;
  onMachineDeleted: (machineId: number) => void;
  onMachineCreated: (machine: Machine) => void;
  onMachineSelect: (machine: Machine) => void;
  setSuppliers: (suppliers: Supplier[]) => void;
  onSuppliersUpdated: () => void;
  fetchMachines: () => void;
}


const MachineList: React.FC<MachineListProps> = ({
  users,
  machines: initialMachines,
  isLoading,
  suppliers,
  onMachineUpdated,
  onMachineDeleted,
  onMachineCreated,
  onMachineSelect,
  setSuppliers,
  onSuppliersUpdated,
  fetchMachines,
}) => {
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [isMachineFormOpen, setIsMachineFormOpen] = useState(false);
  const [viewingDocumentsMachine, setViewingDocumentsMachine] = useState<Machine | null>(null);
  const [isDocumentsDialogOpen, setIsDocumentsDialogOpen] = useState(false);
  const { toast } = useToast();
  const [isDocumentManagerOpen, setIsDocumentManagerOpen] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null); // State to store execution time
  const [isMachineGroupFormOpen, setIsMachineGroupFormOpen] = useState(false);
  const [checklistNotificationForm, setChecklistNotificationForm] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [daysValue, setDaysValue] = useState(5);
  const {isAdmin} = useAuth();
  const [selectedMachineClass, setSelectedMachineClass] = useState('');
  const uniqueUsers = [...new Set(machines.map(machine => machine.user?.username ? machine.user?.username : 'Unassigned'))];
  const uniqueLocations = [...new Set(machines.map(machine => machine.location))];
  const uniqueStatuses = [...new Set(machines.map(machine => machine.status))];

  const uniqueMachineClasses = useMemo(() => {
    const classes = new Set<string>();
    machines.forEach(machine => {
      if (machine.machineClass) {
        const [prefix, labNumber, subLabNumber] = machine.machineClass.split('.');
  
        // Add the prefix
        classes.add(`${prefix.trim()}.`);
        
        // Add the prefix + lab number if it exists
        if (labNumber) {
          classes.add(`${prefix.trim()}. ${labNumber.trim()}.`);
        }
  
        // Add the full machine class
        if (subLabNumber) {
          classes.add(`${prefix.trim()}. ${labNumber.trim()}.${subLabNumber.trim()}`);
        }
      }
    });
    return Array.from(classes).sort();
  }, [machines]);
  
  
  const filteredMachines = machines.filter(machine => {
    const matchesMachineClass = () => {
      if (selectedMachineClass === 'all' || !selectedMachineClass) return true;
      if (!machine.machineClass) return false;
  
      // Split machine class into its parts
      const [prefix, labNumber, subLabNumber] = machine.machineClass.split('.');
      
      // Match based on selectedMachineClass
      if (selectedMachineClass.endsWith('.')) {
        // If the selected class is a prefix (e.g., "Lo."), match prefix
        return machine.machineClass.startsWith(selectedMachineClass.trim());
      } else if (selectedMachineClass.endsWith('. ')) {
        // If the selected class is a prefix + lab number (e.g., "Lo. 2.")
        return `${prefix.trim()}. ${labNumber.trim()}.` === selectedMachineClass.trim();
      } else {
        // Match the full machine class
        return machine.machineClass === selectedMachineClass.trim();
      }
    };
  
    return (
      (selectedUser === 'all' || !selectedUser || machine.user?.username === selectedUser) &&
      (selectedLocation === 'all' || !selectedLocation || machine.location === selectedLocation) &&
      (selectedStatus === 'all' || !selectedStatus || machine.status === selectedStatus) &&
      matchesMachineClass() &&
      (machine.name.toLowerCase().includes(searchText.toLowerCase()) ||
       machine.sapNumber.toLowerCase().includes(searchText.toLowerCase()))
    );
  });
  


  useEffect(() => {
    setMachines(initialMachines);
  }, [initialMachines]);

  const handleAddDocument = (machine: Machine) => {
    setSelectedMachine(machine);
    setIsDocumentManagerOpen(true);
  };
  const handleOpenChecklistNotificationForm = () => {
    setChecklistNotificationForm(true);
  };

  const handleOpenMachineGroupForm = () => {
    setIsMachineGroupFormOpen(true);
  };

  const handleCloseMachineGroupForm = () => {
    setIsMachineGroupFormOpen(false);
  };

  const fetchDocumentsForMachine = async (machineId: number | null): Promise<MachineDocument[]> => {
    const start = performance.now(); // Start timer
    try {
      const documents = machineId !== null
        ? await database.query.machineDocuments.findMany({
            where: eq(machineDocumentsTable.machineId, machineId ?? 0),
          }) as MachineDocument[]
        : [];
      const end = performance.now(); // End timer
      setExecutionTime(end - start); // Calculate execution time
      return documents;
    } catch (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
  };

  const handleViewDocuments = async (machine: Machine) => {
    const documents = await fetchDocumentsForMachine(machine.id);
    setViewingDocumentsMachine({ ...machine, documents });
    setIsDocumentsDialogOpen(true);
  };


  const handleSendNotifications = async (daysThreshold) => {
    try {
      setChecklistNotificationForm(false);
      // Get today's date
      const today = new Date();
      // Calculate the threshold date
      const thresholdDate = addDays(today, daysThreshold);
  
      // Query the database for checklists with planned dates less than or equal to the threshold date
      const checklists = await database.query.checklists.findMany({
        where: lte(checklistsTable.nextPlannedDate, thresholdDate),
        with: {
          machine: true,
          items: true,
        },
      });
      // Send email for each checklist
      for (const checklist of checklists) {
        await sendEmailToAssignedUserChecklist(checklist);
      }
      if( checklists.length === 0) {
        toast({
          title: 'No upcoming checklists',
          description: `There are no checklists planned within the next ${daysThreshold} days.`,
        });
      } 
    } catch (error) {
      console.error('Error sending notifications:', error);
    }
  };

  const sendEmailToAssignedUserChecklist = async (data: Checklist) => {
    try {
      const assignedMachine = await database.query.machines.findFirst({
        where: eq(machinesTable.id, data.machineId ? data.machineId : 0),
      });
      
      const formattedDate = format(Date().toString(), "PPP");
      const lastCompleted = data.lastPerformedDate ? format(new Date(), "PPP") : null;
      const items = data.items
      const checklistData = {
        checklistName: data.title,
        lastCompleted: lastCompleted,
        nextPlanned: formattedDate,
        machineName:  assignedMachine?.name,
        items: items
      };
      const htmlTemplate = generateEmailTemplate('checklist', checklistData);
        const assignedUser = await database.query.users.findFirst({
          where: eq(usersTable.id, assignedMachine?.userId || 0),
        });

        await sendEmail({
          from: 'noreply@your-app.com',
          to:  assignedUser?.emailAddress || '',
          subject: `Upcoming CheckList Notification : ${data.title}`,
          html: htmlTemplate,
        });
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  const handleDocumentAdded = async (newDocument: MachineDocument) => {
    if (selectedMachine) {
      const start = performance.now(); // Start timer
      try {
        const [insertedDocument] = await database.insert(machineDocumentsTable)
          .values({
            machineId: selectedMachine.id,
            documentName: newDocument.documentName,
            documentType: newDocument.documentType || null,
            documentPath: newDocument.documentPath,
          })
          .returning();

        const updatedMachine: Machine = {
          ...selectedMachine,
          documents: [...(selectedMachine.documents || []), insertedDocument as MachineDocument],
        };

        setMachines((prevMachines) =>
          prevMachines.map((machine) =>
            machine.id === updatedMachine.id ? updatedMachine : machine
          )
        );

        const end = performance.now(); // End timer
        setExecutionTime(end - start); // Calculate execution time

        toast({
          title: 'Document added',
          description: 'The document has been successfully uploaded and added to the database.',
        });
      } catch (error) {
        console.error('Error adding document:', error);
        toast({
          title: 'Error adding document',
          description: 'Failed to add document to database. Please try again later.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEdit = (machine: Machine) => {
    setEditingMachine(machine);
    setIsMachineFormOpen(true);
  };

  const handleDelete = async (id: number) => {
    const start = performance.now(); // Start timer
    try {
      await database.delete(machinesTable).where(eq(machinesTable.id, id));
      onMachineDeleted(id);
      setMachines(machines.filter((machine) => machine.id !== id));
      const end = performance.now(); // End timer
      setExecutionTime(end - start); // Calculate execution time
      toast({
        title: 'Machine deleted',
        description: 'The machine has been successfully removed.',
      });
    } catch (error) {
      console.error('Error deleting machine:', error);
      toast({
        title: 'Error deleting machine',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const onMachineSubmit = async (machineData: Machine) => {
    const start = performance.now(); // Start timer
    try {
      const { id, user, supplierId, documents, ...data } = machineData;
  
      const machineForDB: Partial<typeof machinesTable.$inferInsert> = {
        ...data,
        supplierId: supplierId,
      };
  
      if (editingMachine) {
        /* if wanted updated machine group and all machine in the group
        if (editingMachine.machineGroupId) {
          // Fetch the current machine group data
          const currentMachineGroup = await database.query.machineGroups.findFirst({
            where: eq(machineGroupsTable.id, editingMachine.machineGroupId),
            with: {
              machines: true,
            },
          });
    
          if (!currentMachineGroup) {
            throw new Error("Machine group not found");
          }
    
          // Determine which fields belong to the machine group
          const machineGroupFields = ['supplierId', 'hasAccessories', 'description'];
          const machineGroupUpdates = {};
          const individualMachineUpdates = {};
    
          for (const [key, value] of Object.entries(machineForDB)) {
            if (machineGroupFields.includes(key)) {
              machineGroupUpdates[key] = value;
            } else {
              individualMachineUpdates[key] = value;
            }
          }
    
          // Update the machine group if there are any changes
          if (Object.keys(machineGroupUpdates).length > 0) {
            await database.update(machineGroupsTable)
              .set(machineGroupUpdates)
              .where(eq(machineGroupsTable.id, editingMachine.machineGroupId));
    
            // Update all machines in the group with the machine group changes
            await database.update(machinesTable)
              .set(machineGroupUpdates)
              .where(eq(machinesTable.machineGroupId, editingMachine.machineGroupId));
          }
        }
         */
        // Update the individual machine
        const previousMachine = await database.query.machines.findFirst({
          where: eq(machinesTable.id, editingMachine.id),
        });
        const [updatedMachine] = await database.update(machinesTable)
          .set(data)
          .where(eq(machinesTable.id, editingMachine.id))
          .returning();

    
        // Get the updated supplier
        const newSupplier = suppliers.find(supplier => supplier.id === updatedMachine.supplierId);
        const newUser = users.find(user => user.id === updatedMachine.userId);
        const fullUpdatedMachine: Machine = {
          ...updatedMachine,
          documents: editingMachine.documents,
          user: newUser,
          supplier: newSupplier,
          description: updatedMachine.description || undefined,
          supplierId: updatedMachine.supplierId || undefined,
          machineGroupId: updatedMachine.machineGroupId !== null ? updatedMachine.machineGroupId : undefined,
          hasGenericAccessories: updatedMachine.hasGenericAccessories,
          hasSpecialAccessories: updatedMachine.hasSpecialAccessories,
        };
        

  if (previousMachine?.userId !== updatedMachine.userId) {
    sendEmailToAssignedUser(fullUpdatedMachine);
  }

        fetchMachines();
        setEditingMachine(null);
        toast({
          title: 'Machine updated',
          description: 'The machine information has been successfully updated.',
        });
      } else {
        // Create a new machine
        const [newMachine] = await database.insert(machinesTable)
          .values(machineForDB as typeof machinesTable.$inferInsert)
          .returning();
  
        // Fetch the machine group if there's a group ID
        const machineGroup = newMachine.machineGroupId
          ? await database.query.machineGroups.findFirst({
            where: eq(machineGroupsTable.id, newMachine.machineGroupId)
          })
          : undefined;
  
        if (machineGroup) {
          // Update all machines in the same group with the new machine group data
          await database.update(machinesTable)
            .set({
              supplierId: machineGroup.supplierId ?? 0,
              description: machineGroup.description || undefined,
              hasGenericAccessories: machineGroup.hasAccessories
            })
            .where(eq(machinesTable.machineGroupId, machineGroup.id));
        }
  
        // Get the new supplier
        const newSupplier = suppliers.find(supplier => supplier.id === newMachine.supplierId);
        const fullNewMachine: Machine = {
          ...newMachine,
          documents: [],
          user: user,
          supplier: newSupplier,
          description: newMachine.description || undefined,
          supplierId: newMachine.supplierId || undefined,
          machineGroupId: newMachine.machineGroupId || undefined,
          hasGenericAccessories: newMachine.hasGenericAccessories,
          hasSpecialAccessories: newMachine.hasSpecialAccessories,
        };
  
        const machinesToAdd: Machine[] = [fullNewMachine]; // Create an array with the new machine
        setMachines(prevMachines => [...prevMachines, ...machinesToAdd]); // Spread the array into the existing machines
        machinesToAdd.forEach(machine => onMachineCreated(machine)); // Call onMachineCreated for each new machine
        toast({
          title: 'Machine added',
          description: 'The new machine has been successfully added.',
        });
        sendEmailToAssignedUser(fullNewMachine);
      }
  
      setIsMachineFormOpen(false);
    } catch (error) {
      console.error('Error submitting machine:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while submitting the machine. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      const end = performance.now(); // End timer
      setExecutionTime(end - start); // Calculate execution time
    }
  };
  

  const sendEmailToAssignedUser = async (data: Machine) => {
    try {
      const formattedDate = format(Date().toString(), "PPP");
  
      const machineData = {
        location: data.location,
        machineName: data.name,
        sapNumber: data.sapNumber,
        assignmentDate: formattedDate,
      };
      const htmlTemplate = generateEmailTemplate('machine', machineData);
        await sendEmail({
          from: 'noreply@your-app.com',
          to:   data.user?.emailAddress || '',
          subject: `Maintenance Notification New Machine Assigned : ${data.name}`,
          html: htmlTemplate,
        });
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }


  const onMachineGroupSubmit = async (data: { machines: MachineForm[]; machineGroup: MachineGroup }) => {
    const start = performance.now(); // Start timer

    try {
      // Handle creation of machine group


      const newMachines = await Promise.all(
        data.machines.map((machine) =>
          database.insert(machinesTable)
            .values(machine as typeof machinesTable.$inferInsert)
            .returning()
        )
      );

      // Transform the returned machines
      const fullNewMachines = newMachines.map((result, index) => {
        const newMachine = result[0];
        const newSupplier = suppliers.find((supplier) => supplier.id === newMachine.supplierId);

        return {
          ...newMachine,
          documents: [],
          user: data.machines[index].user, // Assuming `user` is the same for all machines
          supplier: newSupplier,
          description: newMachine.description || undefined,
          supplierId: newMachine.supplierId || undefined,
          machineGroupId: newMachine.machineGroupId || undefined,
        };
      });

      setMachines((prevMachines) => [...prevMachines, ...fullNewMachines]);
      fullNewMachines.forEach((machine) => onMachineCreated(machine));
      setIsMachineFormOpen(false);

      toast({
        title: 'Machines Added',
        description: 'The new machines have been successfully added.',
      });

    } catch (error) {
      console.error('Error submitting machines and machine group:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while submitting the machines and machine group. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      const end = performance.now(); // End timer
      setExecutionTime(end - start); // Calculate execution time
    }
  };


  const columns: ColumnDef<Machine>[] = [
    {
      accessorKey: "sapNumber",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            SAP Number
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "serialNumber",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Serial Number
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "location",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Location
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "machineClass",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Class Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "user.username",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Assigned User
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => row.original.user?.username || 'Unassigned',
    },
    {
      accessorKey: "supplier.name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Supplier
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => row.original.supplier?.name || 'N/A',
    },
    {
      accessorKey: "status",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Status
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.status === 'under maintenance' ? 'bg-red-100 text-red-800' :
          row.original.status === 'active' ? 'bg-green-100 text-green-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
          {row.original.status}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const machine = row.original;
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
              <DropdownMenuItem onClick={() => onMachineSelect(machine)}>
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(machine)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleViewDocuments(machine)}>
                View Documents
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddDocument(machine)}>
                Add Document
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDelete(machine.id)} className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];


  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Machine Management</CardTitle>
        <CardDescription>View and manage registered machines</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex gap-4'>
      <div className="flex flex-wrap gap-4 mb-6 grow">
      <Input
              type="text"
              placeholder="Search by name or serial number"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-[200px] border rounded-md p-2"
            />
            <Select onValueChange={(value) => setSelectedUser(value || '')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setSelectedLocation(value || '')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {uniqueLocations.map(location => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setSelectedStatus(value || '')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {uniqueStatuses.map(status => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select onValueChange={(value) => setSelectedMachineClass(value || '')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Machine Class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {uniqueMachineClasses.map(classValue => (
                  <SelectItem key={classValue} value={classValue}>
                    {classValue}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

      <div className='flex justify-end justify-self-end'>
        <Button onClick={() => { setEditingMachine(null); setIsMachineFormOpen(true); }} className="mb-4 mr-2">
          Add New Machine
        </Button>
        <Button onClick={handleOpenMachineGroupForm} className="mb-4 mr-2">
          Add New Machine Group
        </Button>
        {isAdmin && (
          <Button onClick={handleOpenChecklistNotificationForm} className="mb-4">
            Check Checklists Notification
          </Button>
        )}
        </div>
        </div>
        {isLoading ? (
          <div>Loading machines...</div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredMachines}
            onRowClick={(machine: Machine) => onMachineSelect(machine)}
            actionsColumnId="actions"
          />
        )}
        {executionTime && (
          <div className="mt-4">
            <strong>Execution Time:</strong> {executionTime.toFixed(2)} ms
          </div>
        )}
      </CardContent>
      <MachineForm
        isOpen={isMachineFormOpen}
        onOpenChange={setIsMachineFormOpen}
        onSubmit={onMachineSubmit}
        machine={editingMachine}
        users={users}
        suppliers={suppliers}
        onSuppliersUpdated={onSuppliersUpdated}
        setSuppliers={setSuppliers}
      />

      <MachineGroupForm
        users={users}
        suppliers={suppliers}
        isOpen={isMachineGroupFormOpen}
        onOpenChange={handleCloseMachineGroupForm}
        onSubmit={onMachineGroupSubmit}
        onSuppliersUpdated={onSuppliersUpdated}
      />

      <DocumentManager
        machineId={selectedMachine?.id || 0}
        machineName={selectedMachine?.name || ''}
        isOpen={isDocumentManagerOpen}
        onOpenChange={setIsDocumentManagerOpen}
        onDocumentAdded={handleDocumentAdded}
      />
<Dialog open={checklistNotificationForm} onOpenChange={setChecklistNotificationForm}>
  <DialogContent className="w-auto">
    <DialogHeader>
      <DialogTitle>Check Checklist Notification</DialogTitle>
    </DialogHeader>
    <DialogDescription className="w-full flex items-center space-x-2 p-4">
      <p className="text-gray-700">Set the days threshold for upcoming notifications check:</p>
      <Input 
        type="text" 
        placeholder="" 
        defaultValue={5}
        value={daysValue}
        onChange={(e) => setDaysValue(Number(e.target.value))}
        className="w-24 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <span className="text-gray-600">days</span>
    </DialogDescription>
    <DialogFooter>
      <Button onClick={() => setChecklistNotificationForm(false)}>Close</Button>
      <Button onClick={() => handleSendNotifications(daysValue)}>Send Notifications</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>


      <Dialog open={isDocumentsDialogOpen} onOpenChange={setIsDocumentsDialogOpen}>
        <DialogContent className="sm:max-w-[80vw] lg:max-w-[70vw] xl:max-w-[60vw] w-full">
          <DialogHeader>
            <DialogTitle>Documents for {viewingDocumentsMachine?.name}</DialogTitle>
          </DialogHeader>
          <DialogDescription className="w-full overflow-hidden">
            {viewingDocumentsMachine?.documents ? (
              <div className="w-full overflow-auto">
                <DataTable
                  columns={[
                    { accessorKey: "documentName", header: "Name" },
                    { accessorKey: "documentType", header: "Type" },
                    { accessorKey: "documentPath", header: "Path" },
                  ]}
                  data={viewingDocumentsMachine.documents}
                />
              </div>
            ) : (
              'Loading documents...'
            )}
          </DialogDescription>
          <DialogFooter>
            <Button onClick={() => setIsDocumentsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MachineList; 