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

// Theme Colors from your new image
const COLORS = {
  navy: '#09093b',
  yellow: '#FDD65B',
  blueBadge: '#24619B',
  black: '#000000',
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
    padding: 15,
    paddingTop: 45, // Leave space for the logo overlapping
    position: 'relative',
  },
  yellowBox: {
    backgroundColor: COLORS.yellow,
    width: '100%',
    height: '100%',
    borderRadius: 25,
    position: 'relative',
    paddingTop: 35, // Space for the school name below the logo
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
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff', // Optional: white background for logo if it's transparent
  },
  // --- Typography ---
  schoolName: {
    fontSize: 18,
    fontWeight: 'extrabold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: 20,
  },
  // --- Admit Card Blue Badge ---
  admitBadge: {
    backgroundColor: COLORS.blueBadge,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderTopRightRadius: 25,
    borderBottomRightRadius: 25,
    position: 'absolute',
    top: 75,
    left: -15, // Pulls it outside the yellow box slightly
    width: 160,
  },
  admitBadgeText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'extrabold',
  },
  // --- Info Section ---
  infoContainer: {
    marginTop: 65, // Push down below the badge
    paddingHorizontal: 25,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    width: 70,
    fontSize: 14,
    fontWeight: 'extrabold',
    color: COLORS.black,
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: COLORS.black,
  },
  // --- Footer Section ---
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
    fontSize: 10,
    fontWeight: 'extrabold',
    color: COLORS.black,
  },
});

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

                    {/* Footer (Signatures & Text) */}
                    <View style={styles.footer}>
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