import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from "date-fns";

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// Signatures configuration
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
  "Class 6": "https://res.cloudinary.com/do1dejkkk/image/upload/v1776881851/Gemini_Generated_Image_rkl605rkl605rkl6_nooehi_1_1_v9wgur.png",
  "7": "https://res.cloudinary.com/do1dejkkk/image/upload/v1776881851/Gemini_Generated_Image_rkl605rkl605rkl6_nooehi_1_1_v9wgur.png",
  "Class 7": "https://res.cloudinary.com/do1dejkkk/image/upload/v1776881851/Gemini_Generated_Image_rkl605rkl605rkl6_nooehi_1_1_v9wgur.png",
  "8": "https://res.cloudinary.com/do1dejkkk/image/upload/v1776881851/Gemini_Generated_Image_rkl605rkl605rkl6_nooehi_1_1_v9wgur.png",
  "Class 8": "https://res.cloudinary.com/do1dejkkk/image/upload/v1776881851/Gemini_Generated_Image_rkl605rkl605rkl6_nooehi_1_1_v9wgur.png",
  "9": "https://res.cloudinary.com/do1dejkkk/image/upload/v1776881851/Gemini_Generated_Image_rkl605rkl605rkl6_nooehi_1_1_v9wgur.png",
  "Class 9": "https://res.cloudinary.com/do1dejkkk/image/upload/v1776881851/Gemini_Generated_Image_rkl605rkl605rkl6_nooehi_1_1_v9wgur.png",
  "10": "https://res.cloudinary.com/do1dejkkk/image/upload/v1776881851/Gemini_Generated_Image_rkl605rkl605rkl6_nooehi_1_1_v9wgur.png",
  "Class 10": "https://res.cloudinary.com/do1dejkkk/image/upload/v1776881851/Gemini_Generated_Image_rkl605rkl605rkl6_nooehi_1_1_v9wgur.png",
};

const PRINCIPAL_SIGN = "https://res.cloudinary.com/do1dejkkk/image/upload/v1776331870/principal_sign-removebg-preview_pj4jrj.png";

// Theme Colors
const COLORS = {
  navy: '#13203A',
  gold: '#EAB308',
  brown: '#4A3219',
  lightGold: '#FDE047',
};

const styles = StyleSheet.create({
  page: {
    padding: 10,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  innerCard: {
    backgroundColor: COLORS.navy,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    borderLeft: `4pt solid ${COLORS.gold}`,
    padding: 10,
    position: 'relative',
  },
  // --- Header Section ---
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  schoolNameText: {
    fontSize: 14,
    fontWeight: 'extrabold',
    color: COLORS.gold,
    textTransform: 'uppercase',
  },
  schoolAddressText: {
    fontSize: 8,
    color: COLORS.lightGold,
    marginTop: 2,
  },
  admitBadge: {
    backgroundColor: COLORS.gold,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 15,
    borderTopRightRadius: 5,
    marginLeft: 10,
  },
  admitBadgeText: {
    fontSize: 14,
    fontWeight: 'extrabold',
    color: COLORS.navy,
    letterSpacing: 1,
  },
  // --- Main Body (Brown Box) ---
  brownBox: {
    backgroundColor: COLORS.brown,
    borderRadius: 12,
    padding: 12,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoCol: {
    flex: 1,
    paddingRight: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  label: {
    width: 80,
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.gold,
    textTransform: 'uppercase',
  },
  colon: {
    fontSize: 9,
    color: COLORS.gold,
    marginRight: 4,
  },
  value: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.gold,
    borderBottom: `1pt solid ${COLORS.gold}`,
    paddingBottom: 2,
  },
  // --- Right Side (Student ID) ---
  idCol: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  idBox: {
    border: `1pt solid ${COLORS.gold}`,
    borderRadius: 6,
    padding: 8,
    width: '100%',
    alignItems: 'center',
  },
  idLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginBottom: 5,
  },
  idValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.gold,
    borderBottom: `1pt dashed ${COLORS.gold}`,
    width: '100%',
    textAlign: 'center',
    paddingBottom: 2,
  },
  // --- Footer ---
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 10,
    paddingHorizontal: 5,
  },
  signBlock: {
    alignItems: 'center',
    width: 90,
  },
  signImg: {
    width: 80,
    height: 30,
    objectFit: 'contain',
    marginBottom: 2,
  },
  signPlaceholder: {
    height: 30,
  },
  signLine: {
    width: '100%',
    borderTop: `1pt solid ${COLORS.gold}`,
    marginTop: 2,
  },
  signText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.gold,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  wishBox: {
    border: `1pt solid ${COLORS.gold}`,
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  wishText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.gold,
    textAlign: 'center',
  },
});

