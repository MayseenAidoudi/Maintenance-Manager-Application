import React, { useEffect, useState } from 'react';
import { Checklist, ChecklistCompletion, Machine, MachineDocument, Supplier, User } from '../interfaces';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@renderer/components/ui/card";
import { Separator } from "@renderer/components/ui/separator";
import { Button } from "@renderer/components/ui/button";
import { Badge } from "@renderer/components/ui/badge";
import { ScrollArea } from "@renderer/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@renderer/components/ui/avatar";
import { CalendarDays, FileText, MapPin, Edit, ChevronLeft, Wrench } from "lucide-react";
import MachineForm from './MachineForm';
import { toast } from './ui/use-toast';
import { database } from '@renderer/db';
import { checklists, machineDocuments, machines as machinesTable, users as usersTable, machineDocuments as machineDocumentsTable, suppliers as suppliersTable, checklistCompletion as checklistCompletionTable, machineGroups as machineGroupsTable } from '../../../main/schema';
import { and, desc, eq, notInArray  } from 'drizzle-orm';
import ChecklistManager from './ChecklistManager';
import DocumentManager from './DocumentManager';
import { getFileExtension, hasMachineIdPrefix, removeMachineIdPrefix } from '../utils/FileUtils';
import { TableCell, TableRow, Table as ShadTable } from './ui/table';
import { AccessoryManager } from './AccessoryManager';
import { SparePartsManager } from './SparePartsManager';
import GenericAccessoryManager from './GenericAccessoryManager';

interface MachineDetailsProps {
  machine: Machine;
  machines: Machine[];
  users: User[];
  suppliers: Supplier[];
  setMachines: React.Dispatch<React.SetStateAction<Machine[]>>;
  activeTab: string;
  onBackToMachines: () => void;
  onSuppliersUpdated: () => void;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  fetchMachines: () => void;
}

interface FileInfo {
  name: string;
  path: string;
}

