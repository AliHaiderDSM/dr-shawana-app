import { ClipboardList } from 'lucide-react-native';
import { EmptyState } from '@/components/feedback/states';
import { Screen } from '@/components/ui/screen';

export default function MedicalHistoryScreen() {
  return (
    <Screen>
      <EmptyState
        icon={ClipboardList}
        title="Medical history"
        message="Your medical history will show here soon."
      />
    </Screen>
  );
}
