import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { format } from "date-fns";

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// Updated with new SVG Links and multiple format support to prevent missing signatures
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
  // Fallbacks for upper classes
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

const styles = StyleSheet.create({
  page: {
    padding: 10,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  innerCard: {
    border: '2pt solid #0f172a',
    height: '100%',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
  },
  headerBg: {
    backgroundColor: '#1e3a8a', 
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottom: '2pt solid #0f172a',
  },
  logo: {
    width: 45,
    height: 45,
    marginRight: 12,
    backgroundColor: '#ffffff',
    padding: 2,
    borderRadius: 4,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 13,
    fontWeight: 'extrabold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  schoolAddress: {
    fontSize: 9,
    color: '#e2e8f0', 
    marginTop: 2,
  },
  admitTitleWrapper: {
    backgroundColor: '#f1f5f9', 
    borderBottom: '1pt solid #cbd5e1',
    paddingVertical: 5,
    alignItems: 'center',
  },
  admitTitle: {
    fontSize: 12,
    fontWeight: 'black',
    color: '#0f172a',
    letterSpacing: 2,
  },
  examName: {
    fontSize: 10,
    color: '#1e3a8a', 
    fontWeight: 'bold',
    marginTop: 2,
  },
  bodyContent: {
    padding: 12,
    flex: 1,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    justifyContent: 'space-between', 
  },
  dataBoxFull: {
    width: '100%',
    marginBottom: 10,
  },
  dataBoxThird: {
    width: '31%', 
    marginBottom: 10,
  },
  dataBoxHalf: {
    width: '48%', 
    marginBottom: 10,
  },
  label: {
    fontSize: 9,
    color: '#475569',
    textTransform: 'uppercase',
    fontWeight: 'bold',
  },
  value: {
    fontSize: 11,
    fontWeight: 'extrabold',
    color: '#000000', 
    borderBottom: '1pt solid #94a3b8',
    paddingBottom: 2,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  signatureBox: {
    alignItems: 'center',
    width: 120, 
  },
  signatureImage: {
    width: 140, 
    height: 40, 
    objectFit: 'contain',
    marginBottom: 2,
  },
  signaturePlaceholder: {
    height: 40, 
  },
  signatureLine: {
    width: '100%',
    borderTop: '1pt solid #000000',
  },
  signatureText: {
    fontSize: 9,
    marginTop: 4,
    color: '#000000',
    fontWeight: 'extrabold',
  },
});

const getCutMarkStyle = (idx) => {
  const borderLine = '1.5pt dashed #475569';
  return {
    width: '50%',
    height: '50%',
    padding: 10,
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

            return (
              <View key={idx} style={getCutMarkStyle(idx)}>
                <View style={styles.innerCard}>
                  
                  {/* Header */}
                  <View style={styles.headerBg}>
                    {schoolConfig?.schoolLogo && (
                      <Image src={schoolConfig.schoolLogo} style={styles.logo} />
                    )}
                    <View style={styles.schoolInfo}>
                      <Text style={styles.schoolName}>{schoolConfig?.schoolName}</Text>
                      <Text style={styles.schoolAddress}>Didar market, Dewan bazar, chattogram</Text>
                    </View>
                  </View>

                  {/* Title */}
                  <View style={styles.admitTitleWrapper}>
                    <Text style={styles.admitTitle}>ADMIT CARD</Text>
                    <Text style={styles.examName}>{examData.examName}</Text>
                  </View>

                  {/* Body Content */}
                  <View style={styles.bodyContent}>
                    <View style={styles.dataGrid}>
                      
                      {/* Name Field - Fixed to use fullName with a fallback for old data */}
                      <View style={styles.dataBoxFull}>
                        <Text style={styles.label}>Student Name</Text>
                        <Text style={styles.value}>
                          {student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || "Name Not Found"}
                        </Text>
                      </View>
                      
                      <View style={styles.dataBoxThird}>
                        <Text style={styles.label}>Student ID</Text>
                        <Text style={styles.value}>{student.studentId || "N/A"}</Text>
                      </View>
                      <View style={styles.dataBoxThird}>
                        <Text style={styles.label}>Class</Text>
                        <Text style={styles.value}>{safeClass || "N/A"}</Text>
                      </View>
                      <View style={styles.dataBoxThird}>
                        <Text style={styles.label}>Roll No</Text>
                        <Text style={styles.value}>{student.rollNumber || "N/A"}</Text>
                      </View>

                      <View style={styles.dataBoxHalf}>
                        <Text style={styles.label}>Starting Date</Text>
                        <Text style={styles.value}>{formattedDate}</Text>
                      </View>
                      
                      {/* Optional Time Field handling */}
                      {examData.examTime && (
                        <View style={styles.dataBoxHalf}>
                          <Text style={styles.label}>Time</Text>
                          <Text style={styles.value}>{examData.examTime}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Footer (Signatures) */}
                  <View style={styles.footer}>
                    <View style={styles.signatureBox}>
                      {classSign ? (
                        <Image src={classSign} style={styles.signatureImage} />
                      ) : (
                        <View style={styles.signaturePlaceholder} />
                      )}
                      <View style={styles.signatureLine} />
                      <Text style={styles.signatureText}>Class Teacher</Text>
                    </View>

                    <View style={styles.signatureBox}>
                      {PRINCIPAL_SIGN ? (
                        <Image src={PRINCIPAL_SIGN} style={styles.signatureImage} />
                      ) : (
                        <View style={styles.signaturePlaceholder} />
                      )}
                      <View style={styles.signatureLine} />
                      <Text style={styles.signatureText}>Principal</Text>
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