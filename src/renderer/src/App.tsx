import React, { useState, useEffect, useCallback } from 'react';
import UserList from './components/UserList';
import LoginForm from './components/LoginForm';
import { useAuth } from './context/AuthContext';
import { Button } from './components/ui/button';
import { BarChart2, CheckSquare, ChevronDown, ChevronLeft, ChevronRight, Cpu, FileText, Hammer, Info, LogOut, RefreshCw, Settings, SquareArrowOutUpRight, Ticket, Users, Wrench } from 'lucide-react';
import { Machine, User, MachineDocument, Supplier,  MachineGroup, SpecialAccessory, GenericAccessory } from './interfaces';
import MachineList from './components/MachineList';
import { useToast } from './components/ui/use-toast';
import { database } from './db';
import { users as usertable, machineDocuments, suppliers, specialAccessories, machineGroups, genericAccessories } from '../../main/schema';
import { eq } from 'drizzle-orm';
import { ModeToggle } from './components/mode-toggle';
import TicketManager from './components/TicketManager';
import MachineDetails from './components/MachineDetails';
import { motion, AnimatePresence } from 'framer-motion';
import SettingsDialog from './components/SettingsDialog';
import logoUrl from './assets/logo.svg';
import ImgUrl from './assets/marquardt.svg';
import StatisticsManager from './components/StatisticsManager';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";

