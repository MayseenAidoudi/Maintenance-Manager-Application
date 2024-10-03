import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@renderer/components/ui/form';
import { Card, CardHeader, CardTitle, CardContent } from '@renderer/components/ui/card';
import { useToast } from '@renderer/components/ui/use-toast';
import { useAuth } from '../context/AuthContext';
import { users } from '../../../main/schema';
import { database } from '@renderer/db';
import { eq } from 'drizzle-orm';
import imgUrl from '../assets/marquardt.svg';
import UserForm from './UserForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@renderer/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@renderer/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { sendEmail } from '@renderer/emailSender';
import { generateEmailTemplate } from './EmailTemplate';

interface LoginFormInputs {
  username: string;
  password: string;
}

interface ForgotPasswordInputs {
  email: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}

const LoginForm: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(1);
  const [otpValue, setOtpValue] = useState('');
  const [secretOtp, setSecretOtp] = useState(0);
  const { toast } = useToast();
  const { login } = useAuth();

  const loginForm = useForm<LoginFormInputs>({
    defaultValues: {
      username: '',
      password: ''
    }
  });

  const forgotPasswordForm = useForm<ForgotPasswordInputs>({
    defaultValues: {
      email: '',
      otp: '',
      newPassword: '',
      confirmPassword: ''
    }
  });

  const onSubmit = async (data: LoginFormInputs) => {
    try {
      const result = await database.select()
        .from(users)
        .where(eq(users.username, data.username))
        .limit(1);

      if (result.length === 0) {
        throw new Error('User not found');
      }

      const user = result[0];
      if (user.password !== data.password) {
        throw new Error('Invalid password');
      }

      login(user.id, user.username, user.admin, user.ticketPermissions);
      onLogin();
      toast({
        title: 'Login successful',
        description: 'You are now logged in.',
      });
    } catch (error) {
      console.error('Login failed:', error);
      toast({
        title: 'Login failed',
        description: 'Invalid username or password.',
        variant: 'destructive',
      });
    }
  };

  const onForgotPasswordSubmit = async (data: ForgotPasswordInputs) => {
    if (forgotPasswordStep === 1) {
      try {
        // Query the database for the email
        const result = await database
          .select()
          .from(users)
          .where(eq(users.emailAddress, data.email))
          .limit(1);


  
        // If no user is found with the given email, throw an error
        if (result.length === 0) {
          throw new Error('User not found');
        }
        const generatedOtpCode = Math.floor(100000 + Math.random() * 900000);
        setSecretOtp(generatedOtpCode)
        // Proceed to the OTP step
        const htmlTemplate = generateEmailTemplate('password', generatedOtpCode);

        await sendEmail({
          from: 'randomthinigs@marquardt.de',
          to: data.email,
          subject: `Maintenance App Password Reset`,
          html: htmlTemplate,
        });
        toast({
          title: 'OTP Sent',
          description: 'An OTP has been sent to your email. Please check and enter it in the next step.',
        });
        setForgotPasswordStep(2);
      } catch (error) {
        console.error('Error during forgot password:', error);
        toast({
          title: 'Error',
          description: 'No user found with the provided email address.',
          variant: 'destructive',
        });
      }
    } else if (forgotPasswordStep === 2) {
      // Implement OTP verification logic here
      if (Number(otpValue) === secretOtp) {
        setForgotPasswordStep(3);
      }
      else{
        toast({
          title: 'Error',
          description: 'The OTP coe you provided is incorrect',
          variant: 'destructive',
        });
      }
      // If OTP is correct, move to step 3
      
    } else if (forgotPasswordStep === 3) {
      // Implement password change logic here
      console.log('New password submitted');
      if (data.newPassword !== data.confirmPassword) {
        toast({
          title: 'Error',
          description: 'Passwords do not match.',
          variant: 'destructive',
        });
        return;
      }

      try {
        await database.update(users).set(
          {
            password: data.confirmPassword
          }
        ).where(eq(users.emailAddress,data.email))
      } catch {
        toast({
          title: 'Error Reseting Password',
          description: 'An error occured when trying to reset password'
        })
      } finally {
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset. You can now log in with your new password.',
      });
    }
      
      setForgotPasswordOpen(false);
      setForgotPasswordStep(1);
    }
  };

  const renderForgotPasswordContent = () => {
    switch (forgotPasswordStep) {
      case 1:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Forgot Password</DialogTitle>
              <DialogDescription>
                Enter your email address to request a password reset.
              </DialogDescription>
            </DialogHeader>
            <Form {...forgotPasswordForm}>
              <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                <FormField
                  control={forgotPasswordForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Request OTP</Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        );
      case 2:
        return (
          <>
          <DialogHeader>
            <DialogTitle>Enter OTP</DialogTitle>
            <DialogDescription>
              Enter the 6-digit OTP sent to your email.
            </DialogDescription>
          </DialogHeader>
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
              <FormField
                control={forgotPasswordForm.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>OTP</FormLabel>
                    <FormControl>
                    <InputOTP
                    value={otpValue}
                    onChange={(value) => {
                      setOtpValue(value);
                      field.onChange(value);
                    }}
  maxLength={6}
  pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
>
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                    </FormControl>
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit">Verify OTP</Button>
              </DialogFooter>
            </form>
          </Form>
        </>
        );
      case 3:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Reset Password</DialogTitle>
              <DialogDescription>
                Enter your new password.
              </DialogDescription>
            </DialogHeader>
            <Form {...forgotPasswordForm}>
              <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPasswordSubmit)} className="space-y-4">
                <FormField
                  control={forgotPasswordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter new password" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={forgotPasswordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm new password" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="submit">Reset Password</Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center w-full max-w-md mx-auto ${activeTab === 'register' ? 'mb-4' : 'mb-14'}`}>
      <img
        src={imgUrl}
        alt="Marquardt Logo"
        className="w-64 h-auto mb-6"
      />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium text-center text-gray-500 border-b border-gray-200 dark:text-gray-400 dark:border-gray-700 mb-6">
            <ul className="flex flex-wrap -mb-px justify-center">
              <li className="me-2">
                <a
                  href="#"
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'login'
                    ? 'text-[rgb(0,154,155)] border-[rgb(0,154,155)] active dark:text-[rgb(0,184,185)] dark:border-[rgb(0,184,185)]'
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                    }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('login');
                  }}
                >
                  Login
                </a>
              </li>
              <li className="me-2">
                <a
                  href="#"
                  className={`inline-block p-4 border-b-2 rounded-t-lg ${activeTab === 'register'
                    ? 'text-[rgb(0,154,155)] border-[rgb(0,154,155)] active dark:text-[rgb(0,184,185)] dark:border-[rgb(0,184,185)]'
                    : 'border-transparent hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300'
                    }`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab('register');
                  }}
                >
                  Register
                </a>
              </li>
            </ul>
          </div>
          {activeTab === 'login' ? (
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Login</Button>
              </form>
            </Form>
          ) : (
            <UserForm
              onClose={() => setActiveTab('login')}
              onUserCreated={(_user) => {
                toast({
                  title: 'Registration successful',
                  description: 'You can now log in with your new account.',
                });
                setActiveTab('login');
              }}
              external={true}
              isAdmin={false}
            />
          )}

          {activeTab === 'login' && (
            <Dialog 
              open={forgotPasswordOpen} 
              onOpenChange={(open) => {
                setForgotPasswordOpen(open);
                if (!open) setForgotPasswordStep(1);
              }}
            >
              <DialogTrigger asChild>
                <Button variant="link" className="mt-4">
                  Forgot Password?
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                {renderForgotPasswordContent()}
              </DialogContent>
            </Dialog>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;