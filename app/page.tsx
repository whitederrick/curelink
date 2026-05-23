import CureLinkProviderHome from '@/components/CureLinkProviderHome';
import CareLogForm from '@/components/CareLogForm';
import WeeklyScheduler from '@/components/WeeklyScheduler';

export default function Home() {
  return (
    <>
      <CureLinkProviderHome />
      <WeeklyScheduler />
      <CareLogForm />
    </>
  );
}
