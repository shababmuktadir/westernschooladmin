import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

Font.register({
  family: 'ArialBlack',
  src: `${window.location.origin}/ariblk.ttf`,
});

const styles = StyleSheet.create({
  page: { padding: 30, backgroundColor: '#ffffff' },
  headerContainer: { flexDirection: 'row', alignItems: 'center', borderBottom: '2pt solid #1e3a8a', paddingBottom: 10, marginBottom: 15 },
  logo: { width: 60, height: 60, marginRight: 15 },
  schoolName: { fontSize: 20, color: '#1e3a8a', fontFamily: 'ArialBlack', textTransform: 'uppercase' },
  subTitle: { fontSize: 10, color: '#334155', marginTop: 2 },
  reportTitle: { fontSize: 14, fontFamily: 'ArialBlack', textAlign: 'center', marginBottom: 5, textTransform: 'uppercase' },
  monthText: { fontSize: 10, textAlign: 'center', marginBottom: 15, color: '#475569' },
  
  table: { width: '100%', borderTop: '1pt solid #000', borderLeft: '1pt solid #000' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#e2e8f0' },
  tableRow: { flexDirection: 'row' },
  cellHeader: { borderRight: '1pt solid #000', borderBottom: '1pt solid #000', padding: 6, fontSize: 10, fontWeight: 'bold', textAlign: 'center' },
  cell: { borderRight: '1pt solid #000', borderBottom: '1pt solid #000', padding: 6, fontSize: 9 },
  
  colSl: { width: '8%', textAlign: 'center' },
  colId: { width: '10%', textAlign: 'center' },
  colSalary: { width: '18%', textAlign: 'right' },
  colBonus: { width: '15%', textAlign: 'right' },
  colTotal: { width: '20%', textAlign: 'right', fontWeight: 'bold' },

  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, flexDirection: 'row', justifyContent: 'space-between' },
  signLine: { borderTop: '1pt solid #000', width: 150, textAlign: 'center', paddingTop: 5, fontSize: 10, fontWeight: 'bold' }
});

export default function OrderedSalarySheetTemplate({ teachers, paidRecords, month, showBonus }) {
  const displayMonth = new Date(month + "-01").toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  let totalSalary = 0;
  let totalBonus = 0;
  let grandTotal = 0;

  // ডাইনামিক উইডথ (যাতে বোনাস কলাম না থাকলে ডানপাশে ফাঁকা জায়গা না থাকে)
  const nameColumnWidth = showBonus ? '29%' : '44%';
  const footerSpanWidth = showBonus ? '47%' : '62%';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerContainer}>
          <Image src={`${window.location.origin}/logo.png`} style={styles.logo} />
          <View>
            <Text style={styles.schoolName}>Western School & College</Text>
            <Text style={styles.subTitle}>Didar Market, Dewan Bazar, Chattogram.</Text>
          </View>
        </View>

        <Text style={styles.reportTitle}>TEACHERS AND STAFF SALARY SHEET</Text>
        <Text style={styles.monthText}>Billing Month: {displayMonth}</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.cellHeader, styles.colSl]}>SL</Text>
            <Text style={[styles.cellHeader, styles.colId]}>ID</Text>
            <Text style={[styles.cellHeader, { width: nameColumnWidth }]}>Name</Text>
            <Text style={[styles.cellHeader, styles.colSalary]}>Salary Amount (Tk)</Text>
            {showBonus && <Text style={[styles.cellHeader, styles.colBonus]}>Bonus (Tk)</Text>}
            <Text style={[styles.cellHeader, styles.colTotal]}>Total Paid (Tk)</Text>
          </View>

          {teachers.map((t, index) => {
            const paidData = paidRecords.find(r => r.teacherId === t.teacherId);
            const isPaid = !!paidData;
            
            const salary = isPaid ? Number(paidData.baseSalary) : Number(t.salary || 0);
            const bonus = isPaid ? Number(paidData.bonus) : 0;
            const total = isPaid ? Number(paidData.totalAmount) : 0;

            totalSalary += salary;
            totalBonus += bonus;
            grandTotal += total;

            return (
              <View key={t.teacherId} style={styles.tableRow} wrap={false}>
                <Text style={[styles.cell, styles.colSl]}>{index + 1}</Text>
                <Text style={[styles.cell, styles.colId]}>{t.teacherId}</Text>
                <Text style={[styles.cell, { width: nameColumnWidth }]}>{t.englishName}</Text>
                <Text style={[styles.cell, styles.colSalary]}>{salary.toLocaleString()}</Text>
                {showBonus && <Text style={[styles.cell, styles.colBonus]}>{bonus.toLocaleString()}</Text>}
                <Text style={[styles.cell, styles.colTotal]}>{isPaid ? total.toLocaleString() : "UNPAID"}</Text>
              </View>
            );
          })}

          <View style={[styles.tableRow, { backgroundColor: '#f8fafc' }]} wrap={false}>
            <Text style={[styles.cell, { width: footerSpanWidth, textAlign: 'right', fontWeight: 'bold' }]}>GRAND TOTAL:</Text>
            <Text style={[styles.cell, styles.colSalary, { fontWeight: 'bold' }]}>{totalSalary.toLocaleString()}</Text>
            {showBonus && <Text style={[styles.cell, styles.colBonus, { fontWeight: 'bold' }]}>{totalBonus.toLocaleString()}</Text>}
            <Text style={[styles.cell, styles.colTotal, { fontWeight: 'bold' }]}>{grandTotal.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.signLine}>Prepared By</Text>
          <Text style={styles.signLine}>Principal Signature</Text>
        </View>
      </Page>
    </Document>
  );
}