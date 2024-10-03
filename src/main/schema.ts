import { relations } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Define tables
export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  emailAddress: text('email_address').notNull().unique(),
  admin: integer('admin', { mode: 'boolean' }).notNull().default(false),
  ticketPermissions: integer('ticket_permissions', {mode: 'boolean'}).notNull().default(false),
});

export const suppliers = sqliteTable('suppliers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  website: text('website'),
  email: text('email'),
  phoneNumber: text('phone_number'),
});

export const spareParts = sqliteTable('spare_parts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  machineId: integer('machine_id').references(() => machines.id, { onDelete: 'cascade' }), // Reference to the machine
  name: text('name').notNull(), // Name of the spare part
  partNumber: text('part_number').notNull().unique(), // Unique identifier or part number
  quantity: integer('quantity').notNull().default(1), // Quantity of the spare part available
  reorderLevel: integer('reorder_level').notNull().default(1), // Quantity threshold for reorder notification
  location: text('location'), // Location of the spare part storage
  supplier: text('supplier'), // Supplier of the spare part
});


// Define machinegroup table
export const machineGroups = sqliteTable('machine_groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(), // Name of the machine group
  description: text('description'),
  supplierId: integer('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  hasAccessories: integer('has_accessories', { mode: 'boolean' }).notNull().default(false),
  // Add other fields as necessary
});

export const machines = sqliteTable('machines', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  location: text('location').notNull(),
  sapNumber: text('SAP_number').notNull().unique(),
  serialNumber: text('serial_number').notNull().unique(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'set null' }),
  status: text('status').notNull().default('active'),
  supplierId: integer('supplier_id').references(() => suppliers.id, { onDelete: 'set null' }),
  hasGenericAccessories: integer('has_accessories', { mode: 'boolean' }).notNull().default(false),
  hasSpecialAccessories: integer('has_special_accessories', { mode: 'boolean' }).notNull().default(false),
  machineGroupId: integer('machine_group_id').references(() => machineGroups.id, { onDelete: 'set null' }), // New reference
  machineClass: text('machine_class'),
});



export const specialAccessories = sqliteTable('special_accessories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  machineId: integer('machine_id').references(() => machines.id, { onDelete: 'cascade' }),
  machineGroupId: integer('machine_group_id').references(() => machineGroups.id, { onDelete: 'set null' }), // New reference
  qualificationDate: integer('qualification_date', { mode: 'timestamp' }),
  name: text('name').notNull(),
  length: integer('length'),
  diameter: integer('diameter'),
  angle: integer('angle'),
  quantity: integer('quantity').notNull().default(1),
  notes: text('notes'),
});
export const genericAccessories = sqliteTable('generic_accessories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  machineId: integer('machine_id').references(() => machines.id, { onDelete: 'cascade' }),
  machineGroupId: integer('machine_group_id').references(() => machineGroups.id, { onDelete: 'set null' }), // New reference
  name: text('name').notNull(),
  quantity: integer('quantity').notNull().default(1),
  notes: text('notes'),
});

export const machineDocuments = sqliteTable('machine_documents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  machineId: integer('machine_id').references(() => machines.id, { onDelete: 'cascade' }),
  machineGroupId: integer('machine_group_id').references(() => machineGroups.id, { onDelete: 'set null' }), // New reference
  documentName: text('document_name').notNull(),
  documentType: text('document_type'),
  documentPath: text('document_path').notNull(),
});

export const checklists = sqliteTable('checklists', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  machineId: integer('machine_id').references(() => machines.id, { onDelete: 'cascade' }),
  machineGroupId: integer('machine_group_id').references(() => machineGroups.id, { onDelete: 'set null' }), // New reference
  title: text('title').notNull(),
  intervalType: text('interval_type').notNull(),
  customIntervalDays: integer('custom_interval_days'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  lastPerformedDate: integer('last_performed_date', { mode: 'timestamp' }),
  nextPlannedDate: integer('next_planned_date', { mode: 'timestamp' }),
  status: text('status'),
});

export const checklistItems = sqliteTable('checklist_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  checklistId: integer('checklist_id').references(() => checklists.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
});

export const checklistCompletion = sqliteTable('checklist_completion', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  checklistId: integer('checklist_id').references(() => checklists.id, { onDelete: 'set null' }),
  machineId: integer('machine_id').references(() => machines.id, { onDelete: 'set null' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'set null' }),
  completionDate: integer('completion_date', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  notes: text('notes'),
  status: text('status'),
});

export const checklistItemCompletion = sqliteTable('checklist_item_completion', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  checklistCompletionId: integer('checklist_completion_id').references(() => checklistCompletion.id, { onDelete: 'cascade' }),
  checklistItemId: integer('checklist_item_id').references(() => checklistItems.id, { onDelete: 'cascade' }),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
});

export const preventiveMaintenanceTickets = sqliteTable('preventive_maintenance_tickets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  machineId: integer('machine_id').references(() => machines.id, { onDelete: 'set null' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  status: text('status').notNull(),
  completionNotes: text('completion_notes'),
  scheduledDate: integer('scheduled_date', { mode: 'timestamp' }).notNull(),
  completedDate: integer('completed_date', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`CURRENT_TIMESTAMP`),
  critical: integer('critical', { mode: 'boolean' }).notNull().default(false),
  categoryId: integer('category_id').references(() => machineCategories.id, { onDelete: 'set null' }),
  interventionType: integer('intervention_type', {mode: 'boolean'}),
});

export const machineCategories = sqliteTable('machine_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  machineId: integer('machine_id').notNull().references(() => machines.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
});