const MachineDetails: React.FC<MachineDetailsProps> = ({ machine, suppliers, users, activeTab, onBackToMachines, onSuppliersUpdated, setSuppliers, fetchMachines }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [assignedUser, setAssignedUser] = useState<User | undefined>(undefined);
  const [machineChecklists, setMachineChecklists] = useState<Checklist[]>([]);
  const [selectedTab, setSelectedTab] = useState(activeTab);
  const [isDocumentManagerOpen, setIsDocumentManagerOpen] = useState(false);
  const [documents, setDocuments] = useState<MachineDocument[]>([]);


  useEffect(() => {
    fetchDocuments();
    fetchSupplier();
    fetchChecklists();
    onSuppliersUpdated();
  }, [machine]);

  const syncDocuments = async () => {
    try {
      const config: any = await window.api.getConfig();
      const documentFolderPath = config.uploadFolderPath;

      const allFilesInFolder = await window.api.getFiles(documentFolderPath) as FileInfo[];

      // Filter files that belong to this machine
      const filesInFolder = allFilesInFolder.filter(file => hasMachineIdPrefix(machine.id, file.name));

      const documentsInDb = await database.query.machineDocuments.findMany({
        where: eq(machineDocumentsTable.machineId, machine.id)
      }) as MachineDocument[];

      const filesToAdd = filesInFolder.filter(file =>
        !documentsInDb.some(doc => doc.documentPath === file.path)
      );

      const documentsToRemove = documentsInDb.filter(doc =>
        !filesInFolder.some(file => file.path === doc.documentPath)
      );

      // Add new files to the database
      for (const file of filesToAdd) {
        const originalName = removeMachineIdPrefix(file.name);
        await database.insert(machineDocumentsTable).values({
          machineId: machine.id,
          documentName: originalName,
          documentPath: file.path,
          documentType: getFileExtension(originalName)
        });
      }

      // Remove documents from the database that are not in the folder
      if (documentsToRemove.length > 0 && filesInFolder.length > 0) {
        await database.delete(machineDocumentsTable)
          .where(
            and(
              eq(machineDocumentsTable.machineId, machine.id),
              notInArray(machineDocumentsTable.documentPath, filesInFolder.map(f => f.path))
            )
          );
      } else if (filesInFolder.length === 0) {
        await database.delete(machineDocumentsTable)
          .where(eq(machineDocumentsTable.machineId, machine.id));
      }

      await fetchDocuments();

      toast({
        title: 'Documents synchronized',
        description: `Added ${filesToAdd.length} new documents and removed ${documentsToRemove.length} missing documents.`,
      });
    } catch (error) {
      console.error('Error synchronizing documents:', error);
      toast({
        title: 'Error synchronizing documents',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const fetchDocuments = async () => {
    try {
      let fetchedDocuments: MachineDocument[] = [];
  
      // Fetch documents for the specific machine
      const machineSpecificDocuments = await database.query.machineDocuments.findMany({
        where: eq(machineDocuments.machineId, machine.id)
      }) as MachineDocument[];
  
      fetchedDocuments = [...machineSpecificDocuments];
  
      // If machine has a group ID, fetch documents for the group
      if (machine.machineGroupId) {
        const groupDocuments = await database.query.machineDocuments.findMany({
          where: eq(machineDocuments.machineGroupId, machine.machineGroupId)
        }) as MachineDocument[];
  
        // Merge group documents, avoiding duplicates
        groupDocuments.forEach(groupDoc => {
          if (!fetchedDocuments.some(doc => doc.id === groupDoc.id)) {
            fetchedDocuments.push(groupDoc);
          }
        });
      }
  
      setDocuments(fetchedDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Error fetching documents',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };


  const fetchSupplier = async () => {
    try {
      const fetchedSupplier: Supplier | undefined = await database.query.suppliers.findFirst({
        where: eq(suppliersTable.id, machine.supplierId ?? 0)
      }) as Supplier | undefined;

      setSuppliers((prevSuppliers) => { 
        if (fetchedSupplier) {
          if (!prevSuppliers.some(supplier => supplier.id === fetchedSupplier.id)) {
            return [...prevSuppliers, fetchedSupplier];
          }
        }
        return prevSuppliers;
      });
    } catch (error) {
      console.error('Error fetching supplier:', error);
      toast({
        title: 'Error fetching supplier',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleDocumentAdded = async (file: MachineDocument) => {
    try {

      // Insert the new document into the database
      await database.insert(machineDocumentsTable).values({
        machineId: machine.id,
        documentName: file.documentName, // Store original name without prefix
        documentPath: file.documentPath,
        machineGroupId: machine.machineGroupId,
  
        documentType: getFileExtension(file.documentName),
      });


      // Fetch the updated list of documents
      await fetchDocuments();

      // Close the document manager and show a success message
      setIsDocumentManagerOpen(false);
      toast({
        title: 'Document added',
        description: 'The document has been successfully uploaded and added to the machine.',
      });
    } catch (error) {
      console.error('Error adding document:', error);
      toast({
        title: 'Error adding document',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleDocumentDeleted = async (documentId: number) => {
    try {
      await database.delete(machineDocumentsTable)
        .where(eq(machineDocumentsTable.id, documentId));

      await window.api.deleteFile(documents.find(doc => doc.id === documentId)?.documentPath);
      // Fetch the updated list of documents
      await fetchDocuments();

      toast({
        title: 'Document deleted',
        description: 'The document has been successfully deleted.',
      });

    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Error deleting document',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };


  useEffect(() => {
    setAssignedUser(users.find(user => user.id === machine.userId));
    fetchChecklists();
  }, [machine.id, users]);

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

 const fetchChecklists = async () => {
  try {
    let fetchedChecklists: Checklist[] = [];

    const fetchedSpecificChecklists: Checklist[] = await database.query.checklists.findMany({
      where: eq(checklists.machineId, machine.id),
      with: {
        items: true,
      }
    }) as Checklist[];

    fetchedChecklists = [...fetchedSpecificChecklists];

    if (machine.machineGroupId) {
      const fetchedGroupChecklists: Checklist[] = await database.query.checklists.findMany({
        where: eq(checklists.machineGroupId, machine.machineGroupId),
        with: {
          items: true,
        }
      }) as Checklist[];

      fetchedGroupChecklists.forEach(groupChecklist => {
        if (!fetchedChecklists.some(checklist => checklist.id === groupChecklist.id)) {
          fetchedChecklists.push(groupChecklist);
        }
      });
    }
    const checklistsWithCompletions = await Promise.all(
      fetchedChecklists.map(async (checklist) => {
        const lastCompletion = await database.query.checklistCompletion.findFirst({
          where: and(eq(checklistCompletionTable.checklistId, checklist.id),eq(checklistCompletionTable.machineId, machine.id)),
          orderBy: [desc(checklistCompletionTable.completionDate)],
        }) as ChecklistCompletion | undefined;

        const lastPerformedDate = checklist.lastPerformedDate ? checklist.lastPerformedDate : (lastCompletion ? new Date(lastCompletion.completionDate) : null);
        const nextPlannedDate = lastPerformedDate ? calculateNextPlannedDate(checklist, lastPerformedDate) : null;

        return {
          ...checklist,
          lastPerformedDate,
          nextPlannedDate,
        };
      })
    );

    setMachineChecklists(checklistsWithCompletions);
  } catch (error) {
    console.error('Error fetching checklists:', error);
    toast({
      title: 'Error fetching checklists',
      description: 'Please try again later.',
      variant: 'destructive',
    });
  }
};

const calculateNextPlannedDate = (checklist: Checklist, lastPerformedDate: Date): Date => {
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


  const handleViewDocument = (document: MachineDocument) => {
    // This function should open the document for viewing
    // You might want to use electron's shell.openPath() to open the file
    window.api.openFile(document.documentPath);
  };


  const handleFormSubmit = async (data: Machine) => {
    try {
      // Check if machineGroupId is provided
      /* if wanted updated machine group and all machine in the group
      if (data.machineGroupId) {
        // Fetch the current machine group data
        const currentMachineGroup = await database.query.machineGroups.findFirst({
          where: eq(machineGroupsTable.id, data.machineGroupId),
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
  
        for (const [key, value] of Object.entries(data)) {
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
            .where(eq(machineGroupsTable.id, data.machineGroupId));
  
          // Update all machines in the group with the machine group changes
          await database.update(machinesTable)
            .set(machineGroupUpdates)
            .where(eq(machinesTable.machineGroupId, data.machineGroupId));
        }
      }
      */
      // Update the individual machine
      await database.update(machinesTable)
        .set(data)
        .where(eq(machinesTable.id, data.id))
        .returning();
  
      const updatedMachineUser = await database.query.users.findFirst({
        where: eq(usersTable.id, data.userId)
      });
  
      // Update the machines state
      fetchMachines();
  
      setAssignedUser(updatedMachineUser as User);
      setIsFormOpen(false);
  
      await fetchSupplier();
      fetchDocuments();
      fetchChecklists();
      onSuppliersUpdated();
  
      toast({
        title: 'Machine and group updated',
        description: 'The machine and its group information have been successfully updated.',
      });
    } catch (error) {
      console.error('Error updating machine and group:', error);
      toast({
        title: 'Error updating machine and group',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };
  
  const renderContent = () => {
    switch (selectedTab) {
      case 'machine-info':
        return (
          <>
            <ScrollArea className="w-full rounded-md border p-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Badge variant="secondary" className="px-2 py-1">
                    <CalendarDays className="mr-1 h-3 w-3" />
                    Last Updated
                  </Badge>
                  <span>{new Date().toLocaleDateString()}</span>
                  <Badge variant="secondary" className="px-2 py-1">
                    <Wrench className="mr-1 h-3 w-3" />
                    Status
                  </Badge>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${machine.status === 'under maintenance' ? 'bg-red-100 text-red-800' :
                    machine.status === 'active' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>{machine.status}</span>

                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium">Description</h4>
                  <p className="text-sm text-muted-foreground">{machine.description}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium">Assigned User</h4>
                  <p className="text-sm text-muted-foreground">{assignedUser ? assignedUser.username : 'Unassigned'}</p>
                </div>
                <Separator />
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{machine.location}</span>
                </div>
                <Separator />
                <div>
                  <h4 className="text-sm font-medium">Supplier</h4>
                  {machine.supplier ? (
                    <ShadTable className="w-full text-left text-sm">
                      <tbody>
                        <TableRow>
                          <TableCell className="font-medium w-1/3">Name:</TableCell>
                          <TableCell className="w-2/3">{machine.supplier.name}</TableCell>
                        </TableRow>
                        {machine.supplier.website && (
                          <TableRow>
                            <TableCell className="font-medium w-1/3">Website:</TableCell>
                            <TableCell className="w-2/3">
                              <a href={machine.supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                                {machine.supplier.website}
                              </a>
                            </TableCell>
                          </TableRow>
                        )}
                        {machine.supplier.email && (
                          <TableRow>
                            <TableCell className="font-medium w-1/3">Email:</TableCell>
                            <TableCell className="w-2/3">{machine.supplier.email}</TableCell>
                          </TableRow>
                        )}
                        {machine.supplier.phoneNumber && (
                          <TableRow>
                            <TableCell className="font-medium w-1/3">Phone:</TableCell>
                            <TableCell className="w-2/3">{machine.supplier.phoneNumber}</TableCell>
                          </TableRow>
                        )}
                      </tbody>
                    </ShadTable>
                  ) : (
                    <p className="text-sm text-muted-foreground">No supplier assigned</p>
                  )}
                </div>
              </div>
            </ScrollArea>
            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Machine
              </Button>
            </div>
          </>


        );
      case 'machine-documents':
        return (
          <>
            <ScrollArea className="h-[300px] w-full rounded-md border p-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Machine Documents</h3>
                <div className='flex justify-end mr-6'>
                  <Button onClick={syncDocuments}>Sync Documents</Button>
                </div>
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>{doc.documentName}</span>
                    </div>
                    <div className='flex justify-end'>
                      <Button className='mr-2' variant="outline" size="sm" onClick={() => handleViewDocument(doc)}>View</Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDocumentDeleted(doc.id)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setIsDocumentManagerOpen(true)}>
                Add Document
              </Button>
            </div>
          </>
        );
      case 'machine-checklists':
        return (
          <ChecklistManager
            machineId={machine.id}
            machineGroupId={machine.machineGroupId}
            checklistsProp={machineChecklists}
            setChecklists={setMachineChecklists}
            fetchChecklists={fetchChecklists}
            machineName={machine.name}
            machineSerial={machine.serialNumber}
            machineSAP={machine.sapNumber}
          />
        );
      case 'machine-special-accessories':
        return (<AccessoryManager machineId={machine.id} machine={machine} />);
      case 'machine-generic-accessories':
        return (<GenericAccessoryManager machineId={machine.id} machine={machine} />);
      case 'machine-spare-parts':
        return (
          <SparePartsManager machineId={machine.id} machine={machine}/>
        )
      default:
        return null;
    }
  };





  return (
    <div>
      <Button
        variant="outline"
        className="mb-4"
        onClick={onBackToMachines}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back to All Machines
      </Button>
      <Card className="w-full mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src='' alt={machine.name} />
              <AvatarFallback>{machine.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl font-bold">{machine.name}</CardTitle>
              <CardDescription>SAP : {machine.sapNumber}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>

        <MachineForm
          users={users}
          isOpen={isFormOpen}
          onOpenChange={setIsFormOpen}
          onSubmit={handleFormSubmit}
          machine={machine}
          suppliers={suppliers}
          onSuppliersUpdated={onSuppliersUpdated}
          setSuppliers={setSuppliers}
        />
        <DocumentManager
          machineId={machine.id}
          machineName={machine.name}
          isOpen={isDocumentManagerOpen}
          onOpenChange={setIsDocumentManagerOpen}
          onDocumentAdded={handleDocumentAdded}
        />
      </Card>
    </div>
  );
};

export default MachineDetails;