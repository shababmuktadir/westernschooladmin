import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// ariblk.ttf (Arial Black) ফন্ট রেজিস্টার করা হলো এবং origin অ্যাড করা হলো
Font.register({
  family: 'ArialBlack',
  src: `${window.location.origin}/ariblk.ttf`,
});

const styles = StyleSheet.create({
  page: { padding: 40, backgroundColor: '#ffffff' },
  header: { textAlign: 'center', marginBottom: 25, borderBottomWidth: 2, borderBottomColor: '#1e293b', paddingBottom: 15 },
  logoBox: { width: 60, height: 60, alignSelf: 'center', marginBottom: 10 },
  logo: { width: '100%', height: '100%', objectFit: 'contain' },
  // Anton এর বদলে ArialBlack ব্যবহার করা হলো
  schoolName: { fontFamily: 'ArialBlack', fontSize: 24, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1 },
  reportTitle: { fontSize: 16, color: '#334155', marginTop: 5, fontWeight: 'bold' },
  reportDate: { fontSize: 12, color: '#64748b', marginTop: 3 },
  statsContainer: { flexDirection: 'row', justifyContent: 'flex-start', gap: 40, marginBottom: 20 },
  statText: { fontSize: 12, color: '#0f172a', fontWeight: 'bold' },
  table: { width: '100%', border: '1pt solid #cbd5e1' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', borderBottom: '1pt solid #cbd5e1' },
  tableRow: { flexDirection: 'row', borderBottom: '1pt solid #e2e8f0', alignItems: 'center' },
  tableCell: { padding: 8, fontSize: 10, color: '#334155' },
  col1: { width: '15%', borderRight: '1pt solid #e2e8f0' },
  col2: { width: '35%', borderRight: '1pt solid #e2e8f0' },
  col3: { width: '20%', borderRight: '1pt solid #e2e8f0' },
  col4: { width: '20%', borderRight: '1pt solid #e2e8f0' },
  col5: { width: '10%', textAlign: 'center', fontWeight: 'bold' },
  headerText: { fontWeight: 'bold', color: '#0f172a', fontSize: 10 },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 10, borderTop: '1pt solid #cbd5e1' },
  signText: { fontSize: 10, color: '#0f172a', fontWeight: 'bold' },
  present: { color: '#059669' }, 
  absent: { color: '#dc2626' } 
});

export default function AttendanceReportTemplate({ records, date }) {
  const displayDate = new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const total = records.length;
  const presentCount = records.filter(d => d.status === "P").length;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoBox}>
            {/* লোগো লিংক ফিক্স করা হলো */}
            <Image src={`${window.location.origin}/logo.png`} style={styles.logo} />
          </View>
          <Text style={styles.schoolName}>Western School and College</Text>
          <Text style={styles.reportTitle}>TEACHERS ATTENDANCE REPORT</Text>
          <Text style={styles.reportDate}>Date: {displayDate}</Text>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.statText}>Subtotal: {total}</Text>
          <Text style={styles.statText}>Present: {presentCount}</Text>
          <Text style={styles.statText}>Absent: {total - presentCount}</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableCell, styles.col1, styles.headerText]}>ID</Text>
            <Text style={[styles.tableCell, styles.col2, styles.headerText]}>Name</Text>
            <Text style={[styles.tableCell, styles.col3, styles.headerText]}>Date</Text>
            <Text style={[styles.tableCell, styles.col4, styles.headerText]}>Time</Text>
            <Text style={[styles.tableCell, styles.col5, styles.headerText]}>Status</Text>
          </View>

          {records.map((r, i) => (
            <View key={i} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tableCell, styles.col1]}>{r.teacherId}</Text>
              <Text style={[styles.tableCell, styles.col2]}>{r.name}</Text>
              <Text style={[styles.tableCell, styles.col3]}>{new Date(r.date).toLocaleDateString('en-US')}</Text>
              <Text style={[styles.tableCell, styles.col4]}>{r.time || "--:--:--"}</Text>
              <Text style={[styles.tableCell, styles.col5, r.status === 'P' ? styles.present : styles.absent]}>
                {r.status === 'P' ? 'P' : 'A'}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.signText}>Prepared By</Text>
          <Text style={styles.signText}>Principal Signature</Text>
        </View>
      </Page>
    </Document>
  );
}