import type { ReactNode } from "react"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

export default function SectionLabel({
  children,
  icon,
}: {
  children: ReactNode
  icon: ReactNode
}) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
      {icon}
      <Typography color="primary" sx={{ fontWeight: 700 }} variant="overline">
        {children}
      </Typography>
    </Stack>
  )
}
