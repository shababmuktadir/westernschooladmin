import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

Font.register({
  family: "Kalpurush",
  src: "/kalpurush.ttf",
});

const styles = StyleSheet.create({
  page: { padding: 30, paddingBottom: 60, fontFamily: "Kalpurush", backgroundColor: "#ffffff" },
  header: { textAlign: "center", marginBottom: 20, borderBottomWidth: 2, borderBottomColor: "#000000", paddingBottom: 10 },
  schoolName: { fontSize: 22, color: "#000000", marginBottom: 6, fontWeight: "bold" },
  reportTitle: { fontSize: 16, color: "#000000", fontWeight: "bold", marginBottom: 4 },
  
  infoBox: { flexDirection: "row", justifyContent: "space-between", marginBottom: 15, padding: 10, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#000000" },
  infoCol: { width: "48%" },
  infoText: { fontSize: 12, color: "#000000", marginBottom: 4, fontWeight: "bold" },
  
  table: { width: "100%", borderWidth: 1, borderColor: "#000000", borderBottomWidth: 0, borderRightWidth: 0 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#cbd5e1", borderBottomWidth: 1, borderColor: "#000000" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#000000", minHeight: 22, alignItems: "center" },
  tableCell: { paddingVertical: 6, borderRightWidth: 1, borderColor: "#000000", justifyContent: "center" },
  cellTextBold: { fontSize: 11, color: "#000000", fontWeight: "bold" },
  cellText: { fontSize: 10, color: "#000000" },
  
  summaryBox: { marginTop: 20, padding: 10, borderWidth: 1, borderColor: "#000000", backgroundColor: "#f1f5f9" },
  summaryTitle: { fontSize: 14, fontWeight: "bold", marginBottom: 6 },
  summaryText: { fontSize: 12, marginBottom: 3 },

  sectionTitle: { fontSize: 14, fontWeight: "bold", color: "#000000", backgroundColor: "#e2e8f0", padding: 8, marginBottom: 10, marginTop: 25, borderLeftWidth: 4, borderLeftColor: "#000000" },

  footer: { position: "absolute", bottom: 20, left: 30, right: 30, textAlign: "center", fontSize: 10, color: "#000000", borderTopWidth: 1, borderTopColor: "#000000", paddingTop: 5 }
});

// 🛑 100% FIXED TEXT CLIPPING BUG
// \u00A0 (Non-breaking space) দেওয়া হয়েছে যাতে react-pdf বাংলা ফন্টের প্রথম ও শেষ অক্ষর কেটে না ফেলে।
const TCell = ({ text, width, align = "left", bold = false, color = "#000000" }) => (
  <View style={[styles.tableCell, { width, justifyContent: "center" }]}>
    <Text style={[bold ? styles.cellTextBold : styles.cellText, { color, textAlign: align, width: "100%" }]}>
      {`\u00A0${text}\u00A0`}
    </Text>
  </View>
);

const engToBng = (num) => {
  if (!num && num !== 0) return '০';
  const bngDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).split('').map(digit => bngDigits[digit] || digit).join('');
};

export default function SubjectResultTemplate({ 
  className, 
  subjectName, 
  fullMarks, 
  passMarks, 
  enableTutorial, 
  studentsData, 
  highestMark, 
  highestScorers 
}) {
  const colWidths = enableTutorial 
    ? { roll: "12%", name: "33%", exam: "15%", tut: "15%", total: "15%", status: "10%" }
    : { roll: "15%", name: "45%", exam: "0%", tut: "0%", total: "25%", status: "15%" };

  const passedStudents = studentsData.filter(s => s.status === "Pass");
  const top10Students = [...passedStudents].sort((a, b) => b.total - a.total).slice(0, 10);
  const failedStudents = studentsData.filter(s => s.status === "Fail");

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <View style={styles.header}>
          <Text style={styles.schoolName}>ওয়েস্টার্ন স্কুল অ্যান্ড কলেজ</Text>
          <Text style={styles.reportTitle}>বিষয়ভিত্তিক ফলাফল (Subject-wise Result Sheet)</Text>
        </View>

        <View style={styles.infoBox}>
          <View style={styles.infoCol}>
            <Text style={styles.infoText}>শ্রেণী (Class): {className}</Text>
            <Text style={styles.infoText}>বিষয় (Subject): {subjectName}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoText}>পূর্ণমান (Full Marks): {engToBng(fullMarks)}</Text>
            <Text style={styles.infoText}>পাস নম্বর (Pass Marks): {engToBng(passMarks)}</Text>
          </View>
        </View>

        {/* MAIN RESULT TABLE */}
        <View style={styles.table}>
          <View style={styles.tableHeaderRow} fixed>
            <TCell text="রোল" width={colWidths.roll} align="center" bold />
            <TCell text="শিক্ষার্থীর নাম" width={colWidths.name} bold />
            {enableTutorial && <TCell text="লিখিত" width={colWidths.exam} align="center" bold />}
            {enableTutorial && <TCell text="টিউটোরিয়াল" width={colWidths.tut} align="center" bold />}
            <TCell text="প্রাপ্ত নম্বর" width={colWidths.total} align="center" bold />
            <TCell text="ফলাফল" width={colWidths.status} align="center" bold />
          </View>

          {studentsData.map((s, idx) => (
            <View key={idx} style={styles.tableRow} wrap={false}>
              <TCell text={engToBng(s.roll)} width={colWidths.roll} align="center" />
              <TCell text={s.name} width={colWidths.name} />
              {enableTutorial && <TCell text={engToBng(s.exam)} width={colWidths.exam} align="center" />}
              {enableTutorial && <TCell text={engToBng(s.tut)} width={colWidths.tut} align="center" />}
              <TCell text={engToBng(s.total)} width={colWidths.total} align="center" bold />
              <TCell text={s.status} width={colWidths.status} align="center" bold color={s.status === "Pass" ? "#16a34a" : "#dc2626"} />
            </View>
          ))}
        </View>

        <View style={styles.summaryBox} wrap={false}>
          <Text style={styles.summaryTitle}>ফলাফলের সারসংক্ষেপ</Text>
          <Text style={styles.summaryText}>সর্বোচ্চ প্রাপ্ত নম্বর: {engToBng(highestMark)}</Text>
          <Text style={styles.summaryText}>সর্বোচ্চ নম্বর প্রাপ্ত শিক্ষার্থী: {highestScorers.join(", ") || "-"}</Text>
        </View>

        {/* TOP 10 STUDENTS TABLE */}
        {top10Students.length > 0 && (
          <View>
            <Text style={styles.sectionTitle}>মেধাতালিকা - শীর্ষ ১০ জন (Top 10 Students)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow} fixed>
                <TCell text="মেধাক্রম" width="15%" align="center" bold />
                <TCell text="রোল" width="20%" align="center" bold />
                <TCell text="শিক্ষার্থীর নাম" width="45%" bold />
                <TCell text="প্রাপ্ত নম্বর" width="20%" align="center" bold />
              </View>
              {top10Students.map((s, idx) => (
                <View key={idx} style={styles.tableRow} wrap={false}>
                  <TCell text={engToBng(idx + 1)} width="15%" align="center" bold />
                  <TCell text={engToBng(s.roll)} width="20%" align="center" />
                  <TCell text={s.name} width="45%" />
                  <TCell text={engToBng(s.total)} width="20%" align="center" bold />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* FAILED STUDENTS TABLE */}
        {failedStudents.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { borderLeftColor: "#dc2626" }]}>অকৃতকার্য শিক্ষার্থীদের তালিকা (Failed Students)</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow} fixed>
                <TCell text="রোল" width="20%" align="center" bold />
                <TCell text="শিক্ষার্থীর নাম" width="60%" bold />
                <TCell text="প্রাপ্ত নম্বর" width="20%" align="center" bold />
              </View>
              {failedStudents.map((s, idx) => (
                <View key={idx} style={styles.tableRow} wrap={false}>
                  <TCell text={engToBng(s.roll)} width="20%" align="center" color="#dc2626" />
                  <TCell text={s.name} width="60%" color="#dc2626" />
                  <TCell text={engToBng(s.total)} width="20%" align="center" bold color="#dc2626" />
                </View>
              ))}
            </View>
          </View>
        )}

        <Text style={styles.footer} fixed>
          Western School & College Automated System • পৃষ্ঠা <Text render={({ pageNumber, totalPages }) => `${engToBng(pageNumber)} / ${engToBng(totalPages)}`} />
        </Text>
      </Page>
    </Document>
  );
}