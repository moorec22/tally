import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined"

import PageShell from "../components/PageShell"
import StatusPanel from "../components/StatusPanel"

export default function NotFoundPage() {
  return (
    <PageShell>
      <StatusPanel
        icon={<ErrorOutlineOutlinedIcon color="primary" />}
        title="Page not found"
        body="This page is not available in Tally."
      />
    </PageShell>
  )
}
