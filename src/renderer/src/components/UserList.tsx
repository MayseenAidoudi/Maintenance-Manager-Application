import React, { useState } from 'react';
import { User, UserCreate } from '../interfaces';
import { database } from '../db';
import { users as usertable } from '../../../main/schema';
import { eq } from 'drizzle-orm';
import { Button } from '@renderer/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@renderer/components/ui/dialog';
import { Input } from '@renderer/components/ui/input';
import { Checkbox } from "@renderer/components/ui/checkbox";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@renderer/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@renderer/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@renderer/components/ui/use-toast";
import { DataTable } from '@renderer/components/DataTable';
import UserForm from './UserForm';
import { ColumnDef } from '@tanstack/react-table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import {useAuth} from '../context/AuthContext'; // Import the useAuth hook

interface UserListProps {
  users: User[];
  isLoading: boolean;
  onUserUpdated: (user: User) => void;
  onUserDeleted: (userId: number) => void;
  onUserCreated: (user: User) => void;
}

const UserList: React.FC<UserListProps> = ({ users, isLoading, onUserUpdated, onUserDeleted, onUserCreated }) => {
  const { isAdmin, id, ticketPermissions } = useAuth(); // Destructure isAdmin and currentUser from useAuth
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<UserCreate>({
    defaultValues: {
      username: '',
      emailAddress: '',
      firstName: '',
      lastName: '',
      password: '',
      admin: false,
      ticketPermissions: false,
    },
  });

  const handleDelete = async (id: number) => {
    try {
      await database.delete(usertable).where(eq(usertable.id, id));
      onUserDeleted(id);
      toast({
        title: "User deleted",
        description: "The user has been successfully removed.",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "Error deleting user",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      username: user.username,
      emailAddress: user.emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      password: '',
      admin: user.admin,
      ticketPermissions: user.ticketPermissions,
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = async (data: UserCreate) => {
    if (editingUser) {
      try {
        const updateQuery = database.update(usertable)
          .set({
            username: data.username,
            emailAddress: data.emailAddress,
            firstName: data.firstName,
            lastName: data.lastName,
            admin: data.admin,
            ticketPermissions: data.ticketPermissions,
          })
          .where(eq(usertable.id, editingUser.id));

        if (data.password !== '') {
          await updateQuery.execute();
          const passwordUpdateQuery = database.update(usertable)
            .set({ password: data.password })
            .where(eq(usertable.id, editingUser.id));
          await passwordUpdateQuery.execute();
        } else {
          await updateQuery.execute();
        }

        const updatedUser = await database.select().from(usertable)
          .where(eq(usertable.id, editingUser.id)).limit(1);

        if (updatedUser) {
          onUserUpdated(updatedUser[0]);
          setEditingUser(null);
          setIsEditDialogOpen(false);
          toast({
            title: "User updated",
            description: "The user information has been successfully updated.",
          });
        }
      } catch (error) {
        console.error('Error updating user:', error);
        toast({
          title: "Error updating user",
          description: "Please try again later.",
          variant: "destructive",
        });
      }
    }
  };

  // Filter users if not an admin
  const filteredUsers = isAdmin ? users : users.filter(user => user.id === id);

  // Define columns for the DataTable
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => <div>{row.original.username}</div>,
    },
    {
      accessorKey: "emailAddress",
      header: "Email",
      cell: ({ row }) => <div>{row.original.emailAddress}</div>,
    },
    {
      accessorKey: "firstName",
      header: "First Name",
      cell: ({ row }) => <div>{row.original.firstName}</div>,
    },
    {
      accessorKey: "lastName",
      header: "Last Name",
      cell: ({ row }) => <div>{row.original.lastName}</div>,
    },
    {
      accessorKey: "admin",
      header: "Admin",
      cell: ({ row }) => <div>{row.original.admin ? "Yes" : "No"}</div>,
    },
    {
      accessorKey: "ticketPermissions",
      header: "Ticket Permissions",
      cell: ({ row }) => <div>{row.original.ticketPermissions ? "Yes" : "No"}</div>,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              •••
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isAdmin || row.original.id === id ? (
              <>
                <DropdownMenuItem onClick={() => handleEdit(row.original)}>
                  Edit
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => handleDelete(row.original.id)}>
                    Delete
                  </DropdownMenuItem>
                )}
              </>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        <CardDescription>View and manage registered users</CardDescription>
      </CardHeader>
      <CardContent>
        {isAdmin && (
          <div className="mb-4">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <div className="flex justify-end mr-6">
                <DialogTrigger asChild>
                  <Button>Add New User</Button>
                </DialogTrigger>
              </div>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>
                    Fill in the details to create a new user account.
                  </DialogDescription>
                </DialogHeader>
                <UserForm onClose={() => setIsCreateDialogOpen(false)} onUserCreated={onUserCreated} external={false} isAdmin={isAdmin} />
              </DialogContent>
            </Dialog>
          </div>
        )}

        {isLoading ? (
          <div>Loading users...</div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredUsers}
          />
        )}

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Make changes to the user's details here. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="emailAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {isAdmin && (
                  <FormField
                  control={form.control}
                  name="admin"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Admin</FormLabel>
                        <FormDescription>This gives the user admin privileges</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                )}
                {ticketPermissions && (
                  <FormField
                  control={form.control}
                  name="ticketPermissions"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Ticket Permissions</FormLabel>
                        <FormDescription>This gives the user ticket permissions</FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                )}
                <DialogFooter>
                  <Button type="submit">Save</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default UserList;
