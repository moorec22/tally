import type { ReactNode } from "react"
import Stack from "@mui/material/Stack"
import Typography from "@mui/material/Typography"

export default function ItemAttribute({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <Stack
      spacing={1}
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        minWidth: 0,
        p: 2,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        {icon}
        <Typography color="text.secondary" variant="body2">
          {label}
        </Typography>
      </Stack>
      <Typography sx={{ overflowWrap: "anywhere" }} variant="h6">
        {value}
      </Typography>
    </Stack>
  )
}
