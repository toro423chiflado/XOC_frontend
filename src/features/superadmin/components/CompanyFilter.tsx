import { useState, useEffect } from 'react';
import { Building2 } from 'lucide-react';
import { superAdminService } from '../../../services/superadmin.service';
import type { Company } from '../../../types/superadmin';

interface Props {
    onSelect: (companyId: number | undefined) => void;
    currentValue?: number;
}

export default function CompanyFilter({ onSelect, currentValue }: Props) {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                // Load all companies (or a large enough subset for filtering)
                const res = await superAdminService.getCompanies({ limit: 1000 });
                setCompanies(res.companies);
            } catch (err) {
                console.error('Failed to load companies for filter', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <select
                value={currentValue ?? ''}
                onChange={(e) => onSelect(e.target.value ? Number(e.target.value) : undefined)}
                disabled={isLoading}
                className="bg-white/[0.03] border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs text-gray-300 outline-none focus:border-red-500/40 appearance-none min-w-[180px] hover:bg-white/[0.05] transition-colors disabled:opacity-50"
            >
                <option value="">Todas las Empresas</option>
                {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
            </select>
        </div>
    );
}