const getCutMarkStyle = (idx) => {
  const borderLine = '1pt dashed #94a3b8';
  return {
    width: '50%',
    height: '50%',
    padding: 8,
    borderRight: idx === 0 || idx === 2 ? borderLine : 'none',
    borderBottom: idx === 0 || idx === 1 ? borderLine : 'none',
  };
};

export default function AdmitCardTemplate({ students, examData, schoolConfig }) {
  const pages = chunkArray(students, 4);
  const formattedDate = examData.examDate ? format(new Date(examData.examDate), "dd MMM, yyyy") : "N/A";

  return (
    <Document>
      {pages.map((pageStudents, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          
          {pageStudents.map((student, idx) => {
            const safeClass = student.class ? student.class.trim() : "";
            const classSign = CLASS_TEACHER_SIGNS[safeClass] || null;
            const studentName = student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || "N/A";

            return (
              <View key={idx} style={getCutMarkStyle(idx)}>
                <View style={styles.innerCard}>
                  
                  {/* --- Header --- */}
                  <View style={styles.header}>
                    <View style={styles.headerLeft}>
                      {schoolConfig?.schoolLogo && (
                        <Image src={schoolConfig.schoolLogo} style={styles.logo} />
                      )}
                      <View>
                        <Text style={styles.schoolNameText}>{schoolConfig?.schoolName}</Text>
                        <Text style={styles.schoolAddressText}>123, College Road, Dhanmondi</Text>
                        <Text style={styles.schoolAddressText}>Dhaka-1205, Bangladesh</Text>
                      </View>
                    </View>
                    <View style={styles.admitBadge}>
                      <Text style={styles.admitBadgeText}>ADMIT CARD</Text>
                    </View>
                  </View>

                  {/* --- Main Brown Box --- */}
                  <View style={styles.brownBox}>
                    <View style={styles.infoCol}>
                      <View style={styles.row}>
                        <Text style={styles.label}>STUDENT NAME</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.value}>{studentName}</Text>
                      </View>
                      
                      <View style={styles.row}>
                        <Text style={styles.label}>ROLL NO.</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.value}>{student.rollNumber || "N/A"}</Text>
                      </View>
                      
                      <View style={styles.row}>
                        <Text style={styles.label}>CLASS</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.value}>{safeClass || "N/A"}</Text>
                      </View>
                      
                      <View style={styles.row}>
                        <Text style={styles.label}>EXAM DATE</Text>
                        <Text style={styles.colon}>:</Text>
                        <Text style={styles.value}>{formattedDate}</Text>
                      </View>

                      {examData.examTime && (
                        <View style={styles.row}>
                          <Text style={styles.label}>EXAM TIME</Text>
                          <Text style={styles.colon}>:</Text>
                          <Text style={styles.value}>{examData.examTime}</Text>
                        </View>
                      )}
                    </View>

                    {/* Student ID Box */}
                    <View style={styles.idCol}>
                      <View style={styles.idBox}>
                        <Text style={styles.idLabel}>STUDENT ID</Text>
                        <Text style={styles.idValue}>{student.studentId || "N/A"}</Text>
                      </View>
                    </View>
                  </View>

                  {/* --- Footer Signatures --- */}
                  <View style={styles.footer}>
                    <View style={styles.signBlock}>
                      {classSign ? (
                        <Image src={classSign} style={styles.signImg} />
                      ) : (
                        <View style={styles.signPlaceholder} />
                      )}
                      <View style={styles.signLine} />
                      <Text style={styles.signText}>CLASS TEACHER</Text>
                    </View>

                    <View style={styles.wishBox}>
                      <Text style={styles.wishText}>BEST OF LUCK</Text>
                      <Text style={styles.wishText}>FOR YOUR EXAM</Text>
                    </View>

                    <View style={styles.signBlock}>
                      {PRINCIPAL_SIGN ? (
                        <Image src={PRINCIPAL_SIGN} style={styles.signImg} />
                      ) : (
                        <View style={styles.signPlaceholder} />
                      )}
                      <View style={styles.signLine} />
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