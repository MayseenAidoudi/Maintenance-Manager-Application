import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@renderer/components/ui/dialog";
import { Button } from "@renderer/components/ui/button";
import { format } from "date-fns";
import { MachineCategory } from '@renderer/interfaces';

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  scheduledDate: Date;
  machineId: number;
  userId: number | null;
  critical: boolean;
  machine?: { name: string };
  user?: { username: string };
  completionNotes?: string;
  category?: MachineCategory;
}

interface TicketDetailsProps {
  ticket: Ticket;
  onClose: () => void;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({ ticket, onClose }) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>{ticket.title}</DialogTitle>
          <DialogDescription>
            Ticket Details
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Status:</span>
            <span className="col-span-3">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${ticket.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            ticket.status === 'in progress' ? 'bg-blue-100 text-blue-800' :
            ticket.status === 'completed' ? 'bg-green-100 text-green-800' :
            ticket.status === 'completed late' ? 'bg-red-100 text-red-800' :
            ticket.status === 'late' ? 'bg-red-200 text-red-900' :
                    'bg-gray-100 text-gray-800'
            }`}>
            {ticket.status}
          </span>
            </span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Description:</span>
            <span className="col-span-3">{ticket.description}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Scheduled Date:</span>
            <span className="col-span-3">{format(new Date(ticket.scheduledDate), "PPP")}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Machine:</span>
            <span className="col-span-3">{ticket.machine?.name}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Assigned To:</span>
            <span className="col-span-3">{ticket.user?.username}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Fault Category:</span>
            <span className="col-span-3">{String(ticket.category?.name)}</span>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <span className="font-medium">Critical:</span>
            <span className="col-span-3">{String(ticket.critical)}</span>
          </div>
          {ticket.completionNotes && (
            <div className="grid grid-cols-4 items-center gap-4">
              <span className="font-medium">Completion Notes:</span>
              <span className="col-span-3">{ticket.completionNotes}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TicketDetails;