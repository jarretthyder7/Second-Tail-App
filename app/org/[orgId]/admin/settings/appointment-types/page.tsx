import { Suspense } from "react"
import AppointmentTypesSettings from "./client"

export default function AppointmentTypesSettingsPage() {
  return (
    <Suspense fallback={<div>Loading appointment types...</div>}>
      <AppointmentTypesSettings />
    </Suspense>
  )
}
