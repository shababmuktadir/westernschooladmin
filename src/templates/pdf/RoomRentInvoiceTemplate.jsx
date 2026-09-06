import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: "#ffffff" },
  header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 2, borderBottomColor: "#1e293b", paddingBottom: 15, marginBottom: 30 },
  companyInfo: { width: "60%" },
  schoolName: { fontSize: 24, fontWeight: "extrabold", color: "#0f172a", marginBottom: 4 },
  address: { fontSize: 10, color: "#64748b" },
  invoiceBox: { width: "35%", textAlign: "right" },
  invoiceTitle: { fontSize: 20, fontWeight: "bold", color: "#4f46e5", textTransform: "uppercase", marginBottom: 4 },
  invoiceText: { fontSize: 10, color: "#475569", marginBottom: 2 },
  
  billToBox: { backgroundColor: "#f8fafc", padding: 15, borderRadius: 6, marginBottom: 30, borderWidth: 1, borderColor: "#e2e8f0" },
  billToTitle: { fontSize: 12, fontWeight: "bold", color: "#94a3b8", marginBottom: 8, textTransform: "uppercase" },
  renterName: { fontSize: 16, fontWeight: "bold", color: "#0f172a", marginBottom: 4 },
  renterDetails: { fontSize: 11, color: "#334155", marginBottom: 2 },
  
  table: { width: "100%", borderWidth: 1, borderColor: "#cbd5e1", borderRadius: 4, overflow: "hidden" },
  tableHeader: { flexDirection: "row", backgroundColor: "#f1f5f9", borderBottomWidth: 1, borderColor: "#cbd5e1", padding: 8 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e2e8f0", padding: 8 },
  col1: { width: "70%", fontSize: 11, color: "#0f172a" },
  col2: { width: "30%", fontSize: 11, color: "#0f172a", textAlign: "right" },
  colHeader: { fontWeight: "bold", color: "#475569" },
  
  totalBox: { flexDirection: "row", justifyContent: "flex-end", marginTop: 15 },
  totalInner: { width: "50%", padding: 10, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontSize: 12, fontWeight: "bold", color: "#334155" },
  totalValue: { fontSize: 14, fontWeight: "extrabold", color: "#0f172a" },
  
  footer: { position: "absolute", bottom: 40, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  signBox: { width: 150, borderTopWidth: 1, borderTopColor: "#94a3b8", textAlign: "center", paddingTop: 5 },
  signText: { fontSize: 10, color: "#64748b" },
  thankYou: { fontSize: 10, color: "#94a3b8", fontStyle: "italic" }
});

export default function RoomRentInvoiceTemplate({ invoiceData }) {
  if (!invoiceData) return null;
  const { receiptNo, date, renterName, roomNo, phone, months, totalAmount } = invoiceData;
  const formattedDate = date ? new Date(date).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
  const monthsString = Array.isArray(months) ? months.join(", ") : months;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.companyInfo}>
            <Text style={styles.schoolName}>Western School & College</Text>
            <Text style={styles.address}>Main Campus, Chattogram, Bangladesh</Text>
            <Text style={styles.address}>Phone: +880 1XXX XXXXXX</Text>
          </View>
          <View style={styles.invoiceBox}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceText}>Receipt No: #{receiptNo}</Text>
            <Text style={styles.invoiceText}>Date: {formattedDate}</Text>
          </View>
        </View>

        <View style={styles.billToBox}>
          <Text style={styles.billToTitle}>Billed To (Room Renter)</Text>
          <Text style={styles.renterName}>{renterName || "N/A"}</Text>
          <Text style={styles.renterDetails}>Room Number: {roomNo || "N/A"}</Text>
          <Text style={styles.renterDetails}>Phone: {phone || "N/A"}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.colHeader]}>Description (Months Paid)</Text>
            <Text style={[styles.col2, styles.colHeader]}>Amount (BDT)</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>Room Rent for: {monthsString}</Text>
            <Text style={styles.col2}>Tk {Number(totalAmount).toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.totalBox}>
          <View style={styles.totalInner}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Paid:</Text>
              <Text style={styles.totalValue}>Tk {Number(totalAmount).toLocaleString()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.thankYou}>Thank you for your payment!</Text>
          <View style={styles.signBox}>
            <Text style={styles.signText}>Authorized Signature</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}