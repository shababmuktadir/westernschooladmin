import React from "react";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// বাংলা ফন্ট যুক্ত করা (public ফোল্ডার থেকে)
Font.register({
  family: "Kalpurush",
  src: "/kalpurush.ttf",
});

const styles = StyleSheet.create({
  // ফুটারের সাথে ওভারল্যাপ এড়াতে paddingBottom: 80 দেওয়া হয়েছে
  page: { padding: 30, paddingBottom: 80, fontFamily: "Kalpurush", backgroundColor: "#ffffff" },
  header: { textAlign: "center", marginBottom: 25, borderBottomWidth: 2, borderBottomColor: "#000000", paddingBottom: 15 },
  schoolName: { fontSize: 26, color: "#000000", marginBottom: 8, fontWeight: "bold" },
  reportTitle: { fontSize: 18, color: "#000000", fontWeight: "bold" },
  dateText: { fontSize: 12, color: "#000000", marginTop: 8 },
  
  summaryBox: { flexDirection: "row", justifyContent: "space-between", marginBottom: 25, padding: 15, backgroundColor: "#f8fafc", borderWidth: 1.5, borderColor: "#000000", borderRadius: 4 },
  summaryItem: { width: "48%" },
  summaryLabel: { fontSize: 14, color: "#000000", marginBottom: 6, textTransform: "uppercase", fontWeight: "bold" },
  summaryValue: { fontSize: 22, color: "#000000", fontWeight: "bold" },
  wordText: { fontSize: 11, color: "#1e293b", marginTop: 4 },

  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#000000", backgroundColor: "#e2e8f0", padding: 8, marginBottom: 10, marginTop: 10, borderLeftWidth: 4, borderLeftColor: "#000000" },
  
  table: { width: "100%", borderWidth: 1.5, borderColor: "#000000", borderBottomWidth: 0, borderRightWidth: 0 },
  tableHeaderRow: { flexDirection: "row", backgroundColor: "#cbd5e1", borderBottomWidth: 1.5, borderColor: "#000000" },
  tableRow: { flexDirection: "row", borderBottomWidth: 1.5, borderColor: "#000000", minHeight: 24, alignItems: "center" },
  tableCell: { padding: 8, borderRightWidth: 1.5, borderColor: "#000000", justifyContent: "center" },
  cellTextBold: { fontSize: 13, color: "#000000", fontWeight: "bold" },
  cellText: { fontSize: 12, color: "#000000" },
  
  // Signature Section
  signatureSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 60, paddingHorizontal: 10 },
  signBox: { alignItems: "center" },
  signLine: { fontSize: 12, color: "#000000", marginBottom: 6 },
  signText: { fontSize: 13, color: "#000000", fontWeight: "bold" },

  // Footer fixed at the bottom
  footer: { position: "absolute", bottom: 20, left: 30, right: 30, textAlign: "center", fontSize: 11, color: "#000000", borderTopWidth: 1.5, borderTopColor: "#000000", paddingTop: 10 }
});

const TCell = ({ text, width, align = "left", bold = false }) => (
  <View style={[styles.tableCell, { width }]}>
    <Text style={[bold ? styles.cellTextBold : styles.cellText, { textAlign: align }]}>{text}</Text>
  </View>
);

// ইংরেজি সংখ্যাকে বাংলায় কনভার্ট করার ফাংশন
const engToBng = (num) => {
  if (!num && num !== 0) return '০';
  const bngDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).split('').map(digit => bngDigits[digit] || digit).join('');
};

