import { redirect } from "next/navigation";

// The old profile page is replaced by the dashboard.
export default function ProfilePage() {
  redirect("/dashboard");
}
