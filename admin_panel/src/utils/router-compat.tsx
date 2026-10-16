'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useParams as useNextParams } from 'next/navigation';

export { useOutletContext } from '../context/AdminContext';

export function useNavigate() {
  const router = useRouter();
  return (path: string, options?: { replace?: boolean }) => {
    if (options?.replace) {
      router.replace(path);
    } else {
      router.push(path);
    }
  };
}

export function useLocation() {
  const pathname = usePathname();
  return {
    pathname: pathname || '',
    search: '',
    hash: '',
    state: null,
  };
}

export function useParams<T extends Record<string, string | string[]>>() {
  return useNextParams() as T;
}

export function Navigate({ to, replace }: { to: string; replace?: boolean; state?: any }) {
  const router = useRouter();
  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);

  return null;
}

export interface NavLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'children'> {
  to: string;
  className?: string | ((props: { isActive: boolean }) => string);
  children: React.ReactNode | ((props: { isActive: boolean }) => React.ReactNode);
}

export const NavLink: React.FC<NavLinkProps> = ({ to, className, children, ...rest }) => {
  const pathname = usePathname();
  const isActive = Boolean(pathname === to || (to !== '/dashboard' && pathname && pathname.startsWith(to)));

  const resolvedClassName = typeof className === 'function' ? className({ isActive }) : className;
  const resolvedChildren = typeof children === 'function' ? children({ isActive }) : children;

  return (
    <Link href={to} className={resolvedClassName} {...rest}>
      {resolvedChildren}
    </Link>
  );
};
