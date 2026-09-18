import Badge from './ui/Badge'
import { STATUS_STYLES } from '../lib/constants'
import { humanizeStatus } from '../lib/format'

/** Order-status pill that colors itself from the shared STATUS_STYLES map. */
export default function StatusBadge({ status }) {
  if (!status) return null
  return (
    <Badge className={STATUS_STYLES[status] || 'bg-slate-100 text-slate-700'}>
      {humanizeStatus(status)}
    </Badge>
  )
}
