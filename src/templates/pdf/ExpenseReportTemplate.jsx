import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// বাংলা ফন্ট যুক্ত করা (public ফোল্ডার থেকে)
Font.register({
  family: "Kalpurush",
  src: "/kalpurush.ttf",
});

const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Kalpurush", backgroundColor: "#ffffff" },
  header: { textAlign: "center", marginBottom: 20, borderBottomWidth: 2, borderBottomColor: "#1e293b", paddingBottom: 10 },
  schoolName: { fontSize: 20, fontWeight: "bold", marginBottom: 4 },
  reportTitle: { fontSize: 14, color: "#334155" },
  dateText: { fontSize: 10, color: "#64748b", marginTop: 5 },
  
  summaryBox: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, padding: 10, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4 },
  summaryItem: { width: "48%" },
  summaryLabel: { fontSize: 10, color: "#64748b", marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },

  sectionTitle: { fontSize: 14, fontWeight: "bold", backgroundColor: "#f1f5f9", padding: 6, marginBottom: 8, marginTop: 10 },
  
  table: { width: "100%", borderWidth: 1, borderColor: "#e2e8f0", borderBottomWidth: 0, borderRightWidth: 0 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#e2e8f0", borderBottomWidth: 1, borderColor: "#cbd5e1" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e2e8f0" },
  tableCell: { padding: 6, borderRightWidth: 1, borderColor: "#e2e8f0", justifyContent: "center" },
  cellTextBold: { fontSize: 10, fontWeight: "bold", color: "#0f172a" },
  cellText: { fontSize: 10, color: "#334155" },
  
  footer: { position: "absolute", bottom: 30, left: 30, right: 30, textAlign: "center", fontSize: 9, color: "#94a3b8", borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10 }
});

const TCell = ({ text, width, align = "left", bold = false }) => (
  <View style={[styles.tableCell, { width }]}>
    <Text style={[bold ? styles.cellTextBold : styles.cellText, { textAlign: align }]}>{text}</Text>
  </View>
);

// ইংরেজি সংখ্যাকে বাংলায় কনভার্ট করার ফাংশন
const engToBng = (num) => {
  const bngDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).split('').map(digit => bngDigits[digit] || digit).join('');
};

export default function ExpenseReportTemplate({ monthName, overallTotal, monthlyTotal, categorySummary, monthlyExpenses }) {
  const currentDate = engToBng(new Date().toLocaleDateString('en-GB'));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.schoolName}>ওয়েস্টার্ন স্কুল অ্যান্ড কলেজ</Text>
          <Text style={styles.reportTitle}>খরচের হিসাব ও রিপোর্ট - {monthName}</Text>
          <Text style={styles.dateText}>রিপোর্ট তৈরির তারিখ: {currentDate}</Text>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>সর্বমোট খরচ (Overall)</Text>
            <Text style={styles.summaryValue}>{engToBng(overallTotal)} টাকা</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>মাসিক মোট খরচ ({monthName})</Text>
            <Text style={styles.summaryValue}>{engToBng(monthlyTotal)} টাকা</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>ক্যাটাগরি অনুযায়ী মাসিক খরচের বিবরণ</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <TCell text="ক্যাটাগরি" width="50%" bold />
            <TCell text="মোট খরচ" width="50%" align="right" bold />
          </View>
          {Object.entries(categorySummary).map(([cat, total], idx) => (
            <View key={idx} style={styles.tableRow}>
              <TCell text={cat} width="50%" />
              <TCell text={`${engToBng(total)} টাকা`} width="50%" align="right" />
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>বিস্তারিত খরচের তালিকা ({monthName})</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <TCell text="তারিখ" width="20%" bold />
            <TCell text="ক্যাটাগরি" width="30%" bold />
            <TCell text="বিবরণ" width="30%" bold />
            <TCell text="পরিমাণ" width="20%" align="right" bold />
          </View>
          {monthlyExpenses.map((exp, idx) => (
            <View key={idx} style={styles.tableRow}>
              <TCell text={engToBng(exp.date)} width="20%" />
              <TCell text={exp.category} width="30%" />
              <TCell text={exp.description || "-"} width="30%" />
              <TCell text={`${engToBng(exp.amount)} টাকা`} width="20%" align="right" />
            </View>
          ))}
        </View>

        <Text style={styles.footer} fixed>
          Western School & College Automated System • পৃষ্ঠা <Text render={({ pageNumber, totalPages }) => `${engToBng(pageNumber)} / ${engToBng(totalPages)}`} />
        </Text>
      </Page>
    </Document>
  );
}