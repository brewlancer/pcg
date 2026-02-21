import React, { useState } from 'react';
import { Order } from '../utils/types';
import { Check, AlertTriangle, ChevronDown, ChevronUp, MapPin, Phone, Truck, Package, User } from 'lucide-react';
import { clsx } from 'clsx';

interface OrderRowProps {
    order: Order;
    uniqueKey: string;
    onTogglePack: (orderId: string) => void;
    index: number;
}

export const OrderRow: React.FC<OrderRowProps> = ({ order, onTogglePack, index }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isPacked = order.packed;

    return (
        <div
            className={clsx(
                "group relative bg-white border rounded-2xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col md:flex-row",
                isPacked
                    ? "border-green-100 shadow-sm opacity-60"
                    : "border-gray-100 shadow-sm hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5",
                order.hasWarning && !isPacked && "ring-1 ring-red-400 border-red-100"
            )}
        >
            {/* Selection / Status Indicator Stripe (Left) */}
            <div
                className={clsx(
                    "absolute left-0 top-0 bottom-0 w-1.5 transition-colors",
                    isPacked ? "bg-green-500" : (order.hasWarning ? "bg-red-500" : "bg-blue-500")
                )}
            />

            <div className="flex-grow p-4 pl-6 flex flex-col md:flex-row gap-4 items-start md:items-center">

                {/* Checkbox Action (Mobile: Top Right, Desktop: Left) */}
                <div className="absolute top-4 right-4 md:static md:order-first">
                    <button
                        onClick={() => onTogglePack(order.orderId)}
                        className={clsx(
                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50",
                            isPacked
                                ? "bg-green-100 text-green-600 focus:ring-green-200"
                                : "bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600 focus:ring-blue-100"
                        )}
                    >
                        <Check size={24} strokeWidth={isPacked ? 3 : 2} className={clsx("transition-transform", isPacked ? "scale-110" : "scale-100")} />
                    </button>
                </div>

                {/* Main Info */}
                <div className="flex-grow min-w-0 w-full">
                    {/* Header: Customer & Tags */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-50 text-blue-600">
                            <User size={14} />
                        </span>
                        <h3 className={clsx("text-lg font-bold text-gray-800 truncate max-w-[200px] md:max-w-xs", isPacked && "line-through text-gray-500")}>
                            {order.customerName}
                        </h3>
                        <span className="text-xs font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                            #{order.orderId}
                        </span>
                        {order.channel && (
                            <span className="text-[10px] font-bold tracking-wider uppercase bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                                {order.channel}
                            </span>
                        )}
                    </div>

                    {/* Items List */}
                    <div className="space-y-2 mb-3">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 group/item">
                                <div className="flex items-center justify-center bg-gray-50 border border-gray-200 text-gray-700 font-bold text-sm h-7 min-w-[2rem] rounded-md shadow-sm group-hover/item:border-blue-200 group-hover/item:bg-blue-50 transition-colors">
                                    {item.quantity}
                                </div>
                                <div className={clsx("text-sm font-medium leading-tight pt-0.5", isPacked ? "text-gray-400" : "text-gray-700")}>
                                    {item.productName}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Footer: Metadata details */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        {order.phoneNumber && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md">
                                <Phone size={12} className="text-gray-400" />
                                <span>{order.phoneNumber}</span>
                            </div>
                        )}
                        {order.trackingNo && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md">
                                <Truck size={12} className="text-blue-400" />
                                <span className="font-mono text-gray-600">{order.trackingNo}</span>
                            </div>
                        )}
                        {order.address && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-md max-w-[250px] truncate" title={order.address}>
                                <MapPin size={12} className="text-gray-400 flex-shrink-0" />
                                <span className="truncate">{order.address}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Section: Notes & Alerts */}
                {(order.note || (order.paymentStatus && order.paymentStatus !== 'Paid' && order.paymentStatus !== 'ชำระเงินแล้ว')) && (
                    <div className="w-full md:w-64 flex-shrink-0 mt-3 md:mt-0 md:border-l md:border-gray-100 md:pl-4 flex flex-col gap-2">
                        {order.note && (
                            <div className="bg-amber-50 border border-amber-200/60 rounded-lg p-3 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-1 opacity-10">
                                    <AlertTriangle size={48} className="text-amber-900" />
                                </div>
                                <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs uppercase tracking-wide mb-1">
                                    <AlertTriangle size={12} /> Note
                                </div>
                                <p className="text-amber-900 text-sm font-medium leading-snug relative z-10 break-words">
                                    {order.note}
                                </p>
                            </div>
                        )}

                        {order.paymentStatus && order.paymentStatus !== 'Paid' && order.paymentStatus !== 'ชำระเงินแล้ว' && (
                            <div className="text-center bg-red-50 text-red-600 text-xs font-bold py-1.5 px-3 rounded-lg border border-red-100">
                                {order.paymentStatus}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Expand Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={clsx(
                    "absolute bottom-2 right-2 p-1.5 rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors",
                    isExpanded && "bg-gray-100 text-gray-600"
                )}
            >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {/* Detailed View */}
            {isExpanded && (
                <div className="bg-gray-50/50 border-t border-gray-100 p-4 pl-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs animate-in slide-in-from-top-2 duration-200">
                    {Object.entries(order.rawDetails || {}).map(([key, value]) => (
                        <div key={key} className="flex flex-col group">
                            <span className="font-semibold text-gray-400 mb-0.5 group-hover:text-blue-500 transition-colors">{key}</span>
                            <span className="text-gray-700 break-words">{String(value || '-')}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
