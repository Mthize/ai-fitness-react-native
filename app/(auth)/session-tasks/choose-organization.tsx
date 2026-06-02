import { ONBOARDING_ROUTE } from "@/lib/auth";
import { TaskChooseOrganization } from "@/lib/clerk";

export default function ChooseOrganizationTaskScreen() {
  return <TaskChooseOrganization redirectUrlComplete={ONBOARDING_ROUTE} />;
}