export const actions = sqliteTable('actions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  machineId: integer('machine_id').references(() => machines.id, { onDelete: 'cascade' }),
  frequency: text('frequency').notNull(),
  lastPerformedDate: integer('last_performed_date', { mode: 'timestamp' }),
  nextPlannedDate: integer('next_planned_date', { mode: 'timestamp' }),
});

export const maintenanceTicketAction = sqliteTable('maintenance_ticket_action', {
  maintenanceTicketId: integer('maintenance_ticket_id').references(() => preventiveMaintenanceTickets.id, { onDelete: 'cascade' }),
  actionId: integer('action_id').references(() => actions.id, { onDelete: 'cascade' }),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  machines: many(machines),
  checklistCompletions: many(checklistCompletion),
}));

export const machineGroupsRelations = relations(machineGroups, ({ many }) => ({
  machines: many(machines),
  specialAccessories: many(specialAccessories),
  genericAccessories: many(genericAccessories),
  documents: many(machineDocuments),
  checklists: many(checklists),
}));

export const machinesRelations = relations(machines, ({ one, many }) => ({
  user: one(users, {
    fields: [machines.userId],
    references: [users.id],
  }),
  preventiveMaintenanceTickets: many(preventiveMaintenanceTickets),
  actions: many(actions),
  machineDocuments: many(machineDocuments),
  checklists: many(checklists),
  checklistCompletions: many(checklistCompletion),
  supplier: one(suppliers, {
    fields: [machines.supplierId],
    references: [suppliers.id],
  }),
  categories: many(machineCategories),
  machineGroup: one(machineGroups, {
    fields: [machines.machineGroupId],
    references: [machineGroups.id],
  }),
  specialAccessories: many(specialAccessories),
  genericAccessories: many(genericAccessories),
}));

export const specialAccessoriesRelations = relations(specialAccessories, ({ one }) => ({
  machine: one(machines, {
    fields: [specialAccessories.machineId],
    references: [machines.id],
  }),
  machineGroup: one(machineGroups, {
    fields: [specialAccessories.machineGroupId],
    references: [machineGroups.id],
  }),
}));

export const genericAccessoriesRelations = relations(genericAccessories, ({ one }) => ({
  machine: one(machines, {
    fields: [genericAccessories.machineId],
    references: [machines.id],
  }),
  machineGroup: one(machineGroups, {
    fields: [genericAccessories.machineGroupId],
    references: [machineGroups.id],
  }),
}));


export const machineDocumentsRelations = relations(machineDocuments, ({ one }) => ({
  machine: one(machines, {
    fields: [machineDocuments.machineId],
    references: [machines.id],
  }),
  machineGroup: one(machineGroups, {
    fields: [machineDocuments.machineGroupId],
    references: [machineGroups.id],
  }),
}));

export const checklistsRelations = relations(checklists, ({ one, many }) => ({
  machine: one(machines, {
    fields: [checklists.machineId],
    references: [machines.id],
  }),
  machineGroup: one(machineGroups, {
    fields: [checklists.machineGroupId],
    references: [machineGroups.id],
  }),
  items: many(checklistItems),
  checklistCompletions: many(checklistCompletion),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  checklist: one(checklists, {
    fields: [checklistItems.checklistId],
    references: [checklists.id],
  }),
}));

export const preventiveMaintenanceTicketsRelations = relations(preventiveMaintenanceTickets, ({ one }) => ({
  machine: one(machines, {
    fields: [preventiveMaintenanceTickets.machineId],
    references: [machines.id],
  }),
  user: one(users, {
    fields: [preventiveMaintenanceTickets.userId],
    references: [users.id],
  }),
  category: one(machineCategories, {
    fields: [preventiveMaintenanceTickets.categoryId],
    references: [machineCategories.id],
  }),
}));

export const maintenanceTicketActionRelations = relations(maintenanceTicketAction, ({ one }) => ({
  maintenanceTicket: one(preventiveMaintenanceTickets, {
    fields: [maintenanceTicketAction.maintenanceTicketId],
    references: [preventiveMaintenanceTickets.id],
  }),
  action: one(actions, {
    fields: [maintenanceTicketAction.actionId],
    references: [actions.id],
  }),
}));


// Add these to the existing relations

export const suppliersRelations = relations(suppliers, ({ many }) => ({
  machines: many(machines),
  machineGroups: many(machineGroups),
}));

export const machineCategoriesRelations = relations(machineCategories, ({ one, many }) => ({
  machine: one(machines, {
    fields: [machineCategories.machineId],
    references: [machines.id],
  }),
  preventiveMaintenanceTickets: many(preventiveMaintenanceTickets),
}));

export const actionsRelations = relations(actions, ({ one, many }) => ({
  machine: one(machines, {
    fields: [actions.machineId],
    references: [machines.id],
  }),
  maintenanceTicketActions: many(maintenanceTicketAction),
}));

export const checklistCompletionRelations = relations(checklistCompletion, ({ one, many }) => ({
  checklist: one(checklists, {
    fields: [checklistCompletion.checklistId],
    references: [checklists.id],
  }),
  machine: one(machines, {
    fields: [checklistCompletion.machineId],
    references: [machines.id],
  }),
  user: one(users, {
    fields: [checklistCompletion.userId],
    references: [users.id],
  }),
  items: many(checklistItemCompletion),
}));

export const checklistItemCompletionRelations = relations(checklistItemCompletion, ({ one }) => ({
  checklistCompletion: one(checklistCompletion, {
    fields: [checklistItemCompletion.checklistCompletionId],
    references: [checklistCompletion.id],
  }),
  checklistItem: one(checklistItems, {
    fields: [checklistItemCompletion.checklistItemId],
    references: [checklistItems.id],
  }),
}));


export const sparePartsRelations = relations(spareParts, ({ one }) => ({
  machine: one(machines, {
    fields: [spareParts.machineId],
    references: [machines.id],
  }),
}));