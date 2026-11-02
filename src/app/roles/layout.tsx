import type { ChildrenType } from '@core/types'
import CrmShell from '@/components/CrmShell'

// R56: shared CRM shell (sidebar, header, footer).
const Layout = ({ children }: ChildrenType) => <CrmShell>{children}</CrmShell>

export default Layout
