'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { parseExcel } from '../utils/excelParser';
import { Order, OrderList, ParsedData, OrderItem } from '../utils/types';
import { FileUpload } from './FileUpload';
import { OrderRow } from './OrderRow';
import { Printer, RefreshCw, Search, Box, Plus, Trash2, Edit2, FileText, ChevronLeft, ChevronRight, Menu, LogOut, Package, ClipboardList, CheckCircle2, Circle, X, TrendingUp, Clock } from 'lucide-react';
import { logout } from '../app/actions/auth';
import { clsx } from 'clsx';

export default function Dashboard() {
    const [lists, setLists] = useState<OrderList[]>([]);
    const [activeListId, setActiveListId] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'all' | 'manage' | 'packing' | 'packed' | 'shipped'>('manage');
    const [selectedSku, setSelectedSku] = useState<string>('all');
    const [isMounted, setIsMounted] = useState(false);
    const [editingListId, setEditingListId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');

    // For Production print view custom items
    const [customSummaryItems, setCustomSummaryItems] = useState<{ sku: string, count: number, id: string }[]>([]);

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
                orders: list.orders.map((o: Order) => {
                    if (o.orderId !== orderId) return o;

                    let newStatus = o.packingStatus || 'pending';

                    if (newStatus === 'pending') {
                        newStatus = 'ready_to_pack'; // from manage -> wait to pack
                    } else if (newStatus === 'ready_to_pack') {
                        newStatus = 'packed'; // from wait to pack -> packed (wait to ship)
                    } else if (newStatus === 'packed') {
                        newStatus = 'shipped'; // from packed -> shipped
                    } else if (newStatus === 'shipped') {
                        newStatus = 'pending'; // reset cycle (or they can click to undo)
                    }

                    return { ...o, packingStatus: newStatus as Order['packingStatus'] };
                })
            };
        }));
    };

    const handleToggleNoteCheck = (orderId: string) => {
        if (!activeListId) return;
        setLists(prev => prev.map(list => {
            if (list.id !== activeListId) return list;
            return {
                ...list,
                orders: list.orders.map((o: Order) => o.orderId === orderId ? {
                    ...o,
                    noteChecked: !o.noteChecked
                } : o)
            };
        }));
    };

    const handleSaveProductionNote = (orderId: string, note: string) => {
        if (!activeListId) return;
        setLists(prev => prev.map(list => {
            if (list.id !== activeListId) return list;
            return {
                ...list,
                orders: list.orders.map((o: Order) => o.orderId === orderId ? { ...o, productionNote: note } : o)
            };
        }));
    };

    const handleDeleteMenuItem = (skuToDelete: string) => {
        if (!activeListId || !confirm(`ยืนยันการลบเมนู "${skuToDelete}" ใช่หรือไม่? (จะลบออกจากสรุปเท่านั้น)`)) return;
        setLists(prev => prev.map(list => {
            if (list.id !== activeListId) return list;
            const newSummary = { ...list.summary };
            delete newSummary[skuToDelete];
            return {
                ...list,
                summary: newSummary
            };
        }));
    };

    const handleMarkPartial = (orderId: string, missingNote: string) => {
        if (!activeListId) return;
        setLists(prev => prev.map(list => {
            if (list.id !== activeListId) return list;
            return {
                ...list,
                orders: list.orders.map((o: Order) => {
                    if (o.orderId !== orderId) return o;
                    // If it's already partial, clicking it might clear it, or the modal overwrites it
                    const isCurrentlyPartial = o.packingStatus === 'partial';
                    return {
                        ...o,
                        packingStatus: isCurrentlyPartial && !missingNote ? 'pending' : 'partial',
                        missingItemsNote: missingNote,
                        packed: false // ensure not marked fully packed
                    };
                })
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

    // Reset custom items when changing lists
    React.useEffect(() => {
        setCustomSummaryItems([]);
    }, [activeListId]);

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

            const status = order.packingStatus || 'pending'; // 'pending' | 'ready_to_pack' | 'packed' | 'shipped'

            if (activeTab === 'manage') return status === 'pending';
            if (activeTab === 'packing') return status === 'ready_to_pack';
            if (activeTab === 'packed') return status === 'packed';
            if (activeTab === 'shipped') return status === 'shipped';

            return true;
        });
    }, [activeList, searchQuery, activeTab, selectedSku]);

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
                        <div className="flex flex-col gap-4 w-full">
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 pb-md-0 scrollbar-hide">
                                <button
                                    onClick={() => setActiveTab('all')}
                                    className={clsx("px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap", activeTab === 'all' ? "bg-black text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}
                                >
                                    ทั้งหมด
                                </button>
                                <button
                                    onClick={() => setActiveTab('manage')}
                                    className={clsx("px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap", activeTab === 'manage' ? "bg-black text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}
                                >
                                    จัดการออเดอร์
                                </button>
                                <button
                                    onClick={() => setActiveTab('packing')}
                                    className={clsx("px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap", activeTab === 'packing' ? "bg-black text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}
                                >
                                    รอแพ็ค
                                </button>
                                <button
                                    onClick={() => setActiveTab('packed')}
                                    className={clsx("px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap", activeTab === 'packed' ? "bg-black text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}
                                >
                                    รอส่ง
                                </button>
                                <button
                                    onClick={() => setActiveTab('shipped')}
                                    className={clsx("px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap", activeTab === 'shipped' ? "bg-black text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50")}
                                >
                                    ส่งแล้ว
                                </button>
                            </div>

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
                                        {/* Action Buttons specific to tabs can go here later */}
                                    </div>

                                    <button onClick={() => window.print()} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 shadow-sm" title="Print">
                                        <Printer size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </header>

                {/* Content Scroll Area */}
                <div className={clsx(
                    "flex-1 overflow-y-auto p-3 md:p-5 lg:p-6 bg-gray-50 print:bg-white print:p-0 print:overflow-visible",
                    activeTab === 'manage' ? "print:hidden" : "print:block"
                )}>
                    {!activeList ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                            <div className="p-12 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200 text-center">
                                <Plus size={48} className="mx-auto text-gray-300 mb-4" />
                                <h3 className="text-lg font-medium text-gray-800">ยังไม่ได้เลือกรายการ</h3>
                                <p className="text-gray-500 mb-6">เลือกรายการจากแถบด้านซ้าย หรืออัปโหลดไฟล์ใหม่ขึ้นมา</p>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-4xl mx-auto space-y-2.5">
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
                                        onToggleNoteCheck={handleToggleNoteCheck}
                                        onSaveProductionNote={handleSaveProductionNote}
                                        onMarkPartial={handleMarkPartial}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* RIGHT Sidebar (Summary) */}
            {activeList && (
                <aside className={clsx(
                    "bg-white border-l border-gray-200 p-4 sticky top-0 h-screen overflow-y-auto hidden xl:block flex-shrink-0 w-96",
                    activeTab === 'manage' ? "print:block print:w-full print:border-none print:!h-auto print:overflow-visible print:px-8 print:py-0" : "print:hidden"
                )}>
                    <div className="mb-8">
                        {activeTab === 'manage' && (
                            <div className="hidden print:block mb-8 border-b pb-4">
                                <h1 className="text-2xl font-bold">ใบสั่งผลิต: {activeList.name}</h1>
                                <p className="text-gray-500 text-sm">ปริ้นเมื่อ: {new Date().toLocaleString()}</p>
                            </div>
                        )}

                        <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2 mb-4 pb-2 border-b-2 border-zinc-900 print:hidden">
                            <Box size={22} className="text-black" /> สรุปจำนวนสินค้า (SKU)
                        </h3>
                        {/* The PDF/Print trigger for Production Tab */}
                        {activeTab === 'manage' && (
                            <div className="mb-4">
                                <button onClick={() => window.print()} className="w-full bg-black text-white hover:bg-gray-800 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors print:hidden">
                                    <Printer size={18} /> ปริ้นใบผลิต
                                </button>
                                <p className="text-center text-[10px] text-gray-400 mt-2 font-medium print:hidden">เตรียมสรุปใบสั่งผลิตสำหรับฝ่ายผลิต</p>
                            </div>
                        )}

                        <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4 shadow-inner">
                            <ul className="text-sm space-y-3">
                                {Object.entries(activeList.summary).map(([sku, count], idx) => (
                                    <li key={`auto-${sku}-${idx}`} className="flex justify-between items-center group relative">
                                        <button
                                            onClick={() => handleDeleteMenuItem(sku)}
                                            className="absolute -left-6 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                                            title="ลบเมนูนี้"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="flex-1 pr-3">
                                            <input
                                                className="bg-transparent border-b border-transparent hover:border-gray-300 focus:border-black focus:outline-none w-full text-zinc-600 font-bold leading-tight group-hover:text-black transition-colors print:border-none print:text-lg print:text-black"
                                                defaultValue={sku || 'ไม่ระบุ'}
                                                onChange={(e) => {
                                                    // Update logic for SKU renaming if desired, but for now just visual
                                                }}
                                            />
                                        </div>
                                        <div className="min-w-[60px] flex justify-end">
                                            <span className="font-black text-lg text-zinc-900 bg-white border-2 border-zinc-200 px-3 py-1 rounded-xl shadow-sm min-w-[50px] text-center print:border-none print:shadow-none print:text-xl">
                                                {count}
                                            </span>
                                        </div>
                                    </li>
                                ))}

                                {customSummaryItems.map((item, idx) => (
                                    <li key={item.id} className="flex justify-between items-center group relative">
                                        <button
                                            onClick={() => setCustomSummaryItems(prev => prev.filter(p => p.id !== item.id))}
                                            className="absolute -left-6 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity print:hidden"
                                            title="ลบ"
                                        >
                                            <X size={14} />
                                        </button>
                                        <div className="flex-1 pr-3">
                                            <input
                                                className="bg-zinc-100 border-b border-zinc-300 focus:border-black focus:outline-none w-full text-zinc-800 font-bold leading-tight transition-colors rounded-sm px-2 py-1 print:bg-transparent print:border-none print:px-0 print:text-lg print:text-black"
                                                placeholder="ชื่อเมนูพิเศษ..."
                                                value={item.sku}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setCustomSummaryItems(prev => prev.map(p => p.id === item.id ? { ...p, sku: val } : p));
                                                }}
                                            />
                                        </div>
                                        <div className="min-w-[60px] flex justify-end">
                                            <input
                                                className="font-black bg-zinc-100 border-2 border-zinc-300 px-2 py-1 rounded-xl text-zinc-900 w-16 text-center focus:outline-none focus:border-black print:bg-transparent print:border-none print:text-xl"
                                                value={item.count}
                                                onChange={(e) => {
                                                    const val = parseInt(e.target.value) || 0;
                                                    setCustomSummaryItems(prev => prev.map(p => p.id === item.id ? { ...p, count: val } : p));
                                                }}
                                                type="number"
                                            />
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Add Custom Item for Print */}
                            {activeTab === 'manage' && (
                                <button
                                    onClick={() => setCustomSummaryItems(prev => [...prev, { sku: '', count: 1, id: Date.now().toString() }])}
                                    className="mt-4 w-full border border-dashed border-gray-300 rounded-lg py-2 text-xs font-bold text-gray-500 hover:text-black hover:bg-gray-100 transition-colors flex items-center justify-center gap-1 print:hidden"
                                >
                                    <Plus size={14} /> เพิ่มเมนูพิเศษ
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="mb-8">
                        <h2 className="font-bold text-sm text-zinc-400 uppercase tracking-widest mb-4 flex items-center gap-2 print:mt-10 print:pt-6 print:border-t print:border-zinc-100 print:text-black">
                            <ClipboardList size={16} /> ภาพรวมรายการ
                        </h2>

                        <div className="grid grid-cols-2 gap-3 mb-6 print:grid-cols-2 print:gap-8">
                            <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl flex flex-col justify-center print:bg-white print:border-2 print:border-zinc-900">
                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter mb-1 flex items-center gap-1.5 print:text-xs print:text-black"><Box size={12} /> จำนวนออเดอร์</span>
                                <span className="text-2xl font-black text-zinc-900 print:text-4xl">{activeList.orders.length}</span>
                            </div>
                            <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl flex flex-col justify-center print:bg-white print:border-2 print:border-zinc-900">
                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter mb-1 flex items-center gap-1.5 print:text-xs print:text-black"><Package size={12} /> จำนวนชิ้นรวม</span>
                                <span className="text-2xl font-black text-zinc-900 print:text-4xl">{totalUnitsCount}</span>
                            </div>
                            <div className="bg-white border-2 border-zinc-100 p-4 rounded-2xl flex flex-col justify-center shadow-sm print:hidden">
                                <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-tighter mb-1 flex items-center gap-1.5"><TrendingUp size={12} /> ความคืบหน้า</span>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-black transition-all duration-500 ease-out"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className="text-sm font-black text-zinc-900">{Math.round(progress)}%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            )}
        </div>
    );
};
