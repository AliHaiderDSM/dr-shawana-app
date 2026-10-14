import {
  CalendarCheck,
  CheckCircle2,
  CircleDot,
  Clock,
  Loader,
  Search,
  XCircle,
  type LucideIcon,
} from 'lucide-react-native';
import type { BadgeTone } from '@/components/ui/status-badge';
import { type Appointment } from '@/redux/features/appointments';
import { type RequestCategory, type RequestStatus } from '@/redux/features/management-requests';

interface StatusLook {
  label: string;
  tone: BadgeTone;
  icon: LucideIcon;
}

export function appointmentStatus(a: Pick<Appointment, 'status' | 'upcoming'>): StatusLook {
  if (a.status === 'cancelled') return { label: 'Cancelled', tone: 'danger', icon: XCircle };
  if (a.status === 'completed') return { label: 'Completed', tone: 'success', icon: CheckCircle2 };
  if (a.upcoming) return { label: 'Scheduled', tone: 'primary', icon: CalendarCheck };
  return { label: 'Booked', tone: 'neutral', icon: Clock };
}

export const REQUEST_STATUS: Record<RequestStatus, StatusLook> = {
  submitted: { label: 'Submitted', tone: 'warning', icon: CircleDot },
  in_review: { label: 'In review', tone: 'info', icon: Search },
  in_progress: { label: 'In progress', tone: 'primary', icon: Loader },
  resolved: { label: 'Resolved', tone: 'success', icon: CheckCircle2 },
  closed: { label: 'Closed', tone: 'neutral', icon: XCircle },
};

export const REQUEST_CATEGORY_LABELS: Record<RequestCategory, string> = {
  appointment: 'Appointment',
  prescription: 'Prescription',
  medicine_order: 'Medicine or order',
  billing: 'Billing or payment',
  profile_correction: 'Correct my details',
  general: 'General question',
  other: 'Other',
};

export const MODE_LABELS = { online: 'Online consultation', physical: 'Clinic visit' } as const;
export const VISIT_LABELS = { new: 'First visit', followup: 'Follow-up' } as const;

export const PRESCRIPTION_CATEGORY_LABELS: Record<string, string> = {
  lab: 'Lab tests',
  imaging: 'Imaging',
  genetic: 'Genetic tests',
  supplement: 'Supplements',
  medicine: 'Medicines',
  glp: 'GLP',
  skin_care: 'Skin care',
  hair_care: 'Hair care',
  bhrt: 'BHRT',
  symptom: 'Symptom care',
};
