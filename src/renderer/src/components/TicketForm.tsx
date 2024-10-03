import React, { useEffect, useState } from "react";
import { useForm, FormProvider } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@renderer/components/ui/form";
import { Input } from "@renderer/components/ui/input";
import { Textarea } from "@renderer/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@renderer/components/ui/select";
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { format } from "date-fns";
import { CalendarIcon } from 'lucide-react';
import { Switch } from './ui/switch';
import { MachineCategory } from "@renderer/interfaces";

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  scheduledDate: Date;
  machineId: number;
  userId: number | null;
  machine?: { name: string };
  user?: { username: string };
  critical: boolean;
  categoryId?: number;
  category?: MachineCategory;
}

// Define the ticket schema using zod
const ticketSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.string(),
  scheduledDate: z.date(),
  machineId: z.number(),
  userId: z.number().nullable(),
  critical: z.boolean(),
  categoryId: z.union([z.number(), z.string()]), // Allow string 'new' for new category
  newCategoryName: z.string().optional(), // Only needed if creating a new category
});

type TicketFormProps = {
  isOpen: boolean;
  onClose: any;
  onSubmit: any;
  machines: { id: number; name: string }[];
  users: { id: number; username: string }[];
  machineCategories: MachineCategory[];
  editingTicket: Ticket | null;
  ticketPermissions: boolean;
  currentUserId: number | null ;
};

export const TicketForm: React.FC<TicketFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  machines,
  users,
  machineCategories,
  editingTicket,
  ticketPermissions,
  currentUserId,
}) => {
  const [selectedMachineId, setSelectedMachineId] = useState<number | null | undefined>(null);

  const form = useForm<z.infer<typeof ticketSchema>>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      scheduledDate: new Date(),
      machineId: 0,
      userId: ticketPermissions ? null : null,
      critical: false,
    },
  });

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
      setSelectedMachineId(editingTicket.machineId);
    } else {
      form.reset({
        title: "",
        description: "",
        status: "pending",
        scheduledDate: new Date(),
        machineId: 0,
        userId: ticketPermissions ? 0 : null,
        categoryId: "new",
        critical: false,
      });
      setSelectedMachineId(0);
    }
  }, [editingTicket, form, ticketPermissions]);

  useEffect(() => {
    const subscription = form.watch((value) => {
      setSelectedMachineId(value.machineId);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Filter categories based on selected machineId
  const filteredCategories = machineCategories.filter(
    (category) => category.machineId === null || category.machineId === selectedMachineId
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{editingTicket ? "Edit Ticket" : "Add New Ticket"}</DialogTitle>
          <DialogDescription>
            {editingTicket ? "Update ticket details." : "Create a new preventive maintenance ticket."}
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ticket title" />
                    </FormControl>
                    <FormMessage />
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
                    <Textarea {...field} placeholder="Ticket description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Scheduled Date</FormLabel>
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
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="critical"
              render={({ field }) => (
                <FormItem className="grid grid-cols-2 gap-4">
                  <div className="">
                    <FormLabel className="text-sm font-medium">Critical</FormLabel>
                    <FormDescription className="text-xs text-gray-500">
                      Check this if the machine cannot be operated without fixing this issue.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="machineId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Machine</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={field.value?.toString() || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select machine" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {machines.map((machine) => (
                          <SelectItem key={machine.id} value={machine.id.toString()}>
                            {machine.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {ticketPermissions && (
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign User</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                      defaultValue={field.value?.toString() || 'null'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='-1'>Unassigned</SelectItem>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              )}
            </div>
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem className="grid grid-cols-2 gap-4">
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={(value) => field.onChange(value === "new" ? "new" : Number(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">Create New Category</SelectItem>
                        {filteredCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch("categoryId") === "new" && (
              <FormField
                control={form.control}
                name="newCategoryName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Category Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter new category name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {editingTicket ? "Update Ticket" : "Add Ticket"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};
