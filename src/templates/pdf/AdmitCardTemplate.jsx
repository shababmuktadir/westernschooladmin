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
  "Class 7": "https://res.cloudinary.com/do1dejkkk/image/upload/v1776881851/Gemini_Generated_Image_rkl605rkl605rkl6_nooehi_1_1_v9wgur.png",
};

const PRINCIPAL_SIGN = "https://res.cloudinary.com/do1dejkkk/image/upload/v1776331870/principal_sign-removebg-preview_pj4jrj.png";

// New Theme Colors
const COLORS = {
  navy: '#0b0c35',
  yellow: '#fcd352',
  blueBadge: '#225d97',
  black: '#000000',
  white: '#fcfcfc', // Slightly off-white for professional print look
};

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cardWrapper: {
    width: '50%',
    height: '50%',
    padding: 10,
    borderRight: '1pt dashed #ccc',
    borderBottom: '1pt dashed #ccc',
  },
  navyBackground: {
    backgroundColor: COLORS.navy,
    width: '100%',
    height: '100%',
    padding: 12,
    paddingTop: 45, // Leave space for the logo overlapping
    position: 'relative',
  },
  yellowBox: {
    backgroundColor: COLORS.yellow,
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    position: 'relative',
    paddingTop: 32, 
  },
  // --- Logo Section (Overlapping) ---
  logoContainer: {
    position: 'absolute',
    top: -40, // Pulls the logo up to overlap the navy and yellow
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  logo: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: '#fff',
  },
  // --- Typography ---
  schoolName: {
    fontFamily: 'Helvetica-Bold', // Bold Corporate Font
    fontSize: 20,
    color: COLORS.black,
    textAlign: 'center',
    letterSpacing: -0.8, // Creates the "Collaps" / Condensed feel
    marginBottom: 15,
  },
  // --- Admit Card Blue Badge ---
  admitBadge: {
    backgroundColor: COLORS.blueBadge,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    position: 'absolute',
    top: 65,
    left: -12, // Pulls it outside the yellow box slightly
    width: 170,
    zIndex: 5,
  },
  admitBadgeText: {
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    fontSize: 22,
    letterSpacing: 0.5,
  },
  // --- Info Section ---
  infoContainer: {
    marginTop: 60, // Push down below the badge
    paddingHorizontal: 25,
    zIndex: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  label: {
    fontFamily: 'Times-Bold', // Corporate Serif Font
    width: 75,
    fontSize: 14,
    color: COLORS.black,
  },
  value: {
    fontFamily: 'Times-Roman', // Standard Professional Serif
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
    textTransform: 'capitalize',
  },
  // --- White Box (Signatures Section) ---
  whiteBox: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    backgroundColor: COLORS.white,
    borderRadius: 12, // Rounded corners on all sides
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 15,
    zIndex: 3,
  },
  signBlock: {
    alignItems: 'center',
    width: 90,
  },
  signImg: {
    width: 70,
    height: 25,
    objectFit: 'contain',
    marginBottom: 2,
  },
  signPlaceholder: {
    height: 25,
  },
  signText: {
    fontFamily: 'Times-Bold',
    fontSize: 10,
    color: COLORS.black,
  },
});

export default function AdmitCardTemplate({ students, examData, schoolConfig }) {
  const pages = chunkArray(students, 4);
  // Using 'dd MMMM yyyy' to match the image output exactly (e.g. 30 July 2026)
  const formattedDate = examData.examDate ? format(new Date(examData.examDate), "dd MMMM yyyy") : "N/A";

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
                
                {/* Outer Navy Blue Box */}
                <View style={styles.navyBackground}>
                  
                  {/* Inner Yellow Rounded Box */}
                  <View style={styles.yellowBox}>
                    
                    {/* Centered Overlapping Logo */}
                    <View style={styles.logoContainer}>
                      {schoolConfig?.schoolLogo && (
                        <Image src={schoolConfig.schoolLogo} style={styles.logo} />
                      )}
                    </View>

                    {/* School Name */}
                    <Text style={styles.schoolName}>{schoolConfig?.schoolName}</Text>

                    {/* Left side Admit Card Badge */}
                    <View style={styles.admitBadge}>
                      <Text style={styles.admitBadgeText}>Admit Card</Text>
                    </View>

                    {/* Student Information Fields */}
                    <View style={styles.infoContainer}>
                      <View style={styles.row}>
                        <Text style={styles.label}>NAME</Text>
                        <Text style={styles.value}>{studentName}</Text>
                      </View>
                      
                      <View style={styles.row}>
                        <Text style={styles.label}>CLASS</Text>
                        <Text style={styles.value}>{safeClass}</Text>
                      </View>
                      
                      <View style={styles.row}>
                        <Text style={styles.label}>ROLL</Text>
                        <Text style={styles.value}>{student.rollNumber || "N/A"}</Text>
                      </View>

                      <View style={styles.row}>
                        <Text style={styles.label}>ID</Text>
                        <Text style={styles.value}>{student.studentId || "N/A"}</Text>
                      </View>
                      
                      <View style={styles.row}>
                        <Text style={styles.label}>DATE</Text>
                        <Text style={styles.value}>{formattedDate}</Text>
                      </View>
                    </View>

                    {/* White Bottom Box for Signatures */}
                    <View style={styles.whiteBox}>
                      <View style={styles.signBlock}>
                        {classSign ? (
                          <Image src={classSign} style={styles.signImg} />
                        ) : (
                          <View style={styles.signPlaceholder} />
                        )}
                        <Text style={styles.signText}>CLASS TEACHER</Text>
                      </View>

                      <View style={styles.signBlock}>
                        {PRINCIPAL_SIGN ? (
                          <Image src={PRINCIPAL_SIGN} style={styles.signImg} />
                        ) : (
                          <View style={styles.signPlaceholder} />
                        )}
                        <Text style={styles.signText}>PRINCIPAL</Text>
                      </View>
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