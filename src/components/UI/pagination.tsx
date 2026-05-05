'use client';
 
import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
 
export default function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const safeSearchParams = useSearchParams() ?? new URLSearchParams();
  const currentPage = Number(safeSearchParams.get('page')) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(safeSearchParams);
    params.set('page', pageNumber.toString());
    return `${pathname ?? ''}?${params.toString()}`;
  };


  
}