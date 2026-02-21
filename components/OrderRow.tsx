import React, { useState } from 'react';
import { Order } from '../utils/types';
import { Check, AlertCircle, Phone, MapPin, ListOrdered, X, Edit3, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

interface OrderRowProps {
    order: Order;
    uniqueKey: string;
    onTogglePack: (orderId: string) => void;
    onToggleNoteCheck: (orderId: string) => void;
    index: number;
    onSaveProductionNote: (orderId: string, note: string) => void;
    onMarkPartial: (orderId: string, missingNote: string) => void;
}

export const OrderRow: React.FC<OrderRowProps> = ({ order, onTogglePack, onToggleNoteCheck, index, onSaveProductionNote, onMarkPartial }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [prodNote, setProdNote] = useState(order.productionNote || '');
    const [missingNote, setMissingNote] = useState(order.missingItemsNote || '');
    const [showMissingInput, setShowMissingInput] = useState(false);

    const status = order.packingStatus || 'pending';
    const isPacked = status === 'packed' || status === 'shipped';
    const isNoteChecked = order.noteChecked;
    const hasNote = !!order.note;
    const isPartial = status === 'partial';

    // Sync state if order props change
    React.useEffect(() => {
        setProdNote(order.productionNote || '');
        setMissingNote(order.missingItemsNote || '');
    }, [order.productionNote, order.missingItemsNote]);

    // Prevent row click when interacting with action buttons
    const handleRowClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input') || target.closest('textarea')) return;
        setIsModalOpen(true);
    };

    return (
        <>
            <div
                onClick={handleRowClick}
                className={clsx(
                    "group bg-white border border-gray-200 rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden",
                    status !== 'shipped' && "hover:border-gray-400 hover:shadow-lg hover:-translate-y-0.5"
                )}
            >
                <div className="flex flex-col md:flex-row items-stretch">

                    {/* Status Indicator Bar */}
                    <div className={clsx(
                        "w-full h-1 md:w-1.5 md:h-auto flex-shrink-0 transition-colors",
                        isPacked ? "bg-black" : (isNoteChecked || !hasNote ? "bg-blue-500" : "bg-red-500")
                    )} />

                    <div className="p-4 sm:p-5 flex flex-col md:flex-row gap-5 items-start md:items-center w-full">

                        {/* Checkbox (Minimalist) */}
                        <div className="absolute top-4 right-4 md:static md:flex-shrink-0">
                            <button
                                onClick={(e) => { e.stopPropagation(); if (status !== 'shipped') onTogglePack(order.orderId); }}
                                disabled={status === 'shipped'}
                                className={clsx(
                                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all focus:outline-none",
                                    (status === 'packed' || status === 'shipped') ? "bg-black border-black text-white" : "bg-white border-gray-300 text-transparent hover:border-black hover:text-black hover:shadow-md",
                                    status === 'shipped' && "cursor-default"
                                )}
                                title={status === 'shipped' ? "ส่งเรียบร้อยแล้ว" : (status === 'packed' ? "แพ็คแล้ว (ยกเลิกการแพ็ค)" : "กดเพื่อยืนยันว่าแพ็คแล้ว")}
                            >
                                <Check size={20} strokeWidth={(status === 'packed' || status === 'shipped') ? 3 : 2} className={clsx("transition-transform", (status === 'packed' || status === 'shipped') ? "opacity-100 scale-100" : "opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100")} />
                            </button>
                        </div>

                        {/* Name & Phone */}
                        <div className="flex-grow w-full md:w-3/12 md:pr-4">
                            <h3 className="font-bold text-gray-900 text-lg sm:text-xl tracking-tight leading-tight">
                                {order.customerName}
                            </h3>
                            {order.phoneNumber && (
                                <div className="mt-1.5 flex items-center text-gray-500 font-medium text-sm gap-1.5">
                                    <Phone size={14} />
                                    <span>{order.phoneNumber}</span>
                                </div>
                            )}

                            {/* Badges */}
                            <div className="mt-2 flex flex-col gap-1.5 items-start">
                                {order.productionNote && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-bold">
                                        <Edit3 size={10} /> โน้ตผลิต: {order.productionNote}
                                    </span>
                                )}
                                {isPartial && order.missingItemsNote && (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[10px] font-bold">
                                        <AlertTriangle size={10} /> ของขาด: {order.missingItemsNote}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Items (Menu) */}
                        <div className="flex-grow w-full md:w-3/12">
                            <div className="space-y-1.5">
                                {order.items.map(item => (
                                    <div key={item.id} className="text-sm flex items-start gap-2.5">
                                        <span className={clsx("font-bold min-w-[24px] text-right", isPacked ? "text-gray-400" : "text-gray-900")}>
                                            {item.quantity}x
                                        </span>
                                        <span className={clsx("font-medium leading-snug", isPacked ? "text-gray-400" : "text-gray-700")}>
                                            {item.productName}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Note Box */}
                        <div className="flex-grow w-full md:w-6/12 md:pl-4">
                            {hasNote ? (
                                <div className={clsx(
                                    "p-4 rounded-xl border text-sm transition-colors h-full flex flex-col justify-center",
                                    isNoteChecked ? "bg-zinc-50 border-zinc-200 text-zinc-500" : "bg-red-50 border-red-200 text-red-900"
                                )}>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className={clsx("font-extrabold flex items-center gap-1.5 text-[11px] uppercase tracking-wider", isNoteChecked ? "text-zinc-500" : "text-red-600")}>
                                            <AlertCircle size={14} /> หมายเหตุ
                                        </span>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onToggleNoteCheck(order.orderId); }}
                                            className={clsx(
                                                "text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 rounded-lg transition-all active:scale-95",
                                                isNoteChecked ? "bg-zinc-200 text-zinc-600 hover:bg-zinc-300" : "bg-red-600 text-white shadow-md hover:bg-red-700"
                                            )}
                                        >
                                            {isNoteChecked ? "รับทราบแล้ว" : "ติ๊กเพื่อรับทราบ"}
                                        </button>
                                    </div>
                                    <p className="font-bold leading-relaxed break-words text-base">
                                        {order.note}
                                    </p>
                                </div>
                            ) : (
                                <div className="h-full border border-dashed border-gray-200 rounded-xl p-4 flex items-center justify-center text-gray-400 bg-gray-50/50">
                                    <span className="text-[10px] font-bold uppercase tracking-widest">ไม่มีหมายเหตุ</span>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            {/* Premium Modal */}
            {
                isModalOpen && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200"
                        onClick={(e) => { e.stopPropagation(); setIsModalOpen(false); }}
                    >
                        <div
                            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-zinc-100/50"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-6 sm:p-8 pb-0 flex justify-between items-start">
                                <div>
                                    <h3 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight leading-none">{order.customerName}</h3>
                                    {order.phoneNumber && (
                                        <p className="text-zinc-500 font-semibold mt-3 flex items-center gap-2 bg-zinc-50 inline-flex px-3 py-1.5 rounded-lg border border-zinc-100">
                                            <Phone size={14} /> {order.phoneNumber}
                                        </p>
                                    )}
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2.5 bg-zinc-100 hover:bg-zinc-200 hover:rotate-90 text-zinc-600 rounded-full transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 sm:p-8 space-y-8 overflow-y-auto max-h-[75vh]">

                                {/* Items / Menu */}
                                <div>
                                    <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <ListOrdered size={16} /> รายการสินค้า (เมนู)
                                    </h4>
                                    <div className="space-y-3 bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                                        {order.items.map(item => (
                                            <div key={item.id} className="flex items-center justify-between text-zinc-800 font-semibold">
                                                <span className="text-base">{item.productName}</span>
                                                <span className="font-bold text-zinc-900 bg-white border border-zinc-200 px-3 py-1 rounded-lg shadow-sm">
                                                    x{item.quantity}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Production Note Field */}
                                    <div>
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <Edit3 size={14} /> โน้ตสั่งผลิต
                                        </h4>
                                        <div className="relative">
                                            <input
                                                className={clsx(
                                                    "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 transition-all",
                                                    status === 'shipped' ? "opacity-60 cursor-default" : "placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
                                                )}
                                                placeholder={status === 'shipped' ? "" : "พิมพ์ข้อความให้ฝ่ายผลิต (ถ้ามี)..."}
                                                value={prodNote}
                                                readOnly={status === 'shipped'}
                                                onChange={e => setProdNote(e.target.value)}
                                                onBlur={() => status !== 'shipped' && onSaveProductionNote(order.orderId, prodNote)}
                                            />
                                        </div>
                                    </div>

                                    {/* Missing Items Issue */}
                                    <div>
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <AlertTriangle size={14} /> บันทึกของค้างส่ง / ปัญหา
                                        </h4>
                                        {status !== 'shipped' && !showMissingInput && !isPartial && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setShowMissingInput(true); }}
                                                className="px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm font-medium hover:bg-gray-50 hover:text-black transition-colors flex items-center gap-2"
                                            >
                                                + เพิ่มบันทึกของค้างส่ง
                                            </button>
                                        )}
                                        {status === 'shipped' && !isPartial && (
                                            <p className="text-xs text-gray-400 italic">ไม่มีบันทึกของค้างส่ง</p>
                                        )}
                                        {(showMissingInput || isPartial) && (
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    className={clsx(
                                                        "w-full border rounded-xl px-4 py-3 text-sm font-medium transition-all",
                                                        status === 'shipped' ? "bg-zinc-50 border-zinc-200 text-zinc-500 cursor-default" : "bg-orange-50/50 border-orange-200 text-orange-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                                                    )}
                                                    placeholder="เช่น ขาดพริก 2 กระปุก"
                                                    readOnly={status === 'shipped'}
                                                    autoFocus={!isPartial}
                                                    value={missingNote}
                                                    onChange={e => setMissingNote(e.target.value)}
                                                />
                                                {status !== 'shipped' && (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onMarkPartial(order.orderId, missingNote); setShowMissingInput(false); }}
                                                            className="bg-black hover:bg-gray-800 text-white font-medium px-4 py-2 rounded-lg text-xs transition-colors"
                                                        >
                                                            บันทึกค้างส่ง
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); onMarkPartial(order.orderId, ''); setMissingNote(''); setShowMissingInput(false); }}
                                                            className="px-4 py-2 border border-gray-200 hover:bg-gray-100 text-gray-600 font-medium rounded-lg text-xs transition-colors"
                                                        >
                                                            ยกเลิกสถานะค้างส่ง
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Address (Critical for packing, shouldn't be completely deleted, but minimalist) */}
                                {order.address && (
                                    <div>
                                        <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <MapPin size={16} /> ที่อยู่จัดส่ง
                                        </h4>
                                        <p className="text-zinc-700 font-medium leading-relaxed bg-zinc-50 p-5 rounded-2xl border border-zinc-100">
                                            {order.address}
                                        </p>
                                    </div>
                                )}

                                {/* Note */}
                                {hasNote && (
                                    <div>
                                        <h4 className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <AlertCircle size={14} /> หมายเหตุพิเศษ
                                        </h4>
                                        <div className="p-4 rounded-xl border border-red-200 bg-red-50/50 text-red-900 font-semibold leading-relaxed text-sm">
                                            {order.note}
                                        </div>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                )
            }
        </>
    );
};
