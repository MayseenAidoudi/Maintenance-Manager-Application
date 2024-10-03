import React, { useState, useEffect } from 'react';
import { DataTable } from './DataTable';
import { Button } from "@renderer/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@renderer/components/ui/dialog";
import { database } from '@renderer/db';
import { checklistCompletion } from '../../../main/schema';
import { eq } from 'drizzle-orm';
import { Checkbox } from './ui/checkbox';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Trash } from 'lucide-react'; // Import icons
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@renderer/components/ui/dropdown-menu";

interface ChecklistCompletion {
  id: number;
  checklistId: number | null;
  machineId: number | null;
  userId: number;
  completionDate: Date;
  notes: string | null;
  status?: string | null;
  checklist?: {
    title: string;
    items: { id: number; description: string }[];
  } | null;
  user?: {
    username: string;
  };
  items: {
    checklistItemId: number;
    completed: boolean;
    description?: string;
  }[];
}

interface ChecklistHistoryProps {
  machineId: number;
}

const ChecklistHistory: React.FC<ChecklistHistoryProps> = ({ machineId }) => {
  const [completions, setCompletions] = useState<ChecklistCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCompletion, setSelectedCompletion] = useState<ChecklistCompletion | null>(null);

  useEffect(() => {
    fetchCompletions();
  }, [machineId]);

  const fetchCompletions = async () => {
    setIsLoading(true);
    try {
      const fetchedCompletions = await database.query.checklistCompletion.findMany({
        where: eq(checklistCompletion.machineId, machineId),
        with: {
          checklist: {
            columns: {
              title: true,
            },
            with: {
              items: {
                columns: {
                  id: true,
                  description: true,
                },
              },
            },
          },
          user: {
            columns: {
              username: true,
            },
          },
          items: {
            columns: {
              checklistItemId: true,
              completed: true,
            },
            with: {
              checklistItem: {
                columns: {
                  id: true,
                  description: true,
                },
              },
            },
          },
        },
        orderBy: (completion, { desc }) => [desc(completion.completionDate)],
      });

      const mappedCompletions = fetchedCompletions.map(completion => {
        const allCompleted = completion.items.every(item => item.completed);
        return {
          ...completion,
          status: allCompleted ? 'complete' : 'partial',
          items: completion.items.map(item => ({
            checklistItemId: item.checklistItemId || 0,
            completed: item.completed,
            description: completion.checklist?.items.find(i => i.id === item.checklistItemId)?.description || 'No description',
          })) || [],
        };
      });

      setCompletions(mappedCompletions);
    } catch (error) {
      console.error('Error fetching checklist completions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await database.delete(checklistCompletion).where(eq(checklistCompletion.id, id));
      setCompletions(completions.filter(completion => completion.id !== id));
    } catch (error) {
      console.error('Error deleting checklist completion:', error);
    }
  };

  const ChecklistDetailDialog: React.FC<{ completion: ChecklistCompletion }> = ({ completion }) => (
    <Dialog open={Boolean(selectedCompletion)} onOpenChange={() => setSelectedCompletion(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{completion.checklist?.title}</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <h4 className="font-semibold">Checklist Items:</h4>
          <ul className="list-disc list-inside space-y-2">
            {completion.items.map(item => (
              <li key={item.checklistItemId} className="flex items-center space-x-2">
                <Checkbox 
                  checked={item.completed} 
                  disabled 
                />
                <span>{item.description || 'No description'}</span>
                <span className="text-gray-500">{item.completed ? '' : '(Not completed)'}</span>
              </li>
            ))}
          </ul>
          {completion.notes && (
            <>
              <h4 className="font-semibold mt-4">Notes:</h4>
              <p>{completion.notes}</p>
            </>
          )}
          {completion.status && (
            <>
              <h4 className="font-semibold mt-4">Status:</h4>
              <p>{completion.status}</p>
            </>
          )}
          <p className="mt-4">
            Completed by: {completion.user?.username} on{' '}
            {new Date(completion.completionDate).toLocaleString()}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );

  const columns: ColumnDef<ChecklistCompletion, any>[] = [
    {
      accessorKey: 'checklist.title',
      header: 'Checklist Title',
      cell: ({ row }) => row.original.checklist?.title || 'No title',
    },
    {
      accessorKey: 'completionDate',
      header: 'Completion Date',
      cell: ({ row }) => new Date(row.original.completionDate).toLocaleString(),
    },
    {
      accessorKey: 'user.username',
      header: 'Username',
      cell: ({ row }) => row.original.user?.username || 'Unknown',
    },
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.original.status === 'partial' ? 'bg-red-100 text-red-800' :
          row.original.status === 'complete' ? 'bg-green-100 text-green-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {row.original.status ?? 'Unknown'}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleDelete(row.original.id)}>
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleRowClick = (completion: ChecklistCompletion) => {
    setSelectedCompletion(completion);
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Checklist Completion History</h2>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <DataTable
          columns={columns}
          data={completions}
          onRowClick={handleRowClick}
          actionsColumnId='actions'
        />
      )}
      {selectedCompletion && <ChecklistDetailDialog completion={selectedCompletion} />}
    </div>
  );
};

export default ChecklistHistory;