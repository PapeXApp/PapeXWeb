import { redirect } from "next/navigation"

export default function PosValuePropPage() {
  redirect("/pos-calculator?tab=full")
}
