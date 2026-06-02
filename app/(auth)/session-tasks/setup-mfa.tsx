import { ONBOARDING_ROUTE } from "@/lib/auth";
import { TaskSetupMFA } from "@/lib/clerk";

export default function SetupMfaTaskScreen() {
  return <TaskSetupMFA redirectUrlComplete={ONBOARDING_ROUTE} />;
}
