import type { Metadata } from "next";
import { LogView } from "@/components/log-view";

export const metadata: Metadata = { title: "Log · LeetLog" };

export default function LogPage() {
  return <LogView />;
}