// ১ থেকে ৯৯ পর্যন্ত বাংলা সংখ্যার শব্দের অ্যারে
const bngWords = ["", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়", "দশ", "এগারো", "বারো", "তেরো", "চোদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ", "বিশ", "একুশ", "বাইশ", "তেইশ", "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আঠাশ", "ঊনত্রিশ", "ত্রিশ", "একত্রিশ", "বত্রিশ", "তেত্রিশ", "চৌত্রিশ", "পঁয়ত্রিশ", "ছত্রিশ", "সাঁইত্রিশ", "আটত্রিশ", "ঊনচল্লিশ", "চল্লিশ", "একচল্লিশ", "বিয়াল্লিশ", "তেতাল্লিশ", "চুয়াল্লিশ", "পঁয়তাল্লিশ", "ছেচল্লিশ", "সাতচল্লিশ", "আটচল্লিশ", "ঊনপঞ্চাশ", "পঞ্চাশ", "একান্ন", "বায়ান্ন", "তিপ্পান্ন", "চুয়ান্ন", "পঞ্চান্ন", "ছাপ্পান্ন", "সাতান্ন", "আটান্ন", "ঊনষাট", "ষাট", "একষট্টি", "বাষট্টি", "তেষট্টি", "চৌষট্টি", "পঁয়ষট্টি", "ছেষট্টি", "সাতষট্টি", "আটষট্টি", "ঊনসত্তর", "সত্তর", "একাতর", "বাহাত্তর", "তিয়াত্তর", "চুয়াত্তর", "পঁচাত্তর", "ছিয়াত্তর", "সাতাত্তর", "আটাত্তর", "ঊনআশি", "আশি", "একাশি", "বিরাশি", "তিরাশি", "চুরাশি", "পঁচাশি", "ছিয়াশি", "সাতাশি", "আটাশি", "ঊননব্বই", "নব্বই", "একানব্বই", "বিরানব্বই", "তিরানব্বই", "চুরানব্বই", "পঁচানব্বই", "ছিয়ানব্বই", "সাতানব্বই", "আটানব্বই", "নিরানব্বই"];

// Number to Bengali Words Converter Safe Function (Crash-free)
const numberToBngWords = (value) => {
  const num = Number(value);
  if (isNaN(num) || num === 0) return '(শূন্য টাকা মাত্র)';
  
  let strNum = Math.floor(num).toString();
  if (strNum.length > 9) return '(অতিরিক্ত বড় সংখ্যা)';
  
  // ০ দিয়ে ৯ ডিজিট পূরণ করে নেওয়া (কোটি, লক্ষ, হাজার, শত, দশক+একক)
  let n = ('000000000' + strNum).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return ''; 
  
  let str = '';
  str += (n[1] != 0) ? bngWords[Number(n[1])] + ' কোটি ' : '';
  str += (n[2] != 0) ? bngWords[Number(n[2])] + ' লক্ষ ' : '';
  str += (n[3] != 0) ? bngWords[Number(n[3])] + ' হাজার ' : '';
  str += (n[4] != 0) ? bngWords[Number(n[4])] + ' শত ' : '';
  str += (n[5] != 0) ? bngWords[Number(n[5])] : '';
  
  return '(' + str.trim() + ' টাকা মাত্র)';
};

export default function ExpenseReportTemplate({ monthName, overallTotal, monthlyTotal, categorySummary, monthlyExpenses }) {
  const currentDate = engToBng(new Date().toLocaleDateString('en-GB'));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.schoolName}>ওয়েস্টার্ন স্কুল অ্যান্ড কলেজ</Text>
          <Text style={styles.reportTitle}>খরচের হিসাব ও রিপোর্ট - {monthName || ""}</Text>
          <Text style={styles.dateText}>রিপোর্ট প্রিন্ট করার তারিখ: {currentDate}</Text>
        </View>

        {/* SUMMARY SECTION */}
        <View style={styles.summaryBox}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>সর্বমোট খরচ (Overall Total)</Text>
            <Text style={styles.summaryValue}>{engToBng(overallTotal || 0)} টাকা</Text>
            <Text style={styles.wordText}>{numberToBngWords(overallTotal || 0)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>এই মাসের খরচ ({monthName || ""})</Text>
            <Text style={styles.summaryValue}>{engToBng(monthlyTotal || 0)} টাকা</Text>
            <Text style={styles.wordText}>{numberToBngWords(monthlyTotal || 0)}</Text>
          </View>
        </View>

        {/* CATEGORY WISE SUMMARY */}
        <Text style={styles.sectionTitle}>ক্যাটাগরি অনুযায়ী খরচের বিবরণ</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <TCell text="ক্যাটাগরি নাম" width="60%" bold />
            <TCell text="মোট খরচ" width="40%" align="right" bold />
          </View>
          {categorySummary && Object.entries(categorySummary).map(([cat, total], idx) => (
            <View key={idx} style={styles.tableRow}>
              <TCell text={cat} width="60%" />
              <TCell text={`${engToBng(total)} টাকা`} width="40%" align="right" />
            </View>
          ))}
        </View>

        {/* DETAILED EXPENSE TABLE */}
        <Text style={styles.sectionTitle}>বিস্তারিত খরচের তালিকা ({monthName || ""})</Text>
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <TCell text="তারিখ" width="15%" bold />
            <TCell text="ক্যাটাগরি" width="25%" bold />
            <TCell text="বিবরণ" width="35%" bold />
            <TCell text="পরিমাণ" width="25%" align="right" bold />
          </View>
          {monthlyExpenses && monthlyExpenses.map((exp, idx) => (
            <View key={idx} style={styles.tableRow}>
              <TCell text={engToBng(exp.date)} width="15%" />
              <TCell text={exp.category} width="25%" />
              <TCell text={exp.description || "-"} width="35%" />
              <TCell text={`${engToBng(exp.amount)} টাকা`} width="25%" align="right" />
            </View>
          ))}
        </View>

        {/* SIGNATURE SECTION */}
        <View style={styles.signatureSection} wrap={false}>
          <View style={styles.signBox}>
            <Text style={styles.signLine}>______________________</Text>
            <Text style={styles.signText}>প্রশাসনিক কর্মকর্তার সাক্ষর</Text>
          </View>
          <View style={styles.signBox}>
            <Text style={styles.signLine}>______________________</Text>
            <Text style={styles.signText}>প্রধান শিক্ষকের সাক্ষর</Text>
          </View>
        </View>

        {/* FOOTER */}
        <Text style={styles.footer} fixed>
          Western School & College Automated System • Made by Muktadir <Text render={({ pageNumber, totalPages }) => `${engToBng(pageNumber)} / ${engToBng(totalPages)}`}
          />
        </Text>
      </Page>
    </Document>
  );
}