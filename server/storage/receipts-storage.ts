import { BaseStorage } from "./base-storage";

export class ReceiptsStorage extends BaseStorage {
  receipts = [
    { id: "r-001", receiptNumber: "RCPT-2025-001", receiptDate: "2025-09-01", amount: 1200.0, status: "Pending", receivedBy: "Ali" },
    { id: "r-002", receiptNumber: "RCPT-2025-002", receiptDate: "2025-09-05", amount: 800.0, status: "Complete", receivedBy: "Sara" }
  ];

  async getAllReceipts() {
    return this.receipts;
  }

  async createReceipt(data: any) {
    const newReceipt = {
      id: `r-${Date.now()}`,
      ...data
    };
    this.receipts.push(newReceipt);
    return newReceipt;
  }
}
