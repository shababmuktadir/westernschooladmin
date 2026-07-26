import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from "date-fns";

// Register Anton font - local file
Font.register({
  family: 'Anton',
  src: '/Anton-Regular.ttf',
});

// Register UnifrakturMaguntia font - local file for Admit Card title
Font.register({
  family: 'UnifrakturMaguntia',
  src: `${window.location.origin}/UnifrakturMaguntia-Regular.ttf`,
});

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// Signatures configuration (Dynamic)
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

const PRINCIPAL_SIGN = "https://res.cloudinary.com/do1dejkkk/image/upload/v1776331870/principal_sign-removebg-preview_pj4jrj.png";

// Professional blue theme
const COLORS = {
  pageBg: '#ffe6b6',
  cardBg: '#ffcc98',
  headerNavy: '#0B2545',
  accentBlue: '#133C55',
  badgeBlue: '#1E6091',
  white: '#FFFFFF',
  darkText: '#1A1A1A',
  goldAccent: '#E6B422',
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: COLORS.pageBg,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 0,
    width: '100%',
    height: '100%',
  },
  cardWrapper: {
    width: '50%',
    height: '50%',
    padding: 0,
    borderRightWidth: 0.8,
    borderRightColor: '#94a3b8',
    borderRightStyle: 'dashed',
    borderBottomWidth: 0.8,
    borderBottomColor: '#94a3b8',
    borderBottomStyle: 'dashed',
  },
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.badgeBlue,
    overflow: 'hidden',
    height: '100%',
    position: 'relative',
  },
  header: {
    backgroundColor: COLORS.headerNavy,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingBottom: 10,
  },
  logoBox: {
    width: 55,
    height: 55,
    backgroundColor: COLORS.white,
    borderRadius: 27.5,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  logo: {
    width: '85%',
    height: '85%',
    objectFit: 'contain',
  },
  schoolNameContainer: {
    flex: 1,
  },
  // Anton font for school name
  schoolName: {
    fontFamily: 'Anton',
    fontSize: 22,
    color: COLORS.white,
    lineHeight: 1.2,
    textTransform: 'uppercase',
  },
  accentLine: {
    height: 3,
    backgroundColor: COLORS.goldAccent,
    width: '100%',
  },
  badgeContainer: {
    alignItems: 'center',
    marginTop: 14,
  },
  badge: {
    backgroundColor: COLORS.badgeBlue,
    paddingVertical: 5,
    paddingHorizontal: 22,
    borderRadius: 20,
  },
  badgeText: {
    fontFamily: 'Times-Roman',
    color: COLORS.white,
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  // UnifrakturMaguntia font for "ADMIT CARD" title
  title: {
    fontFamily: 'UnifrakturMaguntia',
    fontSize: 28,
    color: COLORS.headerNavy,
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  titleLineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 30,
  },
  titleLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: COLORS.accentBlue,
    opacity: 0.4,
  },
  titleDiamond: {
    width: 8,
    height: 8,
    backgroundColor: COLORS.goldAccent,
    transform: 'rotate(45deg)',
    marginHorizontal: 8,
  },
  infoBox: {
    marginHorizontal: 25,
    borderWidth: 1,
    borderColor: '#B0C8E0',
    borderRadius: 8,
    backgroundColor: COLORS.white,
    padding: 10,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  // Times New Roman for labels
  label: {
    fontFamily: 'Times-Roman',
    fontSize: 12,
    color: COLORS.accentBlue,
    width: 65,
    fontWeight: 'bold',
  },
  // Times New Roman for values
  value: {
    fontFamily: 'Times-Roman',
    fontSize: 12,
    color: COLORS.darkText,
    flex: 1,
  },
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    borderTopWidth: 1,
    borderColor: '#B0C8E0',
    paddingHorizontal: 18,
    paddingTop: 25,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  signBlock: {
    alignItems: 'center',
    width: 100,
    position: 'relative',
  },
  signLineGraphic: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 5,
  },
  signCircle: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    borderWidth: 1.2,
    borderColor: COLORS.accentBlue,
    backgroundColor: COLORS.white,
  },
  signLine: {
    flex: 1,
    height: 1.2,
    backgroundColor: COLORS.accentBlue,
  },
  signImg: {
    width: 75,
    height: 28,
    objectFit: 'contain',
    position: 'absolute',
    bottom: 15,
    zIndex: 10,
  },
  signText: {
    fontFamily: 'Times-Roman',
    fontSize: 10,
    color: COLORS.accentBlue,
    marginTop: 2,
    fontWeight: 'bold',
  },
});

export default function AdmitCardTemplate({ students, examData, schoolConfig }) {
  const pages = chunkArray(students, 4);
  
  const displayExamName = examData?.examName || "2nd Term Examination";
  const formattedDate = examData?.examDate ? format(new Date(examData.examDate), "dd MMMM yyyy") : "N/A";
  const examTime = examData?.examTime || "10:00 AM - 12:30 PM";

  return (
    <Document>
      {pages.map((pageStudents, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {pageStudents.map((student, idx) => {
            const safeClass = student.class ? student.class.trim() : "";
            const classSign = CLASS_TEACHER_SIGNS[safeClass] || null;
            const studentName = student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || "N/A";

            return (
              <View key={idx} style={styles.cardWrapper}>
                <View style={styles.card}>
                  {/* Header */}
                  <View style={styles.header}>
                    <View style={styles.logoBox}>
                      {schoolConfig?.schoolLogo && (
                        <Image src={schoolConfig.schoolLogo} style={styles.logo} />
                      )}
                    </View>
                    <View style={styles.schoolNameContainer}>
                      <Text style={styles.schoolName}>
                        Western School{"\n"}and College
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.accentLine} />
                  <View style={styles.badgeContainer}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{displayExamName}</Text>
                    </View>
                  </View>

                  {/* ADMIT CARD - UnifrakturMaguntia font */}
                  <Text style={styles.title}>ADMIT CARD</Text>
                  <View style={styles.titleLineContainer}>
                    <View style={styles.titleLine} />
                    <View style={styles.titleDiamond} />
                    <View style={styles.titleLine} />
                  </View>

                  <View style={styles.infoBox}>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>NAME</Text>
                      <Text style={styles.value}>{studentName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>CLASS</Text>
                      <Text style={styles.value}>{safeClass}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>ROLL</Text>
                      <Text style={styles.value}>{student.rollNumber || "N/A"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>ID</Text>
                      <Text style={styles.value}>{student.studentId || "N/A"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>DATE</Text>
                      <Text style={styles.value}>{formattedDate}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.label}>TIME</Text>
                      <Text style={styles.value}>{examTime}</Text>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <View style={styles.signBlock}>
                      {classSign && <Image src={classSign} style={styles.signImg} />}
                      <View style={styles.signLineGraphic}>
                        <View style={styles.signCircle} />
                        <View style={styles.signLine} />
                        <View style={styles.signCircle} />
                      </View>
                      <Text style={styles.signText}>CLASS TEACHER</Text>
                    </View>

                    <View style={styles.signBlock}>
                      {PRINCIPAL_SIGN && <Image src={PRINCIPAL_SIGN} style={styles.signImg} />}
                      <View style={styles.signLineGraphic}>
                        <View style={styles.signCircle} />
                        <View style={styles.signLine} />
                        <View style={styles.signCircle} />
                      </View>
                      <Text style={styles.signText}>PRINCIPAL</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </Page>
      ))}
    </Document>
  );
}