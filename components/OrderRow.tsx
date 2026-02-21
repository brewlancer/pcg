import React, { useState } from 'react';
import { Order } from '../utils/types';
import { Check, AlertTriangle, ChevronDown, ChevronUp, Truck, User, Info, CheckSquare, Square } from 'lucide-react';
import { clsx } from 'clsx';

interface OrderRowProps {
    order: Order;
    uniqueKey: string;
    onTogglePack: (orderId: string) => void;
    onToggleNoteCheck: (orderId: string) => void;
    index: number;
}

export const OrderRow: React.FC<OrderRowProps> = ({ order, onTogglePack, onToggleNoteCheck, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isPacked = order.packed;
    const isNoteChecked = order.noteChecked;
    const hasSpecialNote = !!order.note;

    // Prevent row click when interacting with action buttons
    const handleRowClick = (e: React.MouseEvent) => {
        // Find if we clicked on an interactive element by looking up the DOM tree
        const target = e.target as HTMLElement;
        if (target.closest('button') || target.closest('input')) {
            return;
        }
        setIsExpanded(!isExpanded);
    };

    return (
        <div
            onClick={handleRowClick}
            className={clsx(
                "group relative bg-white border rounded-2xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col md:flex-row cursor-pointer select-none",
                isPacked
                    ? "border-green-100 shadow-sm opacity-60"
                    : "border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5",
                order.hasWarning && !isPacked && !isNoteChecked && "ring-1 ring-red-400 border-red-100"
            )}
        >
            {/* Selection / Status Indicator Stripe (Left) */}
            <div
                className={clsx(
                    "absolute left-0 top-0 bottom-0 w-1.5 transition-colors",
                    isPacked ? "bg-green-500" : (order.hasWarning && !isNoteChecked ? "bg-red-500" : "bg-blue-500")
                )}
            />

            <div className="flex-grow p-4 pl-6 flex flex-col md:flex-row gap-4 items-start md:items-center">

                {/* Checkbox Action For Packing */}
                <div className="absolute top-4 right-4 md:static md:order-first">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onTogglePack(order.orderId);
                        }}
                        className={clsx(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50",
                            isPacked
                                ? "bg-green-100 text-green-600 focus:ring-green-200"
                                : "bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600 focus:ring-blue-100",
                            hasSpecialNote && !isNoteChecked && !isPacked && "opacity-50 cursor-not-allowed" // Optional visual cue that note should be checked first, though we don't block it strictly.
                        )}
                        title={hasSpecialNote && !isNoteChecked ? "กรุณาเช็คหมายเหตุก่อน" : "แพ็คของ"}
                    >
                        <Check size={24} strokeWidth={isPacked ? 3 : 2} className={clsx("transition-transform", isPacked ? "scale-110" : "scale-100")} />
                    </button>
                </div>

                {/* Main Info (Customer, Items, Tracking) */}
                <div className="flex-grow min-w-0 w-full md:w-5/12 pr-4">
                    {/* Header: Customer & Tags */}
                    <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex-shrink-0">
                            <User size={14} />
                        </span>
                        <h3 className={clsx("text-lg font-bold text-gray-800 truncate", isPacked && "line-through text-gray-500")}>
                            {order.customerName}
                        </h3>
                    </div>

                    <div className="flex items-center gap-2 mb-3 flex-wrap">
                        <span className="text-xs font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                            #{order.orderId}
                        </span>
                        {order.channel && (
                            <span className="text-[10px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                                {order.channel}
                            </span>
                        )}
                        {order.trackingNo && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50/50 rounded-md border border-blue-100">
                                <Truck size={12} className="text-blue-500" />
                                <span className="font-mono text-blue-700 font-medium text-xs truncate max-w-[120px]">{order.trackingNo}</span>
                            </div>
                        )}
                    </div>

                    {/* Items List */}
                    <div className="space-y-2">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 group/item">
                                <div className="flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-700 font-bold text-sm h-7 min-w-[2rem] rounded-md shadow-sm group-hover/item:border-blue-200 group-hover/item:bg-blue-50 transition-colors">
                                    {item.quantity}
                                </div>
                                <div className={clsx("text-sm font-medium leading-tight pt-0.5 truncate", isPacked ? "text-gray-400" : "text-gray-700")}>
                                    {item.productName}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Section: Notes & Actions */}
                <div className="w-full md:w-7/12 flex-shrink-0 mt-3 md:mt-0 flex flex-col md:flex-row items-stretch gap-3 md:pl-4 md:border-l md:border-gray-100">

                    {/* Important Note Area */}
                    {hasSpecialNote ? (
                        <div className={clsx(
                            "flex-1 border rounded-lg p-3 relative transition-all duration-300",
                            isNoteChecked ? "bg-green-50/50 border-green-200 text-green-800" : "bg-amber-50 border-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.2)] text-amber-900"
                        )}>
                            <div className="flex justify-between items-start gap-2 mb-2">
                                <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wide">
                                    <AlertTriangle size={14} className={isNoteChecked ? "text-green-600" : "text-amber-600"} />
                                    <span className={isNoteChecked ? "text-green-700" : "text-amber-800"}>หมายเหตุพิเศษ</span>
                                </div>

                                {/* Acknowledge Note Checkbox */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggleNoteCheck(order.orderId);
                                    }}
                                    className={clsx(
                                        "flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-md transition-all active:scale-95",
                                        isNoteChecked ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300"
                                    )}
                                >
                                    {isNoteChecked ? <CheckSquare size={14} /> : <Square size={14} />}
                                    {isNoteChecked ? 'รับทราบแล้ว' : 'ติ๊กเพื่อรับทราบ'}
                                </button>
                            </div>

                            <p className={clsx("text-sm font-medium leading-snug break-words", isNoteChecked && "opacity-80")}>
                                {order.note}
                            </p>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center border border-dashed border-gray-200 rounded-lg p-3 bg-gray-50/30 text-gray-400">
                            <span className="text-xs font-medium bg-gray-100 px-2 py-1 rounded">ไม่มีหมายเหตุ</span>
                        </div>
                    )}

                </div>
            </div>

            {/* Expand Indicator */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronDown size={14} className="text-gray-300" />
            </div>

            {/* Detailed View (Expanded Context) */}
            {isExpanded && (
                <div onClick={(e) => e.stopPropagation()} className="cursor-auto bg-gray-50/80 border-t border-gray-100 p-4 pl-6 animate-in slide-in-from-top-2 duration-200 shadow-inner">
                    <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-4">
                        <Info size={16} className="text-blue-500" /> ข้อมูลออเดอร์ทั้งหมด
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-4">
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-500 mb-0.5">เบอร์โทรศัพท์</span>
                            <span className="text-gray-800 font-medium">{order.phoneNumber || '-'}</span>
                        </div>
                        <div className="flex flex-col col-span-1 md:col-span-2 lg:col-span-2">
                            <span className="font-semibold text-gray-500 mb-0.5">ที่อยู่</span>
                            <span className="text-gray-800 leading-snug">{order.address || '-'}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="font-semibold text-gray-500 mb-0.5">สถานะการชำระเงิน</span>
                            <span className={clsx("font-medium", order.paymentStatus === 'Paid' || order.paymentStatus === 'ชำระเงินแล้ว' ? 'text-green-600' : 'text-red-600')}>
                                {order.paymentStatus || '-'}
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200/60">
                        <h5 className="font-semibold text-gray-400 text-xs mb-3 uppercase tracking-wider">ข้อมูลดิบ (Raw Details)</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 text-xs">
                            {Object.entries(order.rawDetails || {}).map(([key, value]) => (
                                <div key={key} className="flex flex-col bg-white p-2 rounded border border-gray-100">
                                    <span className="font-semibold text-gray-400 truncate" title={key}>{key}</span>
                                    <span className="text-gray-700 break-words font-medium">{String(value || '-')}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
