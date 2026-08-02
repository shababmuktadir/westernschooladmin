import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// ariblk.ttf (Arial Black) ফন্ট ইমপোর্ট করা হলো (ডাইনামিক অরিজিন সহ যাতে 404 এরর না আসে)
Font.register({
  family: 'ArialBlack',
  src: `${window.location.origin}/ariblk.ttf`,
});

// প্রিন্সিপাল এবং ক্লাস টিচারদের সিগনেচারের লিস্ট
const PRINCIPAL_SIGN = "https://res.cloudinary.com/do1dejkkk/image/upload/v1776331870/principal_sign-removebg-preview_pj4jrj.png";

const CLASS_TEACHER_SIGNS = {
  "Play": "https://res.cloudinary.com/do1dejkkk/image/upload/v1784308689/aysha_mam_icrrpz.png",
  "Nursery": "https://res.cloudinary.com/do1dejkkk/image/upload/v1784308687/rimi_qgmydc.png",
  "KG": "https://res.cloudinary.com/do1dejkkk/image/upload/v1784308687/joba_mam_ikklcw.png",
  "1": "https://res.cloudinary.com/do1dejkkk/image/upload/v1784308689/aysha_mam_icrrpz.png",
  "Class 1": "https://res.cloudinary.com/do1dejkkk/image/upload/v1784308689/aysha_mam_icrrpz.png",
  "2": "https://res.cloudinary.com/do1dejkkk/image/upload/v1784308688/rima_ikfv8m.png",
  "Class 2": "https://res.cloudinary.com/do1dejkkk/image/upload/v1784308688/rima_ikfv8m.png",
  "3": "https://res.cloudinary.com/do1dejkkk/image/upload/v1784308687/urmi_drmxk4.png",
  "Class 3": "https://res.cloudinary.com/do1dejkkk/image/upload/v1784308687/urmi_drmxk4.png",
  "4": "https://res.cloudinary.com/do1dejkkk/image/upload/v1784308687/sharmin_mam_warj7u.png",
  "Class 4": "https://res.cloudinary.com/do1dejkkk/image/upload/v1784308687/sharmin_mam_warj7u.png",
  "5": "https://res.cloudinary.com/do1dejkkk/image/upload/v1784308688/nandi_mam_fswkb1.png",
  "Class 5": "https://res.cloudinary.com/do1dejkkk/image/upload/v1784308688/nandi_mam_fswkb1.png",
  "6": "https://res.cloudinary.com/do1dejkkk/image/upload/v1776881851/Gemini_Generated_Image_rkl605rkl605rkl6_nooehi_1_1_v9wgur.png",
  "Class 7": "https://res.cloudinary.com/do1dejkkk/image/upload/v1776881851/Gemini_Generated_Image_rkl605rkl605rkl6_nooehi_1_1_v9wgur.png",
};

const styles = StyleSheet.create({
  page: { 
    paddingTop: 30,
    paddingBottom: 90, // সিগনেচার এবং পেজ নাম্বারের জন্য স্পেস
    paddingHorizontal: 30,
    backgroundColor: '#ffffff',
  },
  
  // --- Header Layout (Centered Logo & Name) - Only on 1st Page ---
  headerContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  logoBox: { width: 65, height: 65, marginBottom: 5 },
  logo: { width: '100%', height: '100%', objectFit: 'contain' },
  
  schoolName: { 
    fontSize: 24, 
    color: '#1e3a8a', // Corporate Blue
    fontFamily: 'ArialBlack', // নতুন ariblk.ttf ফন্ট অ্যাপ্লাই করা হলো
    textTransform: 'uppercase', 
    letterSpacing: 1.2 
  },
  
  termBox: {
    border: '1.5pt solid #1e3a8a',
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 20,
    marginTop: 10,
    alignSelf: 'center',
    alignItems: 'center',
    minWidth: '50%',
  },
  termName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#0f172a', textTransform: 'uppercase' },
  marksheetTitle: { fontSize: 11, fontFamily: 'Helvetica', marginTop: 2, color: '#334155' },
  
  // --- Meta Info (Students & Date) ---
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
    marginBottom: 5,
    paddingHorizontal: 2
  },
  metaText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#0f172a' },
  
  // --- Table Design ---
  table: { 
    width: '100%', 
    borderTop: '1pt solid #000000',
    borderLeft: '1pt solid #000000',
  },
  tableHeader: { 
    flexDirection: 'row', 
    backgroundColor: '#e2e8f0', 
  },
  tableRow: { 
    flexDirection: 'row', 
  },
  
  // Cells
  tableCellHeader: {
    borderRight: '1pt solid #000000',
    borderBottom: '1pt solid #000000',
    paddingVertical: 6,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tableCell: {
    borderRight: '1pt solid #000000',
    borderBottom: '1pt solid #000000',
    paddingVertical: 5,
    paddingHorizontal: 4,
    justifyContent: 'center',
  },
  
  // Column Widths
  colName: { width: '18%' },
  colRoll: { width: '4%' },
  colSubject: { flex: 1 }, 
  colTotal: { width: '6%' },
  colRank: { width: '5%' },
  
  // Text Styles
  headerText: { fontSize: 8, fontFamily: 'Helvetica-Bold', textAlign: 'center', color: '#000000' },
  cellText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#1e293b' },
  cellRoll: { fontSize: 9, fontFamily: 'Helvetica-Bold', textAlign: 'center', color: '#000000' },
  
  // --- Footer (Signatures & Page Number) ---
  footer: { 
    position: 'absolute', 
    bottom: 30, 
    left: 40, 
    right: 40, 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  signBlock: {
    alignItems: 'center',
    width: 160,
  },
  signImage: {
    height: 40, 
    objectFit: 'contain',
    marginBottom: 2,
  },
  signLine: { 
    borderTop: '1pt solid #000000', 
    width: '100%', 
    paddingTop: 5, 
    alignItems: 'center' 
  },
  signText: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#000000' },
  
  // Page Number in Footer Center
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#334155'
  }
});

