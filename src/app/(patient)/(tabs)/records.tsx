import { FileText } from 'lucide-react-native';
import { EmptyState } from '@/components/feedback/states';
import { Screen } from '@/components/ui/screen';

export default function MedicalRecordsTab() {
  return (
    <Screen>
      <EmptyState
        icon={FileText}
        title="Medical records"
        message="Your medical records will show here soon."
      />
    </Screen>
  );
}
