'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { parseExcel } from '../utils/excelParser';
import { Order, OrderList, ParsedData, OrderItem } from '../utils/types';
import { FileUpload } from './FileUpload';
import { OrderRow } from './OrderRow';
import { Printer, RefreshCw, Search, Box, Plus, Trash2, Edit2, FileText, ChevronLeft, ChevronRight, Menu, LogOut, Package, ClipboardList, CheckCircle2, Circle } from 'lucide-react';
import { logout } from '../app/actions/auth';
import { clsx } from 'clsx';

export default function Dashboard() {
    const [lists, setLists] = useState<OrderList[]>([]);
    const [activeListId, setActiveListId] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterMode, setFilterMode] = useState<'all' | 'packed' | 'unpacked'>('all');
    const [selectedSku, setSelectedSku] = useState<string>('all');
    const [isMounted, setIsMounted] = useState(false);
    const [editingListId, setEditingListId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    // Layout State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        setIsMounted(true);
        const savedLists = localStorage.getItem('pcg_lists');
        if (savedLists) {
            try {
                const parsedLists: OrderList[] = JSON.parse(savedLists);
                setLists(parsedLists);
                if (parsedLists.length > 0) {
                    setActiveListId(parsedLists[0].id);
                }
            } catch (e) {
                console.error("Failed to load persistence", e);
            }
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        if (isMounted) {
            localStorage.setItem('pcg_lists', JSON.stringify(lists));
        }
    }, [lists, isMounted]);

    const handleFileUpload = async (file: File) => {
        try {
            const data: ParsedData = await parseExcel(file);
            const newList: OrderList = {
                id: Math.random().toString(36).substr(2, 9),
                name: file.name.replace(/\.[^/.]+$/, ""), // remove extension
                orders: data.orders,
                summary: data.summary,
                createdAt: Date.now()
            };

            setLists(prev => [...prev, newList]);
            setActiveListId(newList.id);
        } catch (error) {
            alert("Error parsing file: " + (error as Error).message);
        }
    };

    const activeList = useMemo(() => lists.find(l => l.id === activeListId), [lists, activeListId]);

    const handleTogglePack = (orderId: string) => {
        if (!activeListId) return;
        setLists(prev => prev.map(list => {
            if (list.id !== activeListId) return list;
            return {
                ...list,
                orders: list.orders.map((o: Order) => o.orderId === orderId ? { ...o, packed: !o.packed } : o)
            };
        }));
    };

    const handleDeleteList = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Delete this list?')) {
            const newLists = lists.filter(l => l.id !== id);
            setLists(newLists);
            if (activeListId === id) {
                setActiveListId(newLists.length > 0 ? newLists[0].id : null);
            }
        }
    };

    const startEditing = (e: React.MouseEvent, list: OrderList) => {
        e.stopPropagation();
        setEditingListId(list.id);
        setEditName(list.name);
    };

    const saveListName = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingListId) return;
        setLists(prev => prev.map(l => l.id === editingListId ? { ...l, name: editName } : l));
        setEditingListId(null);
    };

    const filteredOrders = useMemo(() => {
        if (!activeList) return [];

        return activeList.orders.filter((order: Order) => {
            // SKU Filter
            if (selectedSku !== 'all') {
                const hasSku = order.items.some((i: OrderItem) => i.productName === selectedSku);
                if (!hasSku) return false;
            }

            // Search logic
            const s = searchQuery.toLowerCase();
            const matchesSearch =
                order.orderId.toLowerCase().includes(s) ||
                order.customerName.toLowerCase().includes(s) ||
                (order.phoneNumber && order.phoneNumber.includes(s)) ||
                order.items.some((i: OrderItem) => i.productName.toLowerCase().includes(s));

            if (!matchesSearch) return false;

            // Filter logic
            if (filterMode === 'packed') return order.packed;
            if (filterMode === 'unpacked') return !order.packed;
            return true;
        });
    }, [activeList, searchQuery, filterMode, selectedSku]);

    const packedCount = activeList ? activeList.orders.filter((o: Order) => o.packed).length : 0;
    const progress = activeList && activeList.orders.length > 0 ? (packedCount / activeList.orders.length) * 100 : 0;

    // Calculate total items (sum of quantity from all summary objects)
    const totalUnitsCount = useMemo(() => {
        if (!activeList) return 0;
        return Object.values(activeList.summary).reduce((sum, count) => sum + count, 0);
    }, [activeList]);

    if (!isMounted) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row print:bg-white print:block">

            {/* LEFT Sidebar (Lists) */}
            <aside
                className={clsx(
                    "bg-white border-r border-gray-200 flex flex-col print:hidden sticky top-0 h-screen transition-all duration-300 ease-in-out",
                    isSidebarCollapsed ? "w-16" : "w-64"
                )}
            >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    {!isSidebarCollapsed && (
                        <h1 className="font-bold text-lg text-gray-800 flex items-center gap-2 truncate">
                            <Box className="text-blue-600" size={20} /> PackList
                        </h1>
                    )}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 mx-auto md:mx-0"
                        title={isSidebarCollapsed ? "Expand" : "Collapse"}
                    >
                        {isSidebarCollapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                    </button>
                </div>

                {/* Lists Navigation */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {!isSidebarCollapsed && <div className="text-xs font-semibold text-gray-400 px-3 py-2 uppercase tracking-wider">รายการของคุณ</div>}

                    {lists.map(list => (
                        <div
                            key={list.id}
                            onClick={() => setActiveListId(list.id)}
                            className={clsx(
                                "group flex items-center px-3 py-2 rounded-lg cursor-pointer transition-colors text-sm",
                                activeListId === list.id ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-50",
                                isSidebarCollapsed ? "justify-center" : "justify-between"
                            )}
                            title={list.name}
                        >
                            <div className={clsx("flex items-center gap-2 truncate", isSidebarCollapsed ? "" : "flex-1")}>
                                <FileText size={20} className={activeListId === list.id ? "text-blue-500" : "text-gray-400"} />
                                {!isSidebarCollapsed && (
                                    editingListId === list.id ? (
                                        <form onSubmit={saveListName} className="flex-1" onClick={e => e.stopPropagation()}>
                                            <input
                                                autoFocus
                                                className="w-full px-1 py-0.5 border rounded text-xs bg-white"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                onBlur={saveListName}
                                            />
                                        </form>
                                    ) : (
                                        <span className="truncate">{list.name}</span>
                                    )
                                )}
                            </div>

                            {!isSidebarCollapsed && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => startEditing(e, list)} className="p-1 hover:bg-white rounded text-gray-400 hover:text-blue-500">
                                        <Edit2 size={12} />
                                    </button>
                                    <button onClick={(e) => handleDeleteList(e, list.id)} className="p-1 hover:bg-white rounded text-gray-400 hover:text-red-500">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Add Button */}
                    <div className="pt-2 border-t border-gray-100 mt-2">
                        <label className={clsx(
                            "flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors text-sm font-medium",
                            isSidebarCollapsed ? "justify-center" : ""
                        )}>
                            <Plus size={20} />
                            {!isSidebarCollapsed && "เพิ่มไฟล์"}
                            <input
                                type="file"
                                className="hidden"
                                accept=".xlsx,.csv,.xls"
                                onChange={e => e.target.files && e.target.files[0] && handleFileUpload(e.target.files[0])}
                            />
                        </label>
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-2 border-t border-gray-200">
                    <form action={logout}>
                        <button className={clsx(
                            "w-full flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors text-sm font-medium",
                            isSidebarCollapsed ? "justify-center" : ""
                        )}>
                            <LogOut size={20} />
                            {!isSidebarCollapsed && "ออกจากระบบ"}
                        </button>
                    </form>
                </div>
            </aside>

            {/* CENTER Main Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden print:h-auto print:overflow-visible min-w-0">

                {/* Top Bar */}
                <header className="bg-white border-b border-gray-200 p-4 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden shrink-0">
                    {activeList && (
                        <div className="flex items-center gap-4 flex-1 justify-between w-full">
                            <div className="relative w-full max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="ค้นหา รหัสออเดอร์, ชื่อลูกค้า..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 border rounded-md text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                {/* SKU Filter Mobile/Desktop */}
                                <select
                                    value={selectedSku}
                                    onChange={(e) => setSelectedSku(e.target.value)}
                                    className="px-2 py-1.5 rounded text-sm border bg-white max-w-[140px]"
                                >
                                    <option value="all">สินค้าทั้งหมด</option>
                                    {activeList && Object.keys(activeList.summary).map(sku => (
                                        <option key={sku} value={sku}>{sku}</option>
                                    ))}
                                </select>

                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => setFilterMode('all')}
                                        className={clsx("px-3 py-1 rounded text-xs font-medium transition-all", filterMode === 'all' ? "bg-white shadow text-blue-600" : "text-gray-500 hover:text-gray-700")}
                                    >
                                        ทั้งหมด
                                    </button>
                                    <button
                                        onClick={() => setFilterMode('unpacked')}
                                        className={clsx("px-3 py-1 rounded text-xs font-medium transition-all", filterMode === 'unpacked' ? "bg-white shadow text-yellow-600" : "text-gray-500 hover:text-gray-700")}
                                    >
                                        รอแพ็ค
                                    </button>
                                </div>

                                <button onClick={() => window.print()} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 shadow-sm" title="Print">
                                    <Printer size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </header>

                {/* Content Scroll Area */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50 print:bg-white print:p-0 print:overflow-visible">
                    {!activeList ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <div className="p-12 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200 text-center">
                                <Plus size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-800">ยังไม่ได้เลือกรายการ</h3>
                                <p className="text-gray-500 mb-6">เลือกรายการจากแถบด้านซ้าย หรืออัปโหลดไฟล์ใหม่ขึ้นมา</p>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-4">
                            {/* List Header for Print */}
                            <div className="hidden print:block mb-8 border-b pb-4">
                                <h1 className="text-2xl font-bold">{activeList.name}</h1>
                                <p className="text-gray-500 text-sm">สร้างเมื่อ: {new Date(activeList.createdAt).toLocaleString()}</p>
                            </div>

                            {filteredOrders.length === 0 ? (
                                <div className="text-center py-20 text-gray-400">ไม่พบออเดอร์ที่ค้นหา</div>
                            ) : (
                                filteredOrders.map((order: Order, i: number) => (
                                    <OrderRow
                                        key={order.orderId + i}
                                        uniqueKey={order.orderId + i}
                                        order={order}
                                        index={i}
                                        onTogglePack={handleTogglePack}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* RIGHT Sidebar (Summary) */}
            {activeList && (
                <aside className="w-80 bg-white border-l border-gray-200 p-4 print:hidden sticky top-0 h-screen overflow-y-auto hidden xl:block flex-shrink-0">

                    <div className="mb-8">
                        <h2 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
                            <ClipboardList className="text-blue-600" size={20} />
                            ภาพรวมรายการ
                        </h2>

                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex flex-col justify-center">
                                <span className="text-xs text-blue-600 font-medium mb-1 flex items-center gap-1.5"><Box size={14} /> ออเดอร์ทั้งหมด</span>
                                <span className="text-2xl font-bold text-blue-900">{activeList.orders.length}</span>
                            </div>
                            <div className="bg-purple-50/50 border border-purple-100 p-3 rounded-xl flex flex-col justify-center">
                                <span className="text-xs text-purple-600 font-medium mb-1 flex items-center gap-1.5"><Package size={14} /> สินค้าทั้งหมด</span>
                                <span className="text-2xl font-bold text-purple-900">{totalUnitsCount}</span>
                            </div>
                            <div className="bg-green-50/50 border border-green-100 p-3 rounded-xl flex flex-col justify-center">
                                <span className="text-xs text-green-600 font-medium mb-1 flex items-center gap-1.5"><CheckCircle2 size={14} /> แพ็คแล้ว</span>
                                <span className="text-2xl font-bold text-green-900">{packedCount}</span>
                            </div>
                            <div className="bg-orange-50/50 border border-orange-100 p-3 rounded-xl flex flex-col justify-center">
                                <span className="text-xs text-orange-600 font-medium mb-1 flex items-center gap-1.5"><Circle size={14} /> รอแพ็ค</span>
                                <span className="text-2xl font-bold text-orange-900">{activeList.orders.length - packedCount}</span>
                            </div>
                        </div>

                        <div className="mb-2 flex justify-between text-sm font-medium text-gray-600">
                            <span>ความคืบหน้า</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="bg-gray-100 rounded-full h-3 overflow-hidden border border-gray-200 mb-2">
                            <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${progress}%` }} />
                        </div>
                    </div>

                    <div>
                        <h3 className="font-bold text-gray-700 flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                            <Box size={18} className="text-blue-500" /> สรุปจำนวนสินค้า (SKU)
                        </h3>
                        <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                            <ul className="text-sm space-y-2.5">
                                {Object.entries(activeList.summary).map(([sku, count]) => (
                                    <li key={sku} className="flex justify-between items-start group">
                                        <span className="text-gray-600 leading-tight flex-1 pr-2 group-hover:text-gray-900 transition-colors">{sku || 'ไม่ระบุ'}</span>
                                        <span className="font-mono font-bold bg-white border border-gray-200 px-2 py-0.5 rounded-md text-gray-800 shadow-sm">{String(count)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </aside>
            )}

        </div>
    );
}
