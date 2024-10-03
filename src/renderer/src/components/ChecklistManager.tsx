import React, { useState, useEffect } from 'react';
import { Checklist as ChecklistVar, ChecklistItem, ChecklistCompletion } from '../interfaces';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@renderer/components/ui/card";
import { Textarea } from "@renderer/components/ui/textarea";
import { Button } from "@renderer/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@renderer/components/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@renderer/components/ui/form";
import { Input } from "@renderer/components/ui/input";
import { Checkbox } from "@renderer/components/ui/checkbox";
import { useToast } from "@renderer/components/ui/use-toast";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select";
import { database } from '@renderer/db';
import { checklists, checklistItems, checklistCompletion as checklistCompletionTable, machines, checklistItemCompletion } from '../../../main/schema';
import { and, desc, eq, not } from 'drizzle-orm';
import ChecklistHistory from './ChecklistHistory';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { useAuth } from '@renderer/context/AuthContext';
import { DataTable } from './DataTable';
import { ColumnDef } from "@tanstack/react-table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { CalendarIcon, MoreHorizontal } from 'lucide-react';
import { generateEmailTemplate } from './EmailTemplate';
import { format } from 'date-fns';
import { sendEmail } from '@renderer/emailSender';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import QRCodeGenerator from './QRCodeGenerator';

interface ChecklistManagerProps {
  machineId: number;
  machineGroupId?: number;
  machineName: string;
  machineSAP: string;
  machineSerial: string;
  checklistsProp: ChecklistVar[];
  setChecklists: React.Dispatch<React.SetStateAction<ChecklistVar[]>>;
  fetchChecklists: () => Promise<void>;
}




const checklistSchema = z.object({
  title: z.string().min(1, "Title is required"),
  interval_type: z.string().min(1, "Interval type is required"),
  custom_interval_days: z.number().nullable(),
  last_completed_date: z.date().nullable(),
  items: z.array(z.object({
    id: z.number().optional(),
    description: z.string().min(1, "Item description is required"),
    completed: z.boolean(),
  })).min(1, "At least one item is required"),
});

const ChecklistManager: React.FC<ChecklistManagerProps> = ({ machineId,machineName,machineSAP,machineSerial, checklistsProp, setChecklists, machineGroupId, fetchChecklists }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [checklistsLocal, setChecklistsLocal] = useState<ChecklistVar[]>(checklistsProp);
  const [editingChecklist, setEditingChecklist] = useState<ChecklistVar | null>(null);
  const [viewingChecklist, setViewingChecklist] = useState<ChecklistVar | null>(null);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [completionNote, setCompletionNote] = useState('');
  const { id: userId } = useAuth(); 
  const [qrCodeDialog, setQrCodeDialog] = useState(false);
  const [showQRGenerator, setShowQRGenerator] = useState(false);

  const form = useForm<z.infer<typeof checklistSchema>>({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      title: "",
      interval_type: "daily",
      custom_interval_days: null,
      last_completed_date: null,
      items: [{ description: "", completed: false }],
    },
  });


  function formatChecklists(checklists: ChecklistVar[]): string {
    const stringtoreturn = `Machine Name : ${machineName} Machine SAP: ${machineSAP} Machine Serial Number: ${machineSerial} \n\n`
    return stringtoreturn.concat(checklists.map(checklist => {
      const interval = checklist.intervalType || 'N/A';
      const items = checklist.items.map(item => `- ${item.description}`).join('\n'); // Adjust based on actual ChecklistItem structure
  
      return `**Checklist Name:** ${checklist.title}\n**Checklist Interval:** ${interval}\n${items}`;
    }).join('\n\n')); // Double line break between checklists
  }
  
  // Example usage
 
  
  const formattedText = formatChecklists(checklistsLocal);

  const handleGenerateQR = () => {
    setQrCodeDialog(true)
  };
  
  const closeQrCodeDialog = () => {
    setQrCodeDialog(false);
  }
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    setChecklistsLocal(checklistsProp);

  }, [checklistsProp]);

  useEffect(() => {
    updateChecklistStatus();
  }
  , [checklistsLocal]);

  const updateChecklistStatus = async () => {
    try {
      const currentDate = new Date();
  
      // Fetch all checklists
      const checklistsRetrieved = await database
        .select()
        .from(checklists)
        .execute();

  
      for (const checklist of checklistsRetrieved) {
        let status = 'planned';
  
        // Check if the checklist is late
        if (checklist.nextPlannedDate && checklist.nextPlannedDate < currentDate) {
          status = 'late';
        }

        // Update the checklist status in the database if it has changed
        if (checklist.status !== status) {
          await database
            .update(checklists)
            .set({ status })
            .where(eq(checklists.id, checklist.id))
            .execute();
        }
      }
  

    } catch (error) {
      console.error('Error updating checklist statuses:', error);
    }
  };


  useEffect(() => {
    fetchChecklists().then(() => setIsLoading(false));
  }, [machineId]);

  /*
  const fetchChecklists = async () => {
    setIsLoading(true);
    try {
      let fetchedChecklists: ChecklistVar[] = [];
      const fetchedSpecificChecklists = await database.query.checklists.findMany({
        where: eq(checklists.machineId, machineId),
        with: {
          items: true,
        },
      }) as ChecklistVar[];

      fetchedChecklists = [...fetchedSpecificChecklists];

      if(machineGroupId) {
        const fetchedGroupChecklists = await database.query.checklists.findMany({
          where: eq(checklists.machineGroupId, machineGroupId),
          with: {
            items: true,
          },
        }) as ChecklistVar[];
        fetchedGroupChecklists.forEach((checklist) => {
          if(!fetchedChecklists.find((c) => c.id === checklist.id)) {
            fetchedChecklists.push(checklist);
          }
        });
      }


      const checklistsWithCompletions = await Promise.all(
        fetchedChecklists.map(async (checklist) => {
          const lastCompletion = await database.query.checklistCompletion.findFirst({
            where: and(eq(checklistCompletionTable.checklistId, checklist.id),eq(checklistCompletionTable.machineId, machineId)),
            orderBy: [desc(checklistCompletionTable.completionDate)],
          }) as ChecklistCompletion | undefined;

          const lastPerformedDate = lastCompletion ? new Date(lastCompletion.completionDate) : null;
          const nextPlannedDate = lastPerformedDate ? calculateNextPlannedDate(checklist, lastPerformedDate) : null;

          return {
            ...checklist,
            lastPerformedDate,
            nextPlannedDate,
          };
        })
      );

      console.log('Fetched checklists:', checklistsWithCompletions);
      setChecklistsLocal(checklistsWithCompletions);
    } catch (error) {
      console.error('Error fetching checklists:', error);
    } finally {
      setIsLoading(false);
    }
  };
*/

  
  useEffect(() => {
    if (editingChecklist) {
      form.reset({
        title: editingChecklist.title,
        interval_type: editingChecklist.intervalType,
        custom_interval_days: editingChecklist.customIntervalDays,
        last_completed_date: editingChecklist.lastPerformedDate,
        items: editingChecklist.items,
      });
    } else {
      form.reset({
        title: "",
        interval_type: "daily",
        custom_interval_days: null,
        items: [{ description: "", completed: false }],
      });
    }
  }, [editingChecklist, form]);

  const calculateNextPlannedDate = (checklist: ChecklistVar, lastPerformedDate: Date): Date => {
    const nextDate = new Date(lastPerformedDate);
    switch (checklist.intervalType) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'semi':
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case 'anually':
        nextDate.setMonth(nextDate.getMonth() + 12);
        break;
      case 'custom':
        if (checklist.customIntervalDays) {
          nextDate.setDate(nextDate.getDate() + checklist.customIntervalDays);
        }
        break;
    }
    return nextDate;
  };

  const onSubmit = async (data: z.infer<typeof checklistSchema>) => {
    try {
      if (editingChecklist) {
        if (data.interval_type !== 'custom') {
          data.custom_interval_days = null;
        }

        const lastCompletion = await database.query.checklistCompletion.findFirst({
          where: eq(checklistCompletionTable.checklistId, editingChecklist.id),
          orderBy: [desc(checklistCompletionTable.completionDate)],
        }) as ChecklistCompletion | undefined;

        const lastPerformedDate = data.last_completed_date ? data.last_completed_date : (lastCompletion ? new Date(lastCompletion.completionDate) : null);
        const nextPlannedDate = lastPerformedDate ? calculateNextPlannedDate({
          ...editingChecklist,
          intervalType: data.interval_type,
          customIntervalDays: data.custom_interval_days
        }, lastPerformedDate) : null;

        const updatedChecklist = await database.update(checklists)
          .set({
            title: data.title,
            intervalType: data.interval_type,
            customIntervalDays: data.custom_interval_days,
            lastPerformedDate: lastPerformedDate,
            nextPlannedDate: nextPlannedDate,
          })
          .where(eq(checklists.id, editingChecklist.id as number))
          .returning()
          .then(result => result[0]);

        const existingItems = await database.query.checklistItems.findMany({
          where: eq(checklistItems.checklistId, editingChecklist.id as number),
        });

        const newItems = data.items.filter(item => item.id === undefined || item.id === null);
        const updatedItems = data.items.filter(item => item.id !== undefined && item.id !== null) as ChecklistItem[];
        const itemIds = new Set(updatedItems.map(item => item.id!));
        const itemsToDelete = existingItems.filter(item => !itemIds.has(item.id));

        for (const item of itemsToDelete) {
          await database.delete(checklistItems).where(eq(checklistItems.id, item.id));
        }

        for (const item of newItems) {
          await database.insert(checklistItems).values({
            checklistId: updatedChecklist.id,
            description: item.description,
            completed: item.completed,
          });
        }

        for (const item of updatedItems) {
          await database.update(checklistItems)
            .set({
              description: item.description,
              completed: item.completed,
            })
            .where(eq(checklistItems.id, item.id));
        }

        const fullUpdatedChecklist = { 
          ...updatedChecklist, 
          items: [...newItems.map(item => ({ ...item, checklistId: updatedChecklist.id })), ...updatedItems],
          lastPerformedDate,
          nextPlannedDate,
        } as ChecklistVar;
        
        setChecklists(prevChecklists =>
          prevChecklists.map(c => c.id === fullUpdatedChecklist.id ? fullUpdatedChecklist : c)
        );
      } else {
        const newChecklist = await database.insert(checklists)
          .values({
            machineId,
            title: data.title,
            intervalType: data.interval_type,
            customIntervalDays: data.custom_interval_days,
            machineGroupId: machineGroupId,
            lastPerformedDate: data.last_completed_date,
            nextPlannedDate: data.last_completed_date ? calculateNextPlannedDate({
              ...data,
              id: 0, // Temporary ID for the calculation
              items: [],
            } as unknown as ChecklistVar, data.last_completed_date) : null,
          })
          .returning()
          .then(result => result[0]);

        const newItems = await database.insert(checklistItems)
          .values(data.items.map(item => ({
            checklistId: newChecklist.id,
            description: item.description,
            completed: item.completed,
          })))
          .returning();

        const fullNewChecklist = { ...newChecklist, items: newItems } as ChecklistVar;
        setChecklistsLocal(prevChecklists => [...prevChecklists, fullNewChecklist]);
      }

      setIsDialogOpen(false);
      setEditingChecklist(null);
      form.reset();
      toast({
        title: `Checklist ${editingChecklist ? 'updated' : 'added'}`,
        description: `The checklist has been successfully ${editingChecklist ? 'updated' : 'added'}.`,
      });
    } catch (error) {
      console.error('Error saving checklist:', error);
      toast({
        title: `Error ${editingChecklist ? 'updating' : 'adding'} checklist`,
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };
/*
  const sendEmailToAssignedUser = async (data: ChecklistVar) => {
    try {
      const assignedMachine = await database.query.machines.findFirst({
        where: eq(machines.id, machineId),
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
      console.log('Checklist data:', checklistData);
      const htmlTemplate = generateEmailTemplate('checklist', checklistData);
        await sendEmail({
          from: 'noreply@your-app.com',
          to: assignedUser.emailAddress
          subject: `Upcoming CheckList Notification : ${data.title}`,
          html: htmlTemplate,
        });
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
  */ 

  const handleEdit = (checklist: ChecklistVar) => {
    setEditingChecklist(checklist);
    setIsDialogOpen(true);
  };

  const handleDelete = async (checklistId: number) => {
    try {
      await database.delete(checklists).where(eq(checklists.id, checklistId));
      setChecklists(prevChecklists => prevChecklists.filter(c => c.id !== checklistId));
      toast({
        title: 'Checklist deleted',
        description: 'The checklist has been successfully removed.',
      });
    } catch (error) {
      console.error('Error deleting checklist:', error);
      toast({
        title: 'Error deleting checklist',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleComplete = async (checklist: ChecklistVar, note: string) => {
    if (!userId) {
      toast({
        title: 'Error',
        description: 'You must be logged in to complete a checklist.',
        variant: 'destructive',
      });
      return;
    }
  
    try {
      const completionDate = new Date();
  
      // Insert the checklist completion record
      const [checklistCompletion] = await database.insert(checklistCompletionTable).values({
        checklistId: checklist.id,
        machineId: machineId,
        userId: userId,
        completionDate,
        notes: note,
      }).returning();
  
      // Create checklist item completion records
      const items = checklist.items.map(item => ({
        checklistItemId: item.id, // Ensure you have the correct itemId
        completed: item.completed,
        checklistCompletionId: checklistCompletion.id,
      }));
      // Update all items in checklist to be not completed for future checklist completions
      await database.update(checklistItems)
        .set({ completed: false })
        .where(and(eq(checklistItems.checklistId, checklist.id), not(eq(checklistItems.completed, false))));
  
      // Insert each checklist item completion record
      for (const item of items) {
        await database.insert(checklistItemCompletion).values(item);
      }
  
      // Calculate next planned date and update checklist
      const nextPlannedDate = calculateNextPlannedDate(checklist, completionDate);
      
      await database.update(checklists)
        .set({
          lastPerformedDate: completionDate,
          nextPlannedDate: nextPlannedDate,
        })
        .where(eq(checklists.id, checklist.id));
  
      const updatedChecklist = { 
        ...checklist, 
        lastPerformedDate: completionDate,
        nextPlannedDate: nextPlannedDate
      };
      
      setChecklists(prevChecklists =>
        prevChecklists.map(c => c.id === checklist.id ? updatedChecklist : c)
      );
  
      toast({
        title: 'Checklist completed',
        description: 'The checklist has been marked as completed with a note.',
      });
      setIsDetailDialogOpen(false);
      setCompletionNote('');
    } catch (error) {
      console.error('Error completing checklist:', error);
      toast({
        title: 'Error completing checklist',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };
  

  const handleItemCheckedChange = async (checklistId: number, itemId: number, completed: boolean) => {
    try {
      await database.update(checklistItems)
        .set({ completed })
        .where(eq(checklistItems.id, itemId));

      setChecklists(prevChecklists =>
        prevChecklists.map(checklist =>
          checklist.id === checklistId
            ? {
              ...checklist,
              items: checklist.items.map(item =>
                item.id === itemId ? { ...item, completed } : item
              ),
            }
            : checklist
        )
      );

      if (viewingChecklist && viewingChecklist.id === checklistId) {
        setViewingChecklist(prevChecklist => ({
          ...prevChecklist!,
          items: prevChecklist!.items.map(item =>
            item.id === itemId ? { ...item, completed } : item
          ),
        }));
      }

      toast({
        title: 'Item updated',
        description: 'The item status has been successfully updated.',
      });
    } catch (error) {
      console.error('Error updating item status:', error);
      toast({
        title: 'Error updating item',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (checklist: ChecklistVar) => {
    setViewingChecklist(checklist);
    setIsDetailDialogOpen(true);
  };

  const formatDate = (date: Date | null) => {
    return date ? new Date(date).toLocaleDateString() : 'Not set';
  };

  const columns: ColumnDef<ChecklistVar>[] = [
    {
      header: 'Title',
      accessorKey: 'title',
    },
    {
      header: 'Interval Type',
      accessorKey: 'intervalType',
    },
    {
      header: 'Last Performed',
      accessorKey: 'lastPerformedDate',
      cell: ({ getValue }) => formatDate(getValue<Date | null>()),
    },
    {
      header: 'Next Planned',
      accessorKey: 'nextPlannedDate',
      cell: ({ getValue }) => formatDate(getValue<Date | null>()),
    },
    {
      header: 'status',
      accessorKey: 'status',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${row.original.status === 'late' ? 'bg-red-100 text-red-800' :
          row.original.status === 'planned' ? 'bg-green-100 text-green-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
          {row.original.status ?? 'Unknown'}
        </span>
      ),
    },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.preventDefault()}>
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                handleEdit(row.original);
              }}>
                Edit
              </DropdownMenuItem>
              {
                <DropdownMenuItem onSelect={(event) => {
                  event.preventDefault();
                handleViewDetails(row.original);
                }}>
                  Complete
                </DropdownMenuItem>
              }
              <DropdownMenuItem onSelect={(event) => {
                event.preventDefault();
                handleDelete(row.original.id);
              }} className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ];

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Checklists</CardTitle>
        <CardDescription>Manage checklists for this machine</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active Checklists</TabsTrigger>
            <TabsTrigger value="history">Checklist History</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <div className="flex justify-end">
            <Button onClick={() => {
              setEditingChecklist(null);
              setIsDialogOpen(true);
            }} className="mb-4 mr-2">
              Add New Checklist
            </Button>
            <Button onClick={() => setQrCodeDialog(true)}>              Generate Qr Code</Button>

            
            </div>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              <DataTable
                columns={columns}
                data={checklistsLocal}
                onRowClick={handleViewDetails}
                actionsColumnId='actions'
              />
            )}
          </TabsContent>
          <TabsContent value="history">
            <ChecklistHistory machineId={machineId} />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingChecklist ? 'Edit Checklist' : 'Add New Checklist'}</DialogTitle>
              <DialogDescription>
                {editingChecklist ? 'Update checklist details and items.' : 'Create a new checklist for this machine.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Checklist title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="interval_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interval Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select interval type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="semi">Semi Anually</SelectItem>
                          <SelectItem value="anually">Annually</SelectItem>
                          <SelectItem value="custom">Custom</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {form.watch('interval_type') === 'custom' && (
                  <FormField
                    control={form.control}
                    name="custom_interval_days"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Custom Interval (Days)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value ?? ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === '' ? null : parseInt(value, 10));
                            }}
                            placeholder="Custom interval in days"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
<FormField
  control={form.control}
  name="last_completed_date"
  render={({ field }) => (
    <FormItem className="flex flex-col">
      <FormLabel>Last Completed Date</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              variant={"outline"}
              className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
            >
              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={field.value ?? undefined}
            onSelect={(date) => field.onChange(date)}
            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
            initialFocus
          />
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => field.onChange(null)}
          >
            Clear date
          </Button>
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )}
/>
                <div className="space-y-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.description`}
                        render={({ field }) => (
                          <FormItem className="flex-grow">
                            <FormControl>
                              <Input {...field} placeholder="Checklist item description" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="button" onClick={() => remove(index)} variant="outline" size="sm">
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  onClick={() => append({ description: '', completed: false })}
                  variant="outline"
                >
                  Add Item
                </Button>
                <div className="flex justify-end space-x-2">
                  <Button type="button" onClick={() => setIsDialogOpen(false)} variant="outline">
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingChecklist ? 'Update Checklist' : 'Add Checklist'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        <QRCodeGenerator
        text={formattedText} // Replace with the text you want to encode
        isOpen={qrCodeDialog}
        machineName={machineName}
        machineSAP={machineSAP}

        onClose={closeQrCodeDialog}
      />
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{viewingChecklist?.title}</DialogTitle>
              <DialogDescription>
                Interval: {viewingChecklist?.intervalType}
                {viewingChecklist?.customIntervalDays && ` (${viewingChecklist.customIntervalDays} days)`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {viewingChecklist?.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={item.completed}
                    onCheckedChange={(checked) => handleItemCheckedChange(viewingChecklist.id, item.id, checked === true)}
                  />
                  <label htmlFor={`item-${item.id}`} className="flex-grow">{item.description}</label>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <label htmlFor="completion-note" className="text-sm font-medium">Completion Note</label>
              <Textarea
                id="completion-note"
                placeholder="Add a note about this checklist completion..."
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button onClick={() => {handleComplete(viewingChecklist!, completionNote)}} variant="default">
                Mark Checklist as Completed
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>

    
  );
};

export default ChecklistManager;