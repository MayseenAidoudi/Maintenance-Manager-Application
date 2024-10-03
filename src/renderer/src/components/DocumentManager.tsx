import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useToast } from './ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "./ui/form";
import { MachineDocument } from '../interfaces';
import { addMachineIdPrefix, getFileExtension } from '../utils/FileUtils';

interface DocumentManagerProps {
  machineId: number;
  machineName: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentAdded: (document: MachineDocument) => void;
}

const DocumentManager: React.FC<DocumentManagerProps> = ({ machineId, machineName, isOpen, onOpenChange, onDocumentAdded }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();

  const form = useForm<Omit<MachineDocument, 'id'>>({
    defaultValues: {
      documentName: '',
      documentType: '',
      documentPath: '',
      machineId: machineId,
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      form.setValue('documentName', file.name);
      form.setValue('documentType', getFileExtension(file.name));
    }
  };

  const handleSubmit = async (data: Omit<MachineDocument, 'id'>) => {
    if (selectedFile) {
      try {
        const prefixedFileName = addMachineIdPrefix(machineId, selectedFile.name);
        const config: any = await window.api.getConfig();
        const documentFolderPath = config.uploadFolderPath;
        const destinationPath = `${documentFolderPath}\\${prefixedFileName}`;
  
        const uploadPath = await window.api.uploadFile(selectedFile.path, destinationPath);
  
        const newDocument: MachineDocument = {
          ...data,
          id: Date.now(), // This is a temporary ID, it will be replaced by the database
          documentPath: uploadPath,
        };
  
        onDocumentAdded(newDocument);
        onOpenChange(false);
        form.reset();
        setSelectedFile(null);
        toast({
          title: 'Success',
          description: 'Document uploaded and added successfully.',
        });
      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          title: 'Error',
          description: 'Failed to upload file or add document. Please try again.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Error',
        description: 'No file selected',
        variant: 'destructive',
      });
    }
  };
  

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Add Document for Machine {machineId} - {machineName}</DialogTitle>
          <DialogDescription>Upload a new document and save its information.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="documentName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Name</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly />
                  </FormControl>
                </FormItem>
              )}
            />
            <div>
              <Input type="file" onChange={handleFileSelect} />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={!selectedFile}>Upload and Save Document</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentManager;