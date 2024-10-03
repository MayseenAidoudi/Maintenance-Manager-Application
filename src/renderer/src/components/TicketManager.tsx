import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { database } from '@renderer/db';
import { preventiveMaintenanceTickets, machines as machineTable } from '../../../main/schema';
import { eq } from 'drizzle-orm';
import { useToast } from "@renderer/components/ui/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@renderer/components/ui/card";
import { Button } from "@renderer/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@renderer/components/ui/dialog";

import { Textarea } from "@renderer/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select";
import { format } from "date-fns";
import { MoreHorizontal } from 'lucide-react';
import { DateRangePicker } from '@renderer/components/ui/date-range-picker';
import TicketDetails from './TicketDetails';
import { DataTable } from './DataTable';
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useAuth } from '@renderer/context/AuthContext';
import { sendEmail } from '../emailSender';
import { generateEmailTemplate } from './EmailTemplate';
import { Category, MachineCategory } from '@renderer/interfaces';
import { machineCategories as machineCategoriesTable } from '../../../main/schema';
import { TicketForm } from './TicketForm';
import PdfReportGenerator  from './PdfReportGenerator';
import { Checkbox } from './ui/checkbox';

const ticketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  status: z.string().min(1, "Status is required"),
  scheduledDate: z.date({
    required_error: "Scheduled date is required",
  }),
  machineId: z.number().min(1, "Machine is required"),
  userId: z.number().nullable(),
  critical: z.boolean(),
  categoryId: z.union([z.number().min(1, "Category is required"), z.literal("new")]),
  newCategoryName: z.string().optional(),
});

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  scheduledDate: Date;
  machineId: number;
  userId: number | null;
  machine?: { name: string };
  user?: {id: number, username: string };
  critical: boolean;
  categoryId?: number;
  category?: MachineCategory;
}

