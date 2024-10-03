

export interface UserBase {
  username: string;
  emailAddress: string;
  firstName: string;
  lastName: string;
}

export interface UserCreate extends UserBase {
  password: string;
  admin: boolean;
  ticketPermissions: boolean;
}

export interface User extends UserBase {
  id: number;
  admin: boolean;
  ticketPermissions: boolean;
}

export interface MachineBase {
  name: string;
  location: string;
  description?: string;
  status: string;
}

export interface MachineCreate extends MachineBase {
  lastCalibrationDate: Date | null;
  nextCalibrationDate: Date | null;
  supplierId: any;
  sapNumber: string;
  serialNumber: string;
  userId: number;
}

export interface Machine extends MachineBase {
  id: number;
  sapNumber: string;
  serialNumber: string;
  documents: MachineDocument[];
  userId: number;
  user?: User;
  supplierId?: number; // Optional as it can be null
  supplier?: Supplier;
  hasGenericAccessories: boolean;
  hasSpecialAccessories?: boolean;
  genericAccessories?: GenericAccessory[] | null;
  specialAccessories?: SpecialAccessory[] | null;
  machineGroupId?: number; // New field for the machine group
  machineGroup?: MachineGroup; 
  machineClass?: string | null// Relation to MachineGroup
}

export interface SpecialAccessory {
  id: number;
  machineId: number;
  name: string;
  length?: number | null;
  qualificationDate?: Date | null;
  diameter?: number | null;
  angle?: number | null;
  quantity: number;
  notes?: string | null;
  machineGroupId?: number | null; // New field for the machine group
}

export interface GenericAccessory {
  id: number;
  machineId: number;
  name: string;
  quantity: number;
  notes?: string;
  machineGroupId?: number | null; // New field for the machine group
}
export interface Supplier {
  id: number;
  name: string;
  website?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}

export interface MachineDocument {
  id: number;
  machineId: number;
  documentName: string;
  documentType?: string;
  documentPath: string;
  machineGroupId?: number | null; // New field for the machine group
}


export interface ActionBase {
  name: string;
  frequency: string;
}

export interface ActionCreate extends ActionBase {
  machineId: number;
}

export interface Action extends ActionBase {
  id: number;
  description?: string;
  machineId: Machine;
  lastPerformedDate?: number; // Timestamps represented as numbers
  nextPlannedDate?: number;
}

export interface PreventiveMaintenanceTicketBase {
  title: string;
  description: string;
  status: string;
  scheduledDate: number; // Timestamps represented as numbers
  critical: boolean;
  categoryId?: number;
}

export interface PreventiveMaintenanceTicketCreate extends PreventiveMaintenanceTicketBase {
  machineId: number;
  userId: number;
}

export interface PreventiveMaintenanceTicket extends PreventiveMaintenanceTicketBase {
  id: number;
  machine: Machine;
  user: User;
  completionNotes?: string;
  completedDate?: number;
  createdAt: number;
  updatedAt: number;
  interventionType?: boolean;
  category?: MachineCategory;
}

export interface MachineGroup {
  id: number;
  name: string;
  description?: string | null;
  supplierId?: number | null;
  hasAccessories: boolean;
}


export interface ChecklistItem {
  id: number;
  checklistId: number | null;
  description: string;
  completed: boolean;
}

export interface Checklist {
  id: number;
  machineId: number | null;
  machineGroupId?: number | null; // New field for the machine group
  title: string;
  intervalType: string;
  customIntervalDays: number | null;
  items: ChecklistItem[];
  status: string | null;
  createdAt: Date;
  updatedAt: Date;
  lastPerformedDate: Date | null;
  nextPlannedDate: Date | null;
}

export interface ChecklistCompletion {
  id: number;
  checklistId: number | null;
  machineId: number | null;
  userId: number;
  notes?: string;
  completionDate: Date;
  items: {
    checklistItemId: number;
    completed: boolean;
    description?: string; // Optional field for description
  }[];
}


export interface ChecklistItemCompletion {
  id: number;
  checklistCompletionId: number;
  checklistItemId: number;
  completed: boolean;
}


export interface CategoryBase {
  name: string;
}

export interface CategoryCreate extends CategoryBase {
  machineId: number;
}
export interface MachineCategory extends CategoryBase {
  id: number;
  machineId: number;
}

export interface Category extends CategoryBase {
  id: number;
  machineId: number;
  machine: Machine;
}


export interface SparePartBase {
  name: string;
  partNumber: string;
  supplier?: string | null; // Reference to the supplier
  quantity: number; // Defaults to 1
  reorderLevel: number;
  machineId?: number | null;
  location?: string | null; // Defaults to 1
}

export interface SparePart extends SparePartBase {
  id: number;
}
