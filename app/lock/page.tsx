import { LockScreen } from "@/features/auth/components/lock-screen";
import { getLockFlowState } from "@/lib/auth/master-password";

export default async function LockPage() {
  const { hasVault } = await getLockFlowState();

  return <LockScreen hasVault={hasVault} />;
}
