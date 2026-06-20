import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
    total: number;
    limit: number;
    offset: number;
    onPageChange: (newOffset: number) => void;
}

export default function TablePagination({ total, limit, offset, onPageChange }: Props) {
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.floor(offset / limit) + 1;

    if (total === 0) return null;

    const handlePrev = () => {
        if (currentPage > 1) {
            onPageChange(offset - limit);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(offset + limit);
        }
    };

    return (
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-black/20 text-gray-500">
            <div className="text-[10px] uppercase font-black tracking-widest">
                Mostrando <span className="text-white">{offset + 1}</span> - <span className="text-white">{Math.min(offset + limit, total)}</span> de <span className="text-white">{total}</span> resultados
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={handlePrev}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-1 min-w-[32px] justify-center">
                    <span className="text-xs font-black text-white">{currentPage}</span>
                    <span className="text-[10px] text-gray-700">/</span>
                    <span className="text-xs font-black text-gray-600">{totalPages}</span>
                </div>

                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-white/10 hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
