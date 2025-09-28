"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Image from "next/image";

export type Freelancer = {
  name: string;
  avatar?: string;
  completedGigs: number;
  avgRating: number;
  earnings?: number;
};

interface FreelancerLeaderboardProps {
  data: Freelancer[];
}

function FreelancerLeaderboard({ data }: FreelancerLeaderboardProps) {
  const columns: ColumnDef<Freelancer>[] = [
    {
      id: "rank",
      header: "Rank",
      cell: ({ row }) => {
        const rank = row.index + 1;
        if (rank === 1)
          return <span className="font-bold text-yellow-500">🥇 {rank}</span>;
        if (rank === 2)
          return <span className="font-bold text-gray-400">🥈 {rank}</span>;
        if (rank === 3)
          return <span className="font-bold text-orange-500">🥉 {rank}</span>;
        return <span className="font-medium">{rank}</span>;
      },
    },
    {
      accessorKey: "name",
      header: "Freelancer",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.avatar ? (
            <Image
              src={row.original.avatar}
              alt={row.original.name}
              width={40}
              height={40}
              className="rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
              {row.original.name[0]}
            </div>
          )}
          <span className="font-semibold">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: "completedGigs",
      header: "Completed Gigs",
      cell: ({ getValue }) => (
        <span className="font-medium">{getValue() as number}</span>
      ),
    },
    {
      accessorKey: "avgRating",
      header: "Avg. Rating",
      cell: ({ getValue }) => {
        const rating = getValue() as number;
        return (
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={
                  i < Math.round(rating)
                    ? "text-yellow-500 text-lg"
                    : "text-muted-foreground"
                }
              >
                ★
              </span>
            ))}
            <span className="ml-1 text-sm text-muted-foreground">
              {rating.toFixed(1)}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "earnings",
      header: "Earnings",
      cell: ({ getValue }) =>
        getValue() ? (
          <span className="font-bold text-green-600">
            Rs. {getValue() as number}
          </span>
        ) : (
          "-"
        ),
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto border rounded-lg shadow-md">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-sm font-semibold text-foreground"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-border bg-background">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-muted/30 transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default FreelancerLeaderboard;
