import CureLinkProviderHome from '@/components/CureLinkProviderHome';
import CareLogForm from '@/components/CareLogForm';
import ProviderScheduler from '@/components/ProviderScheduler';

export default function Home() {
  return (
    <>
      <CureLinkProviderHome />
      <ProviderScheduler />
      <CareLogForm />
    </>
  );
}
