import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

Font.register({
  family: 'Anton',
  src: '/Anton-Regular.ttf',
});

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff' },
  header: { textAlign: 'center', marginBottom: 25, borderBottomWidth: 2, borderBottomColor: '#1e293b', paddingBottom: 15 },
  logoBox: { width: 60, height: 60, alignSelf: 'center', marginBottom: 10 },
  logo: { width: '100%', height: '100%', objectFit: 'contain' },
  schoolName: { fontFamily: 'Anton', fontSize: 28, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1 },
  reportTitle: { fontSize: 16, color: '#334155', marginTop: 5, fontWeight: 'bold' },
  reportMonth: { fontSize: 12, color: '#64748b', marginTop: 3 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { flex: 1, padding: 10, backgroundColor: '#f8fafc', border: '1pt solid #e2e8f0', borderRadius: 4, marginHorizontal: 5, textAlign: 'center' },
  statTitle: { fontSize: 10, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 16, color: '#0f172a', fontWeight: 'bold' },
  table: { width: '100%', border: '1pt solid #cbd5e1' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderBottom: '1pt solid #cbd5e1' },
  tableRow: { flexDirection: 'row', borderBottom: '1pt solid #e2e8f0', alignItems: 'center' },
  tableCell: { padding: 8, fontSize: 10, color: '#334155' },
  col1: { width: '15%', borderRight: '1pt solid #e2e8f0' },
  col2: { width: '35%', borderRight: '1pt solid #e2e8f0' },
  col3: { width: '20%', borderRight: '1pt solid #e2e8f0', textAlign: 'right' },
  col4: { width: '15%', borderRight: '1pt solid #e2e8f0', textAlign: 'right' },
  col5: { width: '15%', textAlign: 'right', fontWeight: 'bold', color: '#0f172a' },
  headerText: { fontWeight: 'bold', color: '#0f172a', fontSize: 10 },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTop: '1pt solid #cbd5e1' },
  signText: { fontSize: 10, color: '#0f172a', fontWeight: 'bold' }
});

export default function SalarySheetTemplate({ records, month, totals, showBonus }) {
  const displayMonth = new Date(month + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Image src="/logo.png" style={styles.logo} />
          </View>
          <Text style={styles.schoolName}>Western School and College</Text>
          <Text style={styles.reportTitle}>TEACHERS SALARY REPORT</Text>
          <Text style={styles.reportMonth}>Billing Month: {displayMonth}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statTitle}>Total Base Paid</Text>
            <Text style={styles.statValue}>Tk {totals.base.toLocaleString()}</Text>
          </View>
          {showBonus && (
            <View style={styles.statBox}>
              <Text style={styles.statTitle}>Total Bonus Paid</Text>
              <Text style={styles.statValue}>Tk {totals.bonus.toLocaleString()}</Text>
            </View>
          )}
          <View style={[styles.statBox, { backgroundColor: '#e2e8f0', borderColor: '#cbd5e1' }]}>
            <Text style={styles.statTitle}>Grand Total</Text>
            <Text style={styles.statValue}>Tk {totals.grand.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.col1, styles.headerText]}>ID</Text>
            <Text style={[styles.tableCell, styles.col2, styles.headerText]}>Teacher Name</Text>
            <Text style={[styles.tableCell, styles.col3, styles.headerText]}>Base Salary</Text>
            {showBonus && <Text style={[styles.tableCell, styles.col4, styles.headerText]}>Bonus</Text>}
            <Text style={[styles.tableCell, showBonus ? styles.col5 : { ...styles.col5, width: '30%' }, styles.headerText]}>Total Paid</Text>
          </View>

          {records.map((r, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.col1]}>{r.teacherId}</Text>
              <Text style={[styles.tableCell, styles.col2]}>{r.name}</Text>
              <Text style={[styles.tableCell, styles.col3]}>{Number(r.baseSalary).toLocaleString()}</Text>
              {showBonus && <Text style={[styles.tableCell, styles.col4]}>{Number(r.bonus).toLocaleString()}</Text>}
              <Text style={[styles.tableCell, showBonus ? styles.col5 : { ...styles.col5, width: '30%' }]}>
                {Number(r.totalAmount).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.signText}>Prepared By</Text>
          <Text style={styles.signText}>Principal Signature</Text>
        </View>
      </Page>
    </Document>
  );
}