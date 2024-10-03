import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription } from './ui/form';
import { useToast } from './ui/use-toast';
import { database } from '../db';
import { users } from '../../../main/schema';
import { eq, or } from 'drizzle-orm';
import { useAuth } from '../context/AuthContext';
import { User, UserCreate } from '../interfaces';
import { Checkbox } from './ui/checkbox';

interface UserFormProps {
  onClose: () => void;
  onUserCreated: (user: User) => void;
  external: boolean;
  isAdmin: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ onClose, onUserCreated, external, isAdmin }) => {
  const { toast } = useToast();
  const { login } = useAuth();
  const form = useForm<UserCreate>({
    defaultValues: {
      username: '',
      emailAddress: '',
      password: '',
      firstName: '',
      lastName: '',
      admin: false,
    },
  });

  const onSubmit = async (data: UserCreate) => {
    try {
      // Check if the username or email already exists
      const existingUser = await database.select().from(users).where(
        or(eq(users.username, data.username), eq(users.emailAddress, data.emailAddress))
      ).limit(1);
  
      if (existingUser.length > 0) {
        toast({
          title: "Error creating user",
          description: "Username or email already exists.",
          variant: "destructive",
        });
        return;
      }
  
      // Insert the new user
      const insertedUser = await database.insert(users).values({
        username: data.username,
        emailAddress: data.emailAddress,
        password: data.password, // Note: In a real application, you should hash the password before storing it
        firstName: data.firstName,
        lastName: data.lastName,
        admin: data.admin,
      }).returning();
  
      if (insertedUser) {
        const newUser = insertedUser[0];

        // Automatically log in the user after registration
        if (!isAdmin && external ) {
        login(newUser.id, newUser.username, newUser.admin, newUser.ticketPermissions);

        }

        onUserCreated(newUser); // Signal that the user was created and logged in
        form.reset();
        onClose();
        toast({
          title: "Registration successful",
          description: "You are now logged in.",
        });
      } else {
        throw new Error("Failed to create user");
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({
        title: "Error creating user",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} className="w-full" />
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
                  <Input {...field} className="w-full" />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input {...field} className="w-full" />
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
                <Input type="email" {...field} className="w-full" />
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
                <Input type="password" {...field} className="w-full" />
              </FormControl>
            </FormItem>
          )}
        />
        {!external && 
        <FormField
          control={form.control}
          name="admin"
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
                  Admin
                </FormLabel>
                <FormDescription>
                  This user will have administrative privileges
                </FormDescription>
              </div>
            </FormItem>
          )}
        /> }

        <Button type="submit" className="w-full">
          {external ?  "Register" : "Create User"}
        </Button>
      </form>
    </Form>
  );
};

export default UserForm;
