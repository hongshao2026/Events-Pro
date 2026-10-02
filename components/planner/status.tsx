import {Check,Star,Minus,X} from 'lucide-react';
import {statusLabels,type Status} from '@/lib/schedule';
export function StatusBadge({status}:{status:Status}){
 const Icon={undecided:Minus,attend:Check,watch:Star,skip:X}[status];
 return <span className="status-badge" data-status={status}><Icon size={12}/>{statusLabels[status]}</span>;
}
