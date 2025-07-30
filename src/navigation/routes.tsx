import type { ComponentType, JSX } from 'react';

import { IndexPage } from '@/pages/IndexPage/IndexPage';
import BookingCalendar from '@/pages/Test/BookingCalendar';

interface Route {
  path: string;
  Component: ComponentType;
  title?: string;
  icon?: JSX.Element;
}

export const routes: Route[] = [
  { path: '/', Component: IndexPage },
  { path: '/test', Component: BookingCalendar, title: 'Init Data' },
];
