import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    flexDirection: 'row', 
    backgroundColor: '#ffffff', 
    padding: 15, // Safe padding to prevent overflow
  },
  column: { 
    width: '33.33%', 
    paddingHorizontal: 15, 
    borderRightWidth: 1,
    borderRightColor: '#cbd5e1',
    borderRightStyle: 'dashed'
  },
  lastColumn: { 
    width: '33.33%', 
    paddingLeft: 15, 
    paddingRight: 5 
  },
  headerBox: { 
    alignItems: 'center', 
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 6
  },
  schoolName: { 
    fontSize: 14, 
    fontFamily: 'Helvetica-Bold', 
    textAlign: 'center',
    marginBottom: 2
  },
  address: { 
    fontSize: 8, 
    textAlign: 'center', 
    color: '#475569' 
  },
  receiptTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textDecoration: 'underline',
    marginBottom: 4
  },
  copyTypeBadge: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    backgroundColor: '#f1f5f9',
    paddingVertical: 3,
    marginBottom: 8,
    borderRadius: 2
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 3
  },
  metaLabel: { fontSize: 8, color: '#475569' },
  metaValue: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  studentBox: {
    marginTop: 6,
    padding: 5,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 3,
    marginBottom: 8
  },
  studentText: { fontSize: 9, marginBottom: 2 },
  boldText: { fontFamily: 'Helvetica-Bold' },
  table: { width: '100%' },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 4,
    marginBottom: 4
  },
  colDesc: { flex: 1, fontSize: 8, fontFamily: 'Helvetica-Bold' },
  colAmt: { width: 60, fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0'
  },
  itemDesc: { flex: 1, fontSize: 8 },
  itemAmt: { width: 60, fontSize: 8, textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#000'
  },
  totalLabel: { flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'right', paddingRight: 10 },
  totalValue: { width: 60, fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'right' },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40 // Adjusted so it doesn't push past the page limit
  },
  signLine: { width: '40%', alignItems: 'center' },
  line: { width: '100%', borderTopWidth: 1, borderTopColor: '#000', marginBottom: 2 },
  signText: { fontSize: 7, color: '#475569' }
});

const DISPLAY_FEE_ORDER = [
  "Tuition fee", "Admission fee", "Re-admission fee", 
  "Exam fee", "Computer fee", "Sports fee", "TC fee", "Misc"
];

const safeString = (val) => (val !== null && val !== undefined ? String(val) : "N/A");

export default function InvoiceTemplate({ data, schoolConfig }) {
  const copyTypes = ["Student Copy", "School Copy", "Bank Copy"];
  
  // Safe formatting 
  const rawDate = data?.invoiceDate || new Date().toISOString().split("T")[0];
  const paidMonths = Array.isArray(data?.selectedMonths) ? data.selectedMonths.join(", ") : "N/A";

  const renderColumn = (copyType, isLast) => (
    <View style={isLast ? styles.lastColumn : styles.column} wrap={false}>
      
      {/* Header */}
      <View style={styles.headerBox}>
        <Text style={styles.schoolName}>{safeString(schoolConfig?.schoolName || "Western School & College")}</Text>
        <Text style={styles.address}>Didar Market, Dewan Bazar, Chattogram</Text>
      </View>

      <Text style={styles.receiptTitle}>FEE RECEIPT</Text>
      <Text style={styles.copyTypeBadge}>{copyType}</Text>

      {/* Meta Info */}
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Invoice No:</Text>
        <Text style={styles.metaValue}>{safeString(data?.invoiceNo)}</Text>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Date:</Text>
        <Text style={styles.metaValue}>{rawDate}</Text>
      </View>

      {/* Student Info */}
      <View style={styles.studentBox}>
        <Text style={styles.studentText}><Text style={styles.boldText}>Name:</Text> {safeString(data?.studentName)}</Text>
        <Text style={styles.studentText}><Text style={styles.boldText}>ID:</Text> {safeString(data?.studentId)}</Text>
        <Text style={styles.studentText}><Text style={styles.boldText}>Class:</Text> {safeString(data?.class)} | <Text style={styles.boldText}>Roll:</Text> {safeString(data?.roll)}</Text>
        <Text style={styles.studentText}><Text style={styles.boldText}>Months:</Text> {paidMonths}</Text>
      </View>

      {/* Table */}
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Fee Description</Text>
          <Text style={styles.colAmt}>Amount (TK)</Text>
        </View>

        {DISPLAY_FEE_ORDER.map((feeName, idx) => {
          const rawAmount = data?.feeDetails?.[feeName] || 0;
          if (Number(rawAmount) <= 0) return null; // Only show fees that have amounts
          
          return (
            <View style={styles.tableRow} key={idx}>
              <Text style={styles.itemDesc}>{feeName}</Text>
              <Text style={styles.itemAmt}>{Number(rawAmount).toFixed(2)}</Text>
            </View>
          );
        })}

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Grand Total:</Text>
          <Text style={styles.totalValue}>{Number(data?.grandTotal || 0).toFixed(2)}</Text>
        </View>
      </View>

      {/* Footer Info */}
      <View style={{ marginTop: 10 }}>
        <Text style={{ fontSize: 8, color: '#475569' }}>Payment Method: <Text style={styles.boldText}>{safeString(data?.paymentMethod)}</Text></Text>
      </View>

      {/* Signatures */}
      <View style={styles.signatures}>
        <View style={styles.signLine}>
          <View style={styles.line}></View>
          <Text style={styles.signText}>Cashier Signature</Text>
        </View>
        <View style={styles.signLine}>
          <View style={styles.line}></View>
          <Text style={styles.signText}>Student/Guardian</Text>
        </View>
      </View>

    </View>
  );

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        {copyTypes.map((copy, index) => (
          <React.Fragment key={copy}>
            {renderColumn(copy, index === 2)}
          </React.Fragment>
        ))}
      </Page>
    </Document>
  );
}