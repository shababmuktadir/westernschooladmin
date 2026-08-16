import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// --- PDF Styles ---
const styles = StyleSheet.create({
  page: { padding: 30, fontFamily: "Helvetica", backgroundColor: "#ffffff" },
  
  // Header
  headerContainer: { textAlign: "center", marginBottom: 20, borderBottomWidth: 2, borderBottomColor: "#1e293b", paddingBottom: 10 },
  schoolName: { fontSize: 18, fontWeight: "black", textTransform: "uppercase", marginBottom: 4 },
  reportTitle: { fontSize: 12, fontWeight: "bold", color: "#334155", marginBottom: 4 },
  dateText: { fontSize: 9, color: "#64748b" },

  // KPI Section
  kpiRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  kpiBox: { width: "23%", padding: 10, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 4, backgroundColor: "#f8fafc" },
  kpiLabel: { fontSize: 8, color: "#64748b", textTransform: "uppercase", marginBottom: 4 },
  kpiValue: { fontSize: 14, fontWeight: "bold", color: "#0f172a" },

  // Sections
  sectionTitle: { fontSize: 12, fontWeight: "bold", color: "#0f172a", marginTop: 15, marginBottom: 8, backgroundColor: "#f1f5f9", padding: 6, borderRadius: 4 },
  
  // Table Engine
  table: { width: "100%", borderWidth: 1, borderColor: "#e2e8f0", borderBottomWidth: 0, borderRightWidth: 0, marginBottom: 15 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e2e8f0" },
  tableHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#e2e8f0", backgroundColor: "#f1f5f9" },
  tableCell: { padding: 5, borderRightWidth: 1, borderColor: "#e2e8f0", justifyContent: "center" },
  cellText: { fontSize: 9, color: "#334155" },
  cellTextBold: { fontSize: 9, fontWeight: "bold", color: "#0f172a" },
  
  // Footer
  footer: { position: "absolute", bottom: 30, left: 30, right: 30, textAlign: "center", fontSize: 8, color: "#94a3b8", borderTopWidth: 1, borderTopColor: "#e2e8f0", paddingTop: 10 }
});

// Helper for Table Cells
const TCell = ({ text, width, align = "left", bold = false }) => (
  <View style={[styles.tableCell, { width }]}>
    <Text style={[bold ? styles.cellTextBold : styles.cellText, { textAlign: align }]}>{text}</Text>
  </View>
);

export default function FeeSummaryReportTemplate({ 
  mode = "full", // "full" or "students"
  validData = [], 
  classSummary = [], 
  monthSummary = [], 
  totals = { validCount: 0, grandTotal: 0, tuition: 0, exam: 0 } 
}) {
  
  const currentDate = new Date().toLocaleDateString('en-GB');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* --- HEADER --- */}
        <View style={styles.headerContainer}>
          <Text style={styles.schoolName}>Western School and College</Text>
          <Text style={styles.reportTitle}>
            {mode === "full" ? "FEE STAGING SUMMARY REPORT" : "STUDENT FEE IMPORT LIST"}
          </Text>
          <Text style={styles.dateText}>Date Generated: {currentDate}</Text>
        </View>

        {/* --- FULL REPORT ONLY SECTION --- */}
        {mode === "full" && (
          <>
            {/* KPIs */}
            <View style={styles.kpiRow}>
              <View style={styles.kpiBox}><Text style={styles.kpiLabel}>Valid Records</Text><Text style={styles.kpiValue}>{totals.validCount}</Text></View>
              <View style={styles.kpiBox}><Text style={styles.kpiLabel}>Total Expected</Text><Text style={styles.kpiValue}>Tk {totals.grandTotal}</Text></View>
              <View style={styles.kpiBox}><Text style={styles.kpiLabel}>Total Tuition</Text><Text style={styles.kpiValue}>Tk {totals.tuition}</Text></View>
              <View style={styles.kpiBox}><Text style={styles.kpiLabel}>Total Exam Fee</Text><Text style={styles.kpiValue}>Tk {totals.exam}</Text></View>
            </View>

            {/* Class-wise Summary */}
            <Text style={styles.sectionTitle}>1. Class-wise Earnings Summary</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <TCell text="Class" width="20%" bold />
                <TCell text="Students" width="20%" align="center" bold />
                <TCell text="Tuition Fee" width="20%" align="right" bold />
                <TCell text="Exam Fee" width="20%" align="right" bold />
                <TCell text="Total Amount" width="20%" align="right" bold />
              </View>
              {classSummary.map((c, i) => (
                <View key={i} style={styles.tableRow}>
                  <TCell text={c.className} width="20%" bold />
                  <TCell text={c.count} width="20%" align="center" />
                  <TCell text={`Tk ${c.tuition}`} width="20%" align="right" />
                  <TCell text={`Tk ${c.exam}`} width="20%" align="right" />
                  <TCell text={`Tk ${c.total}`} width="20%" align="right" bold />
                </View>
              ))}
            </View>

            {/* Month-wise Summary */}
            <Text style={styles.sectionTitle}>2. Month-wise Allocation Summary</Text>
            <View style={styles.table}>
              <View style={styles.tableHeaderRow}>
                <TCell text="Month" width="25%" bold />
                <TCell text="Tuition Earned" width="25%" align="right" bold />
                <TCell text="Exam Fee Earned" width="25%" align="right" bold />
                <TCell text="Total Amount" width="25%" align="right" bold />
              </View>
              {monthSummary.map((m, i) => (
                <View key={i} style={styles.tableRow}>
                  <TCell text={m.monthName} width="25%" bold />
                  <TCell text={`Tk ${m.tuition}`} width="25%" align="right" />
                  <TCell text={`Tk ${m.exam}`} width="25%" align="right" />
                  <TCell text={`Tk ${m.total}`} width="25%" align="right" bold />
                </View>
              ))}
            </View>
          </>
        )}

        {/* --- STUDENT LIST (Shows in both Full and Students Only mode) --- */}
        <Text style={styles.sectionTitle}>
          {mode === "full" ? "3. Student Detailed List" : "Student Details & Manual Verification Sheet"}
        </Text>
        
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeaderRow}>
            <TCell text="ID" width="12%" bold />
            <TCell text="Name & Class" width="25%" bold />
            <TCell text="Allocated Months" width="23%" bold />
            <TCell text="Amount" width="15%" align="right" bold />
            {/* Show Manual Edit Column only in "students" mode for pen entry */}
            {mode === "students" && <TCell text="Manual Note/Month" width="25%" bold />}
            {mode === "full" && <TCell text="Fee Breakdown" width="25%" align="right" bold />}
          </View>
          
          {/* Table Body */}
          {validData.map((row, i) => (
            <View key={i} style={styles.tableRow}>
              <TCell text={row.studentId} width="12%" bold />
              <TCell text={`${row.studentName}\nClass: ${row.class}`} width="25%" />
              <TCell text={row.selectedMonths.join(", ")} width="23%" />
              <TCell text={`Tk ${row.grandTotal}`} width="15%" align="right" bold />
              
              {mode === "students" ? (
                // Blank space for writing with a pen
                <TCell text="" width="25%" />
              ) : (
                // Detailed breakdown for full report
                <TCell 
                  text={Object.entries(row.feeDetails).map(([k,v]) => `${k.split(' ')[0]}: Tk${v}`).join(', ')} 
                  width="25%" align="right" 
                />
              )}
            </View>
          ))}
        </View>

        {/* Footer */}
        <Text style={styles.footer} fixed>
          Generated by Western School & College automated Fee System • Page {" "}
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </Text>

      </Page>
    </Document>
  );
}