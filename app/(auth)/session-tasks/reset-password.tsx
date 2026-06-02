import { ONBOARDING_ROUTE } from "@/lib/auth";
import { TaskResetPassword } from "@/lib/clerk";

export default function ResetPasswordTaskScreen() {
  return <TaskResetPassword redirectUrlComplete={ONBOARDING_ROUTE} />;
}