const App: React.FC = () => {
  const { isAuthenticated, username, logout } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingMachines, setIsLoadingMachines] = useState(true);
  const [hasFetchedUsers, setHasFetchedUsers] = useState(false);
  const [hasFetchedMachines, setHasFetchedMachines] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [expandedItems, setExpandedItems] = useState<string[]>(['machines']);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [machineTab, setMachineTab] = useState<string | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<number | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [suppliersState, setSuppliers] = useState<Supplier[]>([]);
  const [executionTime, setExecutionTime] = useState<number>(0);


  const resetAppState = useCallback(() => {
    setUsers([]);
    setMachines([]);
    setIsLoadingUsers(true);
    setIsLoadingMachines(true);
    setHasFetchedUsers(false);
    setHasFetchedMachines(false);
    setActiveTab('users');
    setExpandedItems(['machines']);
    setMachineTab(null);
    setSelectedMachineId(null);
  }, []);

  // Empty dependency array if fetchUsers and fetchMachines don't change


  const openSettings = () => {
    setIsSettingsOpen(true);
  };

  const closeSettings = () => {
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    if (isAuthenticated && !hasFetchedUsers) {
      fetchUsers();
    }
  }, [isAuthenticated, hasFetchedUsers]);

  useEffect(() => {
    if (isAuthenticated && !hasFetchedMachines) {
      fetchMachines();
      fetchSuppliers();
    }
  }, [isAuthenticated, hasFetchedMachines]);

  const fetchSuppliers = async () => {
    try {
      const result = await database.query.suppliers.findMany();
      setSuppliers(result);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      toast({
        title: 'Error fetching suppliers',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };


  useEffect(() => {
  }, [suppliersState]);

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const result = await database.query.users.findMany();
      setUsers(result);
      setHasFetchedUsers(true);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Error fetching users',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchMachines = async () => {
    setIsLoadingMachines(true);
    const startTime = performance.now();
    try {

      const result = await database.query.machines.findMany();
      const formattedMachines: Machine[] = await Promise.all(
        result.map(async (machine) => {
          const machineUser = (await database.query.users.findFirst({ where: eq(usertable.id, machine.userId) })) as User;
          const machineDocs = (await database.query.machineDocuments.findMany({
            where: eq(machineDocuments.machineId, machine.id),
          })) as MachineDocument[];
          const machineGenericAccessories = (await database.query.genericAccessories.findMany({ where: eq(genericAccessories.machineId, machine.id) })) as GenericAccessory[];
          const machineSpecialAccesories = (await database.query.specialAccessories.findMany({ where: eq(specialAccessories.machineId, machine.id) })) as SpecialAccessory[];
          const machineSupplier = (await database.query.suppliers.findFirst({ where: eq(suppliers.id, machine.supplierId ?? null as unknown as number) })) as Supplier;
          const machineGroup = (await database.query.machineGroups.findFirst({ where: eq(machineGroups.id, machine.machineGroupId ?? null as unknown as number) })) as MachineGroup;
          return {
            id: machine.id,
            name: machine.name,
            description: machine.description || "",
            location: machine.location,
            sapNumber: machine.sapNumber,
            serialNumber: machine.serialNumber,
            userId: machine.userId,
            machineGroupId: machine.machineGroupId || undefined,
            machineGroup: machineGroup,
            user: machineUser,
            status: machine.status,
            machineClass: machine.machineClass,
            documents: machineDocs,
            supplierId: machine.supplierId || undefined,
            supplier: machineSupplier || undefined,
            hasGenericAccessories: machine.hasGenericAccessories,
            hasSpecialAccessories: machine.hasSpecialAccessories,
            genericAccessories: machineGenericAccessories,
            specialAccesoires: machineSpecialAccesories,// Make sure this field is included
          };
        })
      );
      setMachines(formattedMachines);
      setHasFetchedMachines(true);
      const endTime = performance.now();
      const time = endTime - startTime;
      setExecutionTime(time);
    } catch (error) {
      toast({
        title: 'Error fetching machines',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingMachines(false);
    }
  };


  const handleLogout = () => {
    logout();
    toast({
      title: 'Logout successful',
      description: 'You have been logged out.',
    });
  };
  const handleMachineSelect = (machine: Machine) => {
    setSelectedMachineId(machine.id);
    setMachineTab('machine-info');
    setActiveTab('machines');
    setExpandedItems(prev => [...new Set([...prev, 'machines', `machine-${machine.id}`])]);
  };

  const handleBackToMachines = () => {
    setSelectedMachineId(null);
    setMachineTab(null);
    setExpandedItems(prev => prev.filter(item => !item.startsWith('machine-')));
  };



  const handleLogin = () => {
    toast({
      title: 'Login successful',
      description: 'You are now logged in.',
    });
  };

  const handleUserUpdated = (updatedUser: User) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user))
    );
  };

  const handleMachineUpdated = (updatedMachine: Machine) => {
    setMachines((prevMachines) =>
      prevMachines.map((machine) => (machine.id === updatedMachine.id ? updatedMachine : machine))
    );
    handleRefresh();
  };

  const handleUserDeleted = (deletedUserId: number) => {
    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== deletedUserId));
  };

  const handleRefresh = () => {
    setHasFetchedUsers(false);
    setHasFetchedMachines(false);
    const startTime = performance.now();
    fetchUsers();
    fetchMachines();
    fetchSuppliers();
    const endTime = performance.now();
    const time = endTime - startTime;
    setExecutionTime(time);
  };





  const toggleExpand = (itemId: string) => {
    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const sidebarItems = [
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'machines', icon: Cpu, label: 'Machines' },
    { id: 'tickets', icon: Ticket, label: 'Tickets' },
    { id: 'statistics', icon: BarChart2, label: 'Statistics' },
  ];

  const handleDatabaseUpdate = useCallback(() => {
    resetAppState();
    fetchUsers();
    fetchMachines();
  }, [resetAppState, fetchUsers, fetchMachines]);

  useEffect(() => {
    window.api.onDatabaseUpdated(handleDatabaseUpdate);

    return () => {
      window.api.onDatabaseUpdated(handleDatabaseUpdate);
    };
  }, [handleDatabaseUpdate]);

  const handleSettingsChanged = () => {
    setHasFetchedUsers(false);
    setHasFetchedMachines(false);
    fetchUsers();
    fetchMachines();
  };

  const handleQuit = () => {
    // Call the electron API to quit the app
    window.api.quitApp();
  };




  const renderSidebarItem = (item: any) => {
    const isExpanded = expandedItems.includes(item.id);
    const selectedMachine = machines.find(m => m.id === selectedMachineId);
    const hasSubItems = item.id === 'machines' && selectedMachineId !== null;

    return (
      <div key={item.id}>
        <Button
          variant={activeTab === item.id ? 'default' : 'ghost'}
          className="w-full justify-start mb-1"
          onClick={() => {
            setActiveTab(item.id);
            if (item.id !== 'machines') {
              setMachineTab(null);  // Reset machineTab when clicking on a non-machine tab
            }
            if (item.id === 'machines' && selectedMachineId === null) {
              setMachineTab(null);
            }
            if (hasSubItems) toggleExpand(item.id);
          }}
        >
          {hasSubItems && (isExpanded ? <ChevronDown className="mr-2 h-4 w-4" /> : <ChevronRight className="mr-2 h-4 w-4" />)}
          <item.icon className="mr-2 h-4 w-4" />
          {item.label}
        </Button>
        {hasSubItems && isExpanded && (
          <div className="ml-4">
            {['info', 'documents', 'checklists','spare-parts'].map((subItem) => (
              <Button
                key={`machine-${subItem}`}
                variant={machineTab === `machine-${subItem}` ? 'default' : 'ghost'}
                className="w-full justify-start mb-1"
                onClick={() => {
                  setMachineTab(`machine-${subItem}`);
                  setActiveTab('machines');
                }}
              >
                {subItem === 'info' && <Info className="mr-2 h-4 w-4" />}
                {subItem === 'documents' && <FileText className="mr-2 h-4 w-4" />}
                {subItem === 'checklists' && <CheckSquare className="mr-2 h-4 w-4" />}
                {subItem === 'spare-parts' && <Hammer className="mr-2 h-4 w-4" />}
                {subItem.charAt(0).toUpperCase() + subItem.slice(1)}
              </Button>
            ))}

            {/* Render the Accessories submenu if the machine has accessories */}
            {selectedMachine?.hasGenericAccessories && (
              <Button
                key="machine-generic-accessories"
                variant={machineTab === 'machine-generic-accessories' ? 'default' : 'ghost'}
                className="w-full justify-start mb-1"
                onClick={() => {
                  setMachineTab('machine-generic-accessories');
                  setActiveTab('machines');
                }}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Accessories
              </Button>
            )}
            {selectedMachine?.hasSpecialAccessories && (
              <Button
                key="machine-special-accessories"
                variant={machineTab === 'machine-special-accessories' ? 'default' : 'ghost'}
                className="w-full justify-start mb-1"
                onClick={() => {
                  setMachineTab('machine-special-accessories');
                  setActiveTab('machines');
                }}
              >
                <Wrench className="mr-2 h-4 w-4" />
                Special Accessories
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const sidebarVariants = {
    expanded: { width: '16rem' },
    collapsed: { width: '4.5rem' },
  };


  return (
    <div className="min-h-screen flex">
      {isAuthenticated ? (
        <>
          <motion.aside
            initial="expanded"
            animate={isSidebarCollapsed ? 'collapsed' : 'expanded'}
            variants={sidebarVariants}
            transition={{ duration: 0.3 }}
            className="bg-gray-100 dark:bg-gray-800 p-4 fixed left-0 top-0 bottom-0 z-10 flex flex-col"
          >
            <div className="flex-grow overflow-y-auto ">
              <div className='flex flex-col items-center py-4'>
                <img
                  src={isSidebarCollapsed ? logoUrl : ImgUrl}
                  alt="Logo"
                  className={isSidebarCollapsed ? "w-auto h-auto " : "w-48 h-auto"}
                /></div>

              <AnimatePresence>
                {!isSidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-2">Welcome, {username}</h2>
                    </div>
                    <nav>
                      {sidebarItems.map(item => renderSidebarItem(item))}
                    </nav>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
            <div>                        <button
              onClick={() => toggleSidebar()}
              className="absolute top-1/2 transform -translate-y-1/2 right-0 w-8 h-8 flex items-center justify-end"
            >
              {isSidebarCollapsed ? <ChevronRight /> : <ChevronLeft />}
            </button></div>
            <div className="mt-auto flex flex-col items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className={`${isSidebarCollapsed ? 'w-12 h-12' : 'w-full'}`}>
                    <MoreVertical className={`h-5 w-5 ${isSidebarCollapsed ? 'm-auto' : 'mr-2'}`} />
                    {!isSidebarCollapsed && <span>More</span>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={openSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <ModeToggle isSidebarCollapsed={false} />
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleQuit}>
                  <SquareArrowOutUpRight className="mr-2 h-4 w-4" />
                  <span>Quit</span>
                </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="outline"
                className={`mt-2 mb-2 ${isSidebarCollapsed ? 'w-12 h-12' : 'w-full'}`}
                onClick={handleRefresh}
                title={isSidebarCollapsed ? "Refresh" : undefined}
              >
                <RefreshCw className={`h-5 w-5 ${isSidebarCollapsed ? 'm-auto' : 'mr-2'}`} />
                {!isSidebarCollapsed && <span>Refresh</span>}
              </Button>
              <span>Execution time : {executionTime.toFixed(2)}</span>
            </div>
          </motion.aside>
          <div className="flex-1 flex flex-col">
            <div
              className={`h-full transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'ml-[4.5rem]' : 'ml-64'
                }`}
            >
              <main className="p-8">
                {activeTab === 'users' && (
                  <UserList
                    users={users}
                    isLoading={isLoadingUsers}
                    onUserUpdated={handleUserUpdated}
                    onUserDeleted={handleUserDeleted}
                    onUserCreated={(user: User) => {
                      setUsers((prevUsers) => [...prevUsers, user]);
                    }}
                  />
                )}
                {activeTab === 'machines' && (
                  <>
                    {selectedMachineId !== null ? (
                      <MachineDetails
                        machine={machines.find(m => m.id === selectedMachineId)!}
                        users={users}
                        machines={machines}
                        suppliers={suppliersState}
                        setMachines={setMachines}
                        activeTab={machineTab || 'machine-info'}
                        onBackToMachines={handleBackToMachines}
                        onSuppliersUpdated={fetchSuppliers}
                        setSuppliers={setSuppliers}
                        fetchMachines={fetchMachines}
                      />
                    ) : (
                      <MachineList
                        users={users}
                        machines={machines}
                        suppliers={suppliersState}
                        isLoading={isLoadingMachines}
                        onMachineUpdated={handleMachineUpdated}
                        onMachineDeleted={(deletedMachineId) => {
                          setMachines((prevMachines) =>
                            prevMachines.filter((machine) => machine.id !== deletedMachineId)
                          );
                        }}
                        onMachineCreated={(machine: Machine) => {
                          setMachines((prevMachines) => [...prevMachines, machine]);
                        }}
                        onMachineSelect={handleMachineSelect}
                        onSuppliersUpdated={fetchSuppliers}
                        fetchMachines={fetchMachines}
                        setSuppliers={setSuppliers}
                      />
                    )}
                  </>
                )}
                {activeTab === 'tickets' && <TicketManager />}
                {activeTab === 'statistics' && <StatisticsManager machines={machines}/>}
              </main>
            </div>
          </div>
          <SettingsDialog isOpen={isSettingsOpen} onClose={closeSettings} onSettingsChanged={handleSettingsChanged} onDatabaseChanged={resetAppState} />
        </>
      ) : (
        <div className="relative w-full flex items-center justify-center">
          <LoginForm onLogin={handleLogin} />
          <SettingsDialog isOpen={isSettingsOpen} onClose={closeSettings} onSettingsChanged={handleSettingsChanged} onDatabaseChanged={resetAppState} />
          <Button
            variant="outline"
            className="mt-2 w-auto h-auto absolute bottom-4 left-4"
            onClick={openSettings}
            title="Settings"
          >
            <Settings className="h-5 w-5 mr-2" />
            Settings
          </Button>
        </div>



      )}
    </div>
  );
};


export default App;