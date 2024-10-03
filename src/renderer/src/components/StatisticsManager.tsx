"use client";

import React, { useState, useEffect } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, Pie, PieChart, XAxis } from "recharts";
import { TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@renderer/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@renderer/components/ui/chart";
import { Button } from "./ui/button";
import { Machine, PreventiveMaintenanceTicket as Ticket } from '@renderer/interfaces';
import { database } from '@renderer/db';
import { preventiveMaintenanceTickets as preventiveMaintenanceTicketsTable } from '../../../main/schema';
import { toast } from './ui/use-toast';
import { eq } from 'drizzle-orm';

interface StatisticsData {
  equipmentDowntime: { month: string; hours: number }[];
  failureRootCause: { cause: string; count: number; fill: string }[];
  interventionType: { month: string; external: number;internal:number }[];
  interventionCount: { month: string; count: number }[];
}

const chartConfig = {
  downtime: {
    hours: {
      label: "Downtime Hours",
      color: "hsl(var(--chart-1))",
    }
  },
  rootCause: {
  },
  interventionType: {
    external: {
      label: "external",
      color: "hsl(var(--chart-5))",
    },
    internal: {
      label: "internal",
      color: "hsl(var(--chart-1))",
    },
  },
  interventionCount: {
    count:{
      label: "Intervention Count ",
      color: "hsl(var(--chart-5))",
    },
  },
};

interface StatisticsManagerProps {
  machines: Machine[];
}

const StatisticsManager: React.FC<StatisticsManagerProps> = ({ machines }) => {
  const [data, setData] = useState<StatisticsData | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);



function calculateDowntime(createdTimestamp: number, completedTimestamp: number): number {
  let downtimeHours = 0;
  let currentDate = new Date(createdTimestamp);
  const completedDate = new Date(completedTimestamp);
  
  while (currentDate <= completedDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday to Friday
          const startOfDay = new Date(currentDate);
          startOfDay.setHours(7, 30, 0, 0); // 7:30 AM
          const endOfDay = new Date(currentDate);
          endOfDay.setHours(16, 0, 0, 0); // 4:00 PM

          const startTime = currentDate < startOfDay ? startOfDay : currentDate;
          const endTime = (currentDate >= completedDate) ? completedDate : endOfDay;

          if (startTime < endTime) {
              const hoursToAdd = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
              downtimeHours += Math.min(8.5, hoursToAdd);
          }
      }
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(0, 0, 0, 0); // Reset to start of next day
  }
  
  return Math.round(downtimeHours * 100) / 100; // Round to 2 decimal places
}


  
  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      let fetchedTickets;
      if (selectedMachineId === 'all') {
        fetchedTickets = await database.query.preventiveMaintenanceTickets.findMany({
          with: {
            machine: {
              columns: {
                name: true,
              },
            },
            user: {
              columns: {
                username: true,
              },
            },
            category: {
              columns: {
                name: true,
              },
            }
          },
        });
      } else if (selectedMachineId) {
  
      fetchedTickets = await database.query.preventiveMaintenanceTickets.findMany({
        where: eq(preventiveMaintenanceTicketsTable.machineId, Number(selectedMachineId)),
        with: {
          machine: {
            columns: {
              name: true,
            },
          },
          user: {
            columns: {
              username: true,
            },
          },
          category: {
            columns: {
              name: true,
            },
          }
        },
      });
    } else if (!selectedMachineId) {
      console.warn('No machine selected.');
      setTickets([]);
      return;
    }
  
      setTickets(fetchedTickets as unknown as Ticket[]);
  
      const categoryCounts = fetchedTickets.reduce((acc: Record<string, number>, ticket) => {
        const categoryName = ticket.category?.name;
        if (categoryName) {
          acc[categoryName] = (acc[categoryName] || 0) + 1;
        }
        return acc;
      }, {});
  
      // Dynamically create the rootCause configuration
      const dynamicRootCauseConfig = Object.keys(categoryCounts).reduce((acc, category, index) => {
        acc[category] = {
          label: category,
          colors: [
            `hsl(var(--chart-${(index % 6) + 1}))`,
          ],
        };
        return acc;
      }, {} as Record<string, { label: string; colors: string[] }>);
  
      // Assign the dynamicRootCauseConfig to the chartConfig object
      chartConfig.rootCause = dynamicRootCauseConfig;
  
      const failureRootCauseData = Object.keys(categoryCounts).map((category, index) => ({
        cause: category,
        count: categoryCounts[category],
        fill: chartConfig.rootCause[category].colors[0],
      }));
  
      const monthAbbreviations: { [key: number]: string } = {
        0: 'Jan', 1: 'Feb', 2: 'Mar', 3: 'Apr', 4: 'May', 5: 'Jun',
        6: 'Jul', 7: 'Aug', 8: 'Sep', 9: 'Oct', 10: 'Nov', 11: 'Dec'
      };
  
      // Reduce tickets to accumulate month counts
      const monthCounts = fetchedTickets.reduce((acc: Record<string, number>, ticket) => {
        const scheduledDate = new Date(ticket.scheduledDate);
        const month = scheduledDate.getMonth();
        const year = scheduledDate.getFullYear();
        const monthYear = `${monthAbbreviations[month]}/${year}`;
        
        acc[monthYear] = (acc[monthYear] || 0) + 1;
        return acc;
      }, {});
  
      // Convert monthCounts to an array and sort it
      const interventionCountData = Object.keys(monthCounts)
        .map((monthYear) => {
          const [monthStr] = monthYear.split('/');
          const monthIndex = Object.values(monthAbbreviations).indexOf(monthStr);
          return {
            month: monthStr,
            count: monthCounts[monthYear],
            sortKey: monthIndex
          };
        })
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(({ month, count }) => ({
          month,
          count
        }));
  
  
      // Calculate internal vs. external intervention counts
      const monthCountsType: Record<string, { external: number, internal: number }> = {};

      // Aggregate counts by month and intervention type
      fetchedTickets.forEach(ticket => {
        const scheduledDate = new Date(ticket.scheduledDate);
        const month = scheduledDate.getMonth();
        const monthStr = monthAbbreviations[month];
        const isExternal = ticket.interventionType; // Assuming interventionType is boolean
  
        if (!monthCountsType[monthStr]) {
          monthCountsType[monthStr] = { external: 0, internal: 0 };
        }
  
        if (isExternal) {
          monthCountsType[monthStr].external += 1;
        } else {
          monthCountsType[monthStr].internal += 1;
        }
      });
      

      // Convert monthCounts to an array and sort it
      const interventionTypeData = Object.keys(monthCountsType)
        .map((monthStr) => ({
          month: monthStr,
          external: monthCountsType[monthStr].external,
          internal: monthCountsType[monthStr].internal,
        }))
        .sort((a, b) => Object.values(monthAbbreviations).indexOf(a.month) - Object.values(monthAbbreviations).indexOf(b.month)); // Sort by month
  



      const downtimeByMonth: Record<string, number> = {};
      fetchedTickets.forEach(ticket => {
        if (ticket.createdAt && ticket.completedDate) {
          const createdDate = ticket.createdAt;
          const monthYear = `${monthAbbreviations[createdDate.getMonth()]}/${createdDate.getFullYear()}`;
          const downtime = calculateDowntime(ticket.createdAt.getTime(), ticket.completedDate.getTime());
          downtimeByMonth[monthYear] = (downtimeByMonth[monthYear] || 0) + downtime;
        }
      });


      const equipmentDowntimeData = Object.entries(downtimeByMonth)
        .map(([monthYear, hours]) => ({
          month: monthYear.split('/')[0],
          hours: Math.round(hours * 100) / 100, // Round to 2 decimal places
        }))
        .sort((a, b) => Object.values(monthAbbreviations).indexOf(a.month) - Object.values(monthAbbreviations).indexOf(b.month));
      
  
      setData((prevData) => ({
        ...prevData!,
        failureRootCause: failureRootCauseData,
        interventionCount: interventionCountData,
        interventionType: interventionTypeData, 
        equipmentDowntime: equipmentDowntimeData,
        }));
  
      // Call the renderCharts function after fetching tickets
      renderCharts();
  
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast({
        title: 'Error fetching tickets',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  


  const renderCharts = () => {
    if (!data) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Equipment Downtime Card */}
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Equipment Downtime</CardTitle>
            <CardDescription>Showing total downtime hours for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer className="mx-auto aspect-square p-4 bg-white rounded-lg" config={chartConfig.downtime}>
              <BarChart data={data.equipmentDowntime} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <Bar dataKey="hours" fill={chartConfig.downtime.hours.color} radius={[5, 5, 0, 0]} />
                <ChartLegend content={<ChartLegendContent />} />
              </BarChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
          </CardFooter>
        </Card>
        {/* Failure Root Cause Card */}
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Failure Root Cause</CardTitle>
            <CardDescription>Showing root cause distribution for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer className="mx-auto aspect-square p-4 bg-white rounded-lg" config={chartConfig.rootCause}>
              <PieChart>
                <Pie
                  data={data.failureRootCause}
                  dataKey="count"
                  nameKey="cause"
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending up by 3.7% this month <TrendingUp className="h-4 w-4" />
            </div>
          </CardFooter>
        </Card>
        {/* Intervention Type Card */}
        <Card>
    <CardHeader>
      <CardTitle>Intervention Type</CardTitle>
      <CardDescription>
        Showing Intervention Type Counts for the last 6 months
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ChartContainer config={chartConfig.interventionType}>
        <AreaChart
          data={data.interventionType}
          margin={{ left: 12, right: 12 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="month"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) => value.slice(0, 3)} // Display abbreviated month
          />
          <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent indicator="dot" />}
          />
          <Area
            dataKey="external"
            type="natural"
            fill="var(--color-external)"
            fillOpacity={0.4}
            stroke="var(--color-external)"
            stackId="a"
          />
          <Area
            dataKey="internal"
            type="natural"
            fill="var(--color-internal)"
            fillOpacity={0.4}
            stroke="var(--color-internal)"
            stackId="a"
          />
        </AreaChart>
      </ChartContainer>
    </CardContent>
    <CardFooter>

    </CardFooter>
  </Card>
        {/* Intervention Count Card */}
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Intervention Count</CardTitle>
            <CardDescription>Showing intervention count trends for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer className="mx-auto aspect-square p-4 bg-white rounded-lg" config={chartConfig.interventionCount}>
              <LineChart data={data.interventionCount} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) => value.slice(0, 3)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="count" stroke={chartConfig.interventionCount.count.color} />
                <ChartLegend content={<ChartLegendContent />} />
              </LineChart>
            </ChartContainer>
          </CardContent>
          <CardFooter className="flex-col gap-2 text-sm">

          </CardFooter>
        </Card>
      </div>
    );
  };

  useEffect(() => {
    if (selectedMachineId) {
      fetchTickets();
    }
  }, [selectedMachineId]);

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <select
          value={selectedMachineId || ""}
          onChange={(e) => setSelectedMachineId(e.target.value)}
          className="border rounded px-2 py-1"
        >
          <option value="" disabled>Select a Machine</option>
          <option value="all">All Machines</option>
          {machines.map((machine) => (
            <option key={machine.id} value={machine.id}>
              {machine.name}
            </option>
          ))}
        </select>
        <Button onClick={() => renderCharts()} disabled={isLoading || !selectedMachineId}>
          Calculate Charts
        </Button>
      </div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        renderCharts()
      )}
    </div>
  );
};

export default StatisticsManager;

