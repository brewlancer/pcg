import * as XLSX from 'xlsx';
import { Order, OrderItem, ParsedData } from './types';

// Map key columns (we still need these to organize the data structure)
const KEY_COLUMNS = {
    orderId: ['Order No.', 'Order ID', 'เลขที่คำสั่งซื้อ', 'Order Number'],
    customerName: ['ชื่อลูกค้า', 'Customer Name', 'Customer', 'Name'],
    productName: ['สินค้า', 'Product Name', 'Product', 'รายการสินค้า', 'Item'],
    quantity: ['จำนวนชิ้น', 'Quantity', 'Qty', 'จำนวน'],
    note: ['หมายเหตุ', 'Note', 'Remark', 'Message'],
    paymentStatus: ['การชำระเงิน', 'Payment Status', 'Status', 'สถานะการชำระเงิน'],

    // New specific mappings
    channel: ['ช่องทาง/เพจ', 'Channel'],
    phoneNumber: ['เบอร์โทร', 'Phone', 'Tel'],
    trackingNo: ['TRACKING NO.', 'Tracking'],

    // Address components
    addrHouse: ['ที่อยู่', 'Address'],
    addrSubDistrict: ['ตำบล', 'Sub-district'],
    addrDistrict: ['อำเภอ', 'District'],
    addrProvince: ['จังหวัด', 'Province'],
    addrZip: ['รหัสไปรษณีย์', 'Zipcode', 'Zip'],
};

const findHeader = (row: any[], keys: string[]): number => {
    return row.findIndex((cell) =>
        keys.some(key => String(cell).toLowerCase().trim() === key.toLowerCase())
    );
};

export const parseExcel = async (file: File): Promise<ParsedData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];

                // Get headers first
                const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
                if (jsonData.length < 2) throw new Error('File is empty or invalid format');

                // Find header row
                let headerRowIndex = -1;
                let colIndices: Record<string, number> = {};
                let headerRow: string[] = [];

                for (let i = 0; i < Math.min(5, jsonData.length); i++) {
                    const row = jsonData[i];
                    const orderIdIdx = findHeader(row, KEY_COLUMNS.orderId);
                    if (orderIdIdx !== -1) {
                        headerRowIndex = i;
                        headerRow = row.map(String); // Store authentic header names
                        colIndices = {
                            orderId: orderIdIdx,
                            customerName: findHeader(row, KEY_COLUMNS.customerName),
                            productName: findHeader(row, KEY_COLUMNS.productName),
                            quantity: findHeader(row, KEY_COLUMNS.quantity),
                            note: findHeader(row, KEY_COLUMNS.note),
                            paymentStatus: findHeader(row, KEY_COLUMNS.paymentStatus),

                            channel: findHeader(row, KEY_COLUMNS.channel),
                            phoneNumber: findHeader(row, KEY_COLUMNS.phoneNumber),
                            trackingNo: findHeader(row, KEY_COLUMNS.trackingNo),

                            addrHouse: findHeader(row, KEY_COLUMNS.addrHouse),
                            addrSubDistrict: findHeader(row, KEY_COLUMNS.addrSubDistrict),
                            addrDistrict: findHeader(row, KEY_COLUMNS.addrDistrict),
                            addrProvince: findHeader(row, KEY_COLUMNS.addrProvince),
                            addrZip: findHeader(row, KEY_COLUMNS.addrZip),
                        };
                        break;
                    }
                }

                if (headerRowIndex === -1) {
                    throw new Error('Could not find header row (Order No.).');
                }

                const orders: Order[] = [];
                const summary: Record<string, number> = {};

                // Process rows
                for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0 || !row[colIndices.orderId]) continue;

                    const orderId = String(row[colIndices.orderId]).trim();
                    const customerName = colIndices.customerName !== -1 ? String(row[colIndices.customerName] || '') : '';
                    const rawProduct = colIndices.productName !== -1 ? String(row[colIndices.productName] || '') : '';
                    const rawQty = colIndices.quantity !== -1 ? row[colIndices.quantity] : 1;
                    const note = colIndices.note !== -1 ? String(row[colIndices.note] || '') : '';
                    const status = colIndices.paymentStatus !== -1 ? String(row[colIndices.paymentStatus] || '') : '';

                    const channel = colIndices.channel !== -1 ? String(row[colIndices.channel] || '') : '';
                    const trackingNo = colIndices.trackingNo !== -1 ? String(row[colIndices.trackingNo] || '') : '';
                    const phoneNumber = colIndices.phoneNumber !== -1 ? String(row[colIndices.phoneNumber] || '') : '';

                    // Build Address
                    const addrParts = [
                        colIndices.addrHouse !== -1 ? row[colIndices.addrHouse] : '',
                        colIndices.addrSubDistrict !== -1 ? row[colIndices.addrSubDistrict] : '',
                        colIndices.addrDistrict !== -1 ? row[colIndices.addrDistrict] : '',
                        colIndices.addrProvince !== -1 ? row[colIndices.addrProvince] : '',
                        colIndices.addrZip !== -1 ? row[colIndices.addrZip] : ''
                    ].filter(Boolean).map(String);
                    const address = addrParts.join(' ');

                    // Capture ALL columns into rawDetails
                    const rawDetails: Record<string, any> = {};
                    headerRow.forEach((key, index) => {
                        rawDetails[key] = row[index];
                    });


                    let existingOrder = orders.find(o => o.orderId === orderId);
                    const quantity = isNaN(Number(rawQty)) ? 1 : Number(rawQty);

                    if (!existingOrder) {
                        existingOrder = {
                            orderId,
                            customerName,
                            items: [],
                            note,
                            paymentStatus: status,
                            channel,
                            phoneNumber,
                            address,
                            trackingNo,
                            rawDetails,
                            packed: false,
                            hasWarning: (!!note && note.trim().length > 0) || (status !== 'Paid' && status !== 'ชำระเงินแล้ว')
                        };
                        orders.push(existingOrder);
                    }

                    const newItem: OrderItem = {
                        id: Math.random().toString(36).substr(2, 9),
                        productName: rawProduct,
                        quantity: quantity
                    };

                    existingOrder.items.push(newItem);

                    if (summary[rawProduct]) {
                        summary[rawProduct] += quantity;
                    } else {
                        summary[rawProduct] = quantity;
                    }
                }

                resolve({ orders, summary });

            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = (err) => reject(err);
        reader.readAsBinaryString(file);
    });
};