export default function BlankMarksheetTemplate({ students, className, subjects, termName, generatedDate }) {
  const teacherSignUrl = CLASS_TEACHER_SIGNS[className] || null;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        
        {/* === Header Section === */}
        <View>
          <View style={styles.headerContainer}>
            <View style={styles.logoBox}>
              <Image src={`${window.location.origin}/logo.png`} style={styles.logo} />
            </View>
            <Text style={styles.schoolName}>Western School & College</Text>
          </View>

          {/* Exam Name Box */}
          <View style={styles.termBox}>
            <Text style={styles.termName}>{termName || "2ND TERM EXAMINATION"}</Text>
            <Text style={styles.marksheetTitle}>{className} Marksheet</Text>
          </View>

          {/* Meta Information (Total Students & Date) */}
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>Total Students: {students.length}</Text>
            <Text style={styles.metaText}>Generated: {generatedDate}</Text>
          </View>
        </View>

        {/* === Main Table === */}
        <View style={styles.table}>
          
          {/* Table Header Row (Fixed so it repeats on every page) */}
          <View style={styles.tableHeader} fixed>
            <View style={[styles.tableCellHeader, styles.colName]}><Text style={styles.headerText}>Student Name</Text></View>
            <View style={[styles.tableCellHeader, styles.colRoll]}><Text style={styles.headerText}>Roll</Text></View>
            
            {subjects.map((sub, idx) => (
              <View key={idx} style={[styles.tableCellHeader, styles.colSubject]}>
                <Text style={styles.headerText}>{sub}</Text>
              </View>
            ))}
            
            <View style={[styles.tableCellHeader, styles.colTotal]}><Text style={styles.headerText}>Total</Text></View>
            <View style={[styles.tableCellHeader, styles.colRank]}><Text style={styles.headerText}>Rank</Text></View>
          </View>

          {/* Table Data Rows (Students) */}
          {students.map((student, idx) => (
            <View key={idx} style={styles.tableRow} wrap={false}>
              <View style={[styles.tableCell, styles.colName]}>
                <Text style={styles.cellText}>{student.fullName}</Text>
              </View>
              <View style={[styles.tableCell, styles.colRoll]}>
                <Text style={styles.cellRoll}>{student.rollNumber}</Text>
              </View>
              
              {/* Empty Subject Cells */}
              {subjects.map((_, sIdx) => (
                <View key={sIdx} style={[styles.tableCell, styles.colSubject]}></View>
              ))}
              
              {/* Empty Total & Rank Cells */}
              <View style={[styles.tableCell, styles.colTotal]}></View>
              <View style={[styles.tableCell, styles.colRank]}></View>
            </View>
          ))}
        </View>

        {/* === Footer / Signatures (Fixed at bottom on all pages) === */}
        <View style={styles.footer} fixed>
          
          {/* Class Teacher Signature */}
          <View style={styles.signBlock}>
            {teacherSignUrl && (
              <Image src={teacherSignUrl} style={styles.signImage} />
            )}
            <View style={styles.signLine}>
              <Text style={styles.signText}>Class Teacher's Signature</Text>
            </View>
          </View>

          {/* Principal Signature */}
          <View style={styles.signBlock}>
            <Image src={PRINCIPAL_SIGN} style={styles.signImage} />
            <View style={styles.signLine}>
              <Text style={styles.signText}>Principal's Signature</Text>
            </View>
          </View>

        </View>

        {/* === Page Number (Fixed at bottom center) === */}
        <Text 
          style={styles.pageNumber} 
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} 
          fixed 
        />

      </Page>
    </Document>
  );
}