const TicketManager: React.FC = () => {
  const [isViewPdfDialogOpen, setIsViewPdfDialogOpen] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const { toast } = useToast();
  const [machines, setMachines] = useState<{ id: number; name: string }[]>([]);
  const [users, setUsers] = useState<{ id: number; username: string; emailAddress: string }[]>([]);
  const [filterMachine, setFilterMachine] = useState<number | null>(null);
  const [filterUser, setFilterUser] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
  const [completionNote, setCompletionNote] = useState("");
  const [isExternal, setisExternal] = useState(false);
  const { isAdmin, ticketPermissions, id } = useAuth();
  const [machineCategories, setMachineCategories] = useState<MachineCategory[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assigningTicketId, setAssigningTicketId] = useState<number | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [generateReport, setGenerateReport] = useState(false);
  const [isSaveLocationDialogOpen, setIsSaveLocationDialogOpen] = useState(false);
  const [saveToDocs, setSaveToDocs] = useState(true);
  const [viewPdfPath, setViewPdfPath] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportProblem, setReportProblem] = useState("");
  const [reportSolution, setReportSolution] = useState("");
  const [reportNotes, setReportNotes] = useState("");
  const [config, setConfig] = useState<any>(null);

  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const loadConfig = async () => {
    const loadedConfig = await window.api.getConfig();
    setConfig(loadedConfig);
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const fetchMachineCategories = async () => {
    try {
      const fetchedCategories = await database.query.machineCategories.findMany();
      setMachineCategories(fetchedCategories);
    } catch (error) {
      console.error('Error fetching machine categories:', error);
    }
  };

  const updateOverdueTickets = async () => {
    if (!isAdmin) return; // Ensure only admins can run this check

    try {
      const now = new Date();
      const overdueTickets = tickets.filter(ticket => {
        return !['completed', 'completed late'].includes(ticket.status) && new Date(ticket.scheduledDate) < now;
      });
      if (overdueTickets.length > 0) {
        await Promise.all(overdueTickets.map(ticket =>
          database.update(preventiveMaintenanceTickets)
            .set({
              status: 'late',
              updatedAt: new Date(),
            })
            .where(eq(preventiveMaintenanceTickets.id, ticket.id))
        ));

        // Update local state
        setTickets(prevTickets =>
          prevTickets.map(ticket =>
            !['completed', 'completed late'].includes(ticket.status) && new Date(ticket.scheduledDate) < now
              ? { ...ticket, status: 'late' }
              : ticket
          )
        );

        toast({
          title: 'Tickets Updated',
          description: 'Overdue tickets have been marked as late.',
        });
      }
    } catch (error) {
      console.error('Error updating overdue tickets:', error);
      toast({
        title: 'Error Updating Tickets',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };



  const form = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      scheduledDate: new Date(),
      machineId: 0,
      userId: 0,
      critical: false,
    },
  });

  useEffect(() => {
    fetchTickets();
    fetchMachines();
    fetchUsers();
    fetchMachineCategories();
  }, []);

  useEffect(() => {
updateAllMachineStatuses();
  }, []);

  useEffect(() => {
    if (editingTicket) {
      form.reset({
        title: editingTicket.title,
        description: editingTicket.description,
        status: editingTicket.status,
        scheduledDate: new Date(editingTicket.scheduledDate),
        machineId: editingTicket.machineId,
        userId: editingTicket.userId,
        critical: editingTicket.critical,
        categoryId: editingTicket.categoryId,
      });
    } else {
      form.reset({
        title: "",
        description: "",
        status: "pending",
        scheduledDate: new Date(),
        machineId: 0,
        userId: 0,
        categoryId: "new",
        critical: false,
      });
    }
  }, [editingTicket, form]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const fetchedTickets = await database.query.preventiveMaintenanceTickets.findMany({
        with: {
          machine: {
            columns: {
              name: true,
            },
          },
          user: {
            columns: {
              id: true,
              username: true,
            },
          },
          category: {
            columns: {
              name: true,
            },
          },
        },
      });
      setTickets(fetchedTickets as unknown as Ticket[]);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error fetching tickets',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const fetchedMachines = await database.query.machines.findMany({
        columns: {
          id: true,
          name: true,
        },
      });
      setMachines(fetchedMachines);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const fetchedUsers = await database.query.users.findMany({
        columns: {
          id: true,
          username: true,
          emailAddress: true,
        },
      });
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const updateMachineStatus = async (machineId: number, status: string) => {
    try {
      await database.update(machineTable)
        .set({ status })
        .where(eq(machineTable.id, machineId));
    } catch (error) {
      console.error('Error updating machine status:', error);
      throw error;
    }
  };

  const updateAllMachineStatuses = async () => {
    try {
      for (const machine of machines) {
        // Get all tickets associated with the current machine
        const machineTickets = tickets.filter(ticket => ticket.machineId === machine.id);
        // Filter out tickets that are not 'completed' or 'completed late'
        const relevantTickets = machineTickets.filter(ticket =>
          ticket.status !== 'completed' && ticket.status !== 'completed late'
        );

  
        // Determine the new status
        let newStatus = 'active';
        if (relevantTickets.some(ticket => ticket.critical)) {
          newStatus = 'under maintenance';
        } else if (relevantTickets.length > 0) {
          newStatus = 'has problems';
        }
        
        // Update the machine status
        await updateMachineStatus(machine.id, newStatus);
      }
    } catch (error) {
      console.error('Error updating machine statuses:', error);
    }
  };
  
  const filteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const machineMatch = !filterMachine || ticket.machineId === filterMachine;
      const userMatch = !filterUser || ticket.userId === filterUser;
      const statusMatch = !filterStatus || ticket.status === filterStatus;
      const dateMatch = (!dateRange.from || new Date(ticket.scheduledDate) >= dateRange.from) &&
        (!dateRange.to || new Date(ticket.scheduledDate) <= dateRange.to);
      return machineMatch && userMatch && statusMatch && dateMatch;
    });
  }, [tickets, filterMachine, filterUser, filterStatus, dateRange]);

  const onSubmit = async (data: z.infer<typeof ticketSchema>) => {
    try {
      let categoryId: number | undefined;
      const categoryIdValue = Number(data.categoryId);
      if (!isNaN(categoryIdValue)) {
        categoryId = categoryIdValue;
      } else if (data.newCategoryName) {
        const [newCategory] = await database.insert(machineCategoriesTable)
          .values({
            machineId: data.machineId,
            name: data.newCategoryName,
          })
          .returning();
        setMachineCategories(prevCategories => [...prevCategories, newCategory as Category]);
        categoryId = newCategory.id;
      }

      if (!ticketPermissions){
        data.userId = null;
      }
      if (categoryId === undefined) {
        throw new Error('Category is required');
      }

      if (editingTicket) {

        console.log(editingTicket?.user?.id);
        console.log(data.userId)
        if (ticketPermissions) {
        const [updatedTicket] = await database.update(preventiveMaintenanceTickets)
          .set({
            ...data,
            categoryId,
            updatedAt: new Date(),
          })
          .where(eq(preventiveMaintenanceTickets.id, editingTicket.id)).returning();

        if (data.userId !== editingTicket.userId) {
          sendEmailToAssignedUser(updatedTicket as z.infer<typeof ticketSchema>);
        }

        setTickets(prevTickets =>
          prevTickets.map(ticket =>
            ticket.id === editingTicket.id ? { ...ticket, ...data, categoryId } : ticket
          )
        );


        // Update machine status
        const newStatus = data.critical ? 'under maintenance' : 'has problems';
        await updateMachineStatus(data.machineId, newStatus);

      } else {
        toast({
          title: 'Error updating ticket',
          description: 'You do not have permission to update tickets.',
          variant: 'destructive',
        });
        return;
      }
      } else {

        if (data.userId === -1) {
          data.userId = null;
        }

        
        const [newTicket] = await database.insert(preventiveMaintenanceTickets)
          .values({
            ...data,
            categoryId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        
if (ticketPermissions) { 
        sendEmailToAssignedUser(newTicket as z.infer<typeof ticketSchema>);
}
        setTickets(prevTickets => [...prevTickets, newTicket as Ticket]);
        // Update machine status
        const newStatus = data.critical ? 'under maintenance' : 'has problems';
        await updateMachineStatus(data.machineId, newStatus);
      }

      setIsDialogOpen(false);
      setEditingTicket(null);
      form.reset();
      toast({
        title: `Ticket ${editingTicket ? 'updated' : 'added'}`,
        description: `The ticket has been successfully ${editingTicket ? 'updated' : 'added'}.`,
      });
      fetchTickets();
    } catch (error) {
      console.error('Error saving ticket:', error);
      toast({
        title: `Error ${editingTicket ? 'updating' : 'adding'} ticket`,
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const sendEmailToAssignedUser = async (data: z.infer<typeof ticketSchema>) => {
    try {
      const assignedUser = users.find((user) => user.id === data.userId);
      const assignedMachine = machines.find((machine) => machine.id === data.machineId);
      const formattedDate = format(new Date(data.scheduledDate), "PPP");
      const category = machineCategories.find((category) => category.id === data.categoryId);
      const ticketData = {
        title: data.title,
        description: data.description,
        scheduledDate: formattedDate,
        machineName: assignedMachine?.name,
        category: category?.name,
        critical: data.critical,
      };
      const htmlTemplate = generateEmailTemplate('ticket', ticketData);
      if (assignedUser) {
        await sendEmail({
          from: 'randomthinigs@marquardt.de',
          to: assignedUser.emailAddress,
          subject: `New Maintenance Ticket Notification : ${data.title}`,
          html: htmlTemplate,
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  const handleEdit = (ticket: Ticket) => {
    if(ticketPermissions){
    setEditingTicket(ticket);
    setIsDialogOpen(true);
    }else{
      toast({
        title: 'Error updating ticket',
        description: 'You do not have permission to update tickets.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (ticketId: number) => {
    if (ticketPermissions){
    try {
      await database.delete(preventiveMaintenanceTickets)
        .where(eq(preventiveMaintenanceTickets.id, ticketId));
      setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== ticketId));
      updateAllMachineStatuses();
      toast({
        title: 'Ticket deleted',
        description: 'The ticket has been successfully removed.',
      });
    } catch (error) {
      console.error('Error deleting ticket:', error);
      toast({
        title: 'Error deleting ticket',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } } else {
      toast({
        title: 'Error deleting ticket',
        description: 'You do not have permission to delete tickets.',
        variant: 'destructive',
      });
    }
  };

  const handleComplete = async (ticketId: number) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket && (ticketPermissions || ticket.userId === id)) {
      setEditingTicket(ticket);
      setIsCompleteDialogOpen(true);
    } else {
      toast({
        title: 'Error completing ticket',
        description: 'You do not have permission to complete this ticket.',
        variant: 'destructive',
      });
    }
  };
  const handleAssignTicket = async () => {
    if (!assigningTicketId || !selectedUserId) return;

    try {
      await database.update(preventiveMaintenanceTickets)
        .set({ userId: selectedUserId })
        .where(eq(preventiveMaintenanceTickets.id, assigningTicketId));
      
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket.id === assigningTicketId ? { ...ticket, userId: selectedUserId } : ticket
        )
      );
  

      const updatedTicket = tickets.find(t => t.id === assigningTicketId);
      if (updatedTicket) {
        sendEmailToAssignedUser(updatedTicket as z.infer<typeof ticketSchema>);
      }

      fetchTickets();

      toast({
        title: 'Ticket assigned',
        description: 'The ticket has been successfully assigned.',
      });

      setIsAssignDialogOpen(false);
      setAssigningTicketId(null);
      setSelectedUserId(null);
    } catch (error) {
      console.error('Error assigning ticket:', error);
      toast({
        title: 'Error assigning ticket',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const formatDate = (date) => {
    // Format the date according to the options
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(date);
  };
  const submitCompletion = async () => {
    if (!editingTicket) return;
  
    try {
      const isLate = new Date(editingTicket.scheduledDate) < new Date();
      const currentDate = new Date();
      await database.update(preventiveMaintenanceTickets)
        .set({
          status: isLate ? 'completed late' : 'completed',
          completionNotes: completionNote,
          interventionType: isExternal,
          updatedAt: currentDate,
          completedDate: currentDate,
        })
        .where(eq(preventiveMaintenanceTickets.id, editingTicket.id));
      setisExternal(false);
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket.id === editingTicket.id
            ? { ...ticket, status: isLate ? 'completed late' : 'completed', completionNotes: completionNote }
            : ticket
        )
      );
  
      await updateMachineStatus(editingTicket.machineId, 'active');
  
      if (generateReport) {
        setIsCompleteDialogOpen(false);
        setIsSaveLocationDialogOpen(true);
      } else {
        setIsCompleteDialogOpen(false);
        setEditingTicket(null);
        setCompletionNote("");
        fetchTickets();
      }
  
    } catch (error) {
      console.error('Error completing ticket:', error);
      toast({
        title: 'Error completing ticket',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };
  
  const generatePdfReport = async () => {
    if (!editingTicket) return;
  
    try {
      const completionData = {
        problem: reportProblem,
        solution: reportSolution,
        notes: reportNotes,
      };
      const pdfBlob = await PdfReportGenerator.generateReport(editingTicket , completionData);
  
      let filePath = '';
      let pdfUrl = '';
      if (saveToDocs) {
        // Save to default documents folder
        filePath = `${config.uploadFolderPath}/maintenance_report_${editingTicket.title}_${editingTicket.machine?.name}_${formatDate(new Date())}.pdf`;
        await window.api.savePdf(filePath, await pdfBlob.arrayBuffer());
  
        toast({
          title: 'PDF Report Generated',
          description: `Report saved to ${filePath}`,
        });
  
        // Provide the option to view the PDF
        setViewPdfPath(filePath);
      } else {
        // Generate a Blob URL for download
        pdfUrl = URL.createObjectURL(pdfBlob);
        
        toast({
          title: 'PDF Report Generated',
          description: `Report is ready for download.`,
        });
  
        // Trigger the download
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = `maintenance_report_${editingTicket.title}_${editingTicket.machine?.name}_${formatDate(new Date())}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(pdfUrl);
  
      }
  
      setIsSaveLocationDialogOpen(false);
      if (saveToDocs) {
        setIsViewPdfDialogOpen(true);
      }
      setEditingTicket(null);
      setCompletionNote("");
      setReportProblem("");
      setReportSolution("");
      setReportNotes("");
      fetchTickets();
    } catch (error) {
      console.error('Error generating PDF report:', error);
      toast({
        title: 'Error generating PDF report',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };
  


  const columns: ColumnDef<Ticket>[] = [
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="capitalize">{row.getValue("title")}</div>,
    },
    {
      accessorKey: "machine.name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Machine
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
            Assigned To
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const ticket = row.original;
        return ticket.userId ? (ticket.user?.username || "Unknown") : "Not Assigned";
      },
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
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            status === 'in progress' ? 'bg-blue-100 text-blue-800' :
              status === 'completed' ? 'bg-green-100 text-green-800' :
                status === 'completed late' ? 'bg-red-100 text-red-800' :
                  status === 'late' ? 'bg-red-200 text-red-900' :
                    'bg-gray-100 text-gray-800'
            }`}>
            {status}
          </span>
        );
      },
    },
    {
      accessorKey: "scheduledDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Scheduled Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => format(new Date(row.getValue("scheduledDate")), "PPP"),
    },
    {
      accessorKey: "completedDate",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Completed Date
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => row.getValue("completedDate") ? format(new Date(row.getValue("completedDate")), "PPP") : "N/A",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.preventDefault()}>
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {ticketPermissions && (
                <DropdownMenuItem onSelect={(event) => {
                  event.preventDefault();
                  handleEdit(ticket);
                }}>
                  Edit
                </DropdownMenuItem>
              )}
              {(ticketPermissions || ticket.userId === id) && ticket.status !== 'completed' && ticket.status !== 'completed late' && (
                <DropdownMenuItem onSelect={(event) => {
                  event.preventDefault();
                  handleComplete(ticket.id);
                }}>
                  Complete
                </DropdownMenuItem>
              )}
              {ticketPermissions && ticket.status !== 'completed' && ticket.status !== 'completed late' && (
                <DropdownMenuItem onSelect={(event) => {
                  event.preventDefault();
                  setAssigningTicketId(ticket.id);
                  setIsAssignDialogOpen(true);
                }}>
                  {ticket.userId ? "Reassign Ticket" : "Assign Ticket"}
                </DropdownMenuItem>
              )}
              {ticketPermissions && (
                <DropdownMenuItem onSelect={(event) => {
                  event.preventDefault();
                  handleDelete(ticket.id);
                }} className="text-red-600">
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Preventive Maintenance Tickets</CardTitle>
        <CardDescription>Manage and track maintenance tasks efficiently</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-4 mb-6">
          <Select onValueChange={(value) => setFilterMachine(value ? Number(value) : null)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Machine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Machines</SelectItem>
              {machines.map((machine) => (
                <SelectItem key={machine.id} value={machine.id.toString()}>
                  {machine.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => setFilterUser(value === 'all' ? null : Number(value))}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by User" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.username}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => setFilterStatus(value === 'all' ? null : value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="completed late">Completed Late</SelectItem>
              <SelectItem value="late">Late</SelectItem>
            </SelectContent>
          </Select>
          <DateRangePicker
            from={dateRange.from}
            to={dateRange.to}
            onSelect={setDateRange}
          />
        </div>
        <div className='flex justify-end'>
          <Button
            onClick={() => {
              setEditingTicket(null);
              setIsDialogOpen(true);
            }}
            className="mb-6 mr-2"
          >
            Add New Ticket
          </Button>
          {ticketPermissions && (
            <Button onClick={updateOverdueTickets}>Update Overdue Tickets</Button>
          )}
          {ticketPermissions && (
            <Button onClick={updateAllMachineStatuses} className="ml-2">Update Machine Statuses</Button>
          )}
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <p className="text-lg">Loading...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredTickets}
            onRowClick={(ticket) => {
              setSelectedTicket(ticket);
            }}
            actionsColumnId="actions"  // Add this line
          />
        )}
      </CardContent>

      <TicketForm
        isOpen={isDialogOpen}
        onClose={setIsDialogOpen}
        onSubmit={onSubmit}
        machines={machines}
        users={users}
        machineCategories={machineCategories}
        editingTicket={editingTicket}
        ticketPermissions={ticketPermissions}
        currentUserId={id}
      />

<Dialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Complete Ticket</DialogTitle>
      <DialogDescription>
        Add a completion note for this ticket.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="completionNote" className="text-right">
          Completion Note
        </label>
        <Textarea
          id="completionNote"
          value={completionNote}
          onChange={(e) => setCompletionNote(e.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="items-top flex space-x-2">
        <Checkbox
          id="externalProvider"
          checked={isExternal}
          defaultChecked={false}
          onCheckedChange={(checked) => setisExternal(checked === 'indeterminate' ? false : checked)}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="externalProvider"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Was this intervention completed by an external provider?
          </label>
          <p className="text-sm text-muted-foreground">
            Check this box if the intervention was handled by an external provider.
          </p>
        </div>
      </div>
      <div className="items-top flex space-x-2">
        <Checkbox
          id="generateReport"
          checked={generateReport}
          defaultChecked={false}
          onCheckedChange={(checked) => setGenerateReport(checked === 'indeterminate' ? false : checked)}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="generateReport"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Generate PDF Report
          </label>
          <p className="text-sm text-muted-foreground">
            Check this box if you want to generate a PDF report for this ticket.
          </p>
        </div>
      </div>
    </div>
    <DialogFooter>
      <Button onClick={submitCompletion}>Complete Ticket</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
<Dialog open={isSaveLocationDialogOpen} onOpenChange={setIsSaveLocationDialogOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Provide Report Details</DialogTitle>
      <DialogDescription>
        Fill in the details for the PDF report.
      </DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="reportProblem" className="text-right">
          Problem
        </label>
        <Textarea
          id="reportProblem"
          value={reportProblem}
          onChange={(e) => setReportProblem(e.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="reportSolution" className="text-right">
          Solution
        </label>
        <Textarea
          id="reportSolution"
          value={reportSolution}
          onChange={(e) => setReportSolution(e.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <label htmlFor="reportNotes" className="text-right">
          Additional Notes
        </label>
        <Textarea
          id="reportNotes"
          value={reportNotes}
          onChange={(e) => setReportNotes(e.target.value)}
          className="col-span-3"
        />
      </div>
      <div className="grid grid-cols-[auto,1fr] items-start gap-4">
        <Checkbox
          id="saveToDocs"
          checked={saveToDocs}
          defaultChecked={true}
          onCheckedChange={(checked) => setSaveToDocs(checked === 'indeterminate' ? false : checked)}
          className="mt-1.5"
        />
        <div>
          <label
            htmlFor="saveToDocs"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Save to Documents Folder
          </label>
          <p className="text-sm text-muted-foreground mt-1">
            Check this box to save the report to the default documents folder.
          </p>
        </div>
      </div>
    </div>
    <DialogFooter>
      <Button onClick={generatePdfReport}>Save Report</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>



<Dialog open={isGeneratingReport} onOpenChange={setIsGeneratingReport}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Generate PDF Report</DialogTitle>
            <DialogDescription>
              Provide details for the PDF report.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="reportProblem" className="text-right">
                Problem
              </label>
              <Textarea
                id="reportProblem"
                value={reportProblem}
                onChange={(e) => setReportProblem(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="reportSolution" className="text-right">
                Solution
              </label>
              <Textarea
                id="reportSolution"
                value={reportSolution}
                onChange={(e) => setReportSolution(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="reportNotes" className="text-right">
                Additional Notes
              </label>
              <Textarea
                id="reportNotes"
                value={reportNotes}
                onChange={(e) => setReportNotes(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={generatePdfReport}>Generate PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

<Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Assign Ticket</DialogTitle>
            <DialogDescription>
              Select a user to assign this ticket to.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="assignUser" className="text-right">
                Assign to
              </label>
              <Select onValueChange={(value) => setSelectedUserId(Number(value))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAssignTicket}>Assign Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isViewPdfDialogOpen} onOpenChange={setIsViewPdfDialogOpen}>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>View PDF Report</DialogTitle>
      <DialogDescription>
        The PDF report has been generated. You can view it using the button below.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      {viewPdfPath && (
        <>
            <Button onClick={() => window.api.openFile(viewPdfPath)}>View PDF Report</Button>
          <Button onClick={() => setIsViewPdfDialogOpen(false)}>Close</Button>
        </>
      )}
    </DialogFooter>
  </DialogContent>
</Dialog>





      {selectedTicket && (
        <TicketDetails
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </Card>
  );
};

export default TicketManager;