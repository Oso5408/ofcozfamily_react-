import { common } from './common.js';
import { booking } from './booking.js';
import { dashboard, notifications, admin } from './dashboard.js';
import { pricing } from './pricing.js';
import { email } from './email.js';

export const zh = {
  ...common,
  ...booking,
  dashboard,
  notifications,
  admin,
  ...pricing,
  ...email,
};