import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { format } from "date-fns";

Font.register({
  family: 'NotoSansBengali',
  src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/unhinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf',
});

const styles = StyleSheet.create({
  page: {
    paddingTop: 120, // Blank header space for pre-printed pad
    paddingBottom: 50,
    paddingHorizontal: 60,
    backgroundColor: '#ffffff',
    position: 'relative'
  },
  watermarkContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  watermark: {
    width: 350,
    opacity: 0.08, // Low opacity watermark
  },
  // Testimonial Styles
  titleBn: {
    fontFamily: 'NotoSansBengali',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    textDecoration: 'underline',
    marginBottom: 20,
  },
  dateBn: {
    fontFamily: 'NotoSansBengali',
    fontSize: 12,
    marginBottom: 20,
  },
  paragraphBn: {
    fontFamily: 'NotoSansBengali',
    fontSize: 14,
    lineHeight: 1.8,
    textAlign: 'justify',
    marginBottom: 15,
  },
  footerBn: {
    fontFamily: 'NotoSansBengali',
    fontSize: 12,
    marginTop: 60,
    lineHeight: 1.5,
  },
  // TC Styles
  tcHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
  },
  titleEn: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    textDecoration: 'underline',
    marginBottom: 20,
  },
  paragraphEn: {
    fontSize: 13,
    fontFamily: 'Helvetica',
    lineHeight: 1.8,
    textAlign: 'justify',
    marginBottom: 15,
  },
  tcFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 60,
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    lineHeight: 1.5,
  }
});

// 1. Testimonial Template (প্রত্যয়ন পত্র)
export const TestimonialTemplate = ({ student, date, schoolConfig }) => {
  const isMale = student.gender === "Male";
  const studentType = isMale ? "ছাত্র" : "ছাত্রী";
  const formattedDate = date ? format(new Date(date), "dd/MM/yyyy") : "";
  const dobFormatted = student.dateOfBirth ? format(new Date(student.dateOfBirth), "dd/MM/yyyy") : "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.watermarkContainer}>
          {schoolConfig?.schoolLogo && <Image src={{ uri: schoolConfig.schoolLogo, method: 'GET', headers: {}, body: '' }} style={styles.watermark} />}
        </View>

        <Text style={styles.titleBn}>প্রত্যয়ন পত্র</Text>
        <Text style={styles.dateBn}>তারিখ: {formattedDate}ইং</Text>
        
        <Text style={styles.paragraphBn}>
          এত দ্বারা প্রত্যয়ন করা যাচ্ছে যে, {student.fullName}, পিতা: {student.fatherName || "----------------"}, মাতা: {student.motherName || "----------------"}, ঠিকানা: {student.address || "----------------"}। সে অত্র প্রতিষ্ঠানের {student.class} শ্রেণির একজন নিয়মিত {studentType}। বিদ্যালয়ের ভর্তি রেজিস্টার অনুযায়ী তার জন্ম তারিখ {dobFormatted}ইং।
        </Text>
        
        <Text style={styles.paragraphBn}>
          আমার জানা মতে, সে বিদ্যালয়ের নিয়ম-কানুন মেনে চলে। আমি তার ভবিষ্যৎ জীবনের সাফল্য কামনা করি।
        </Text>

        <View style={styles.footerBn}>
          <Text>অধ্যাপক ফজলুল করিম</Text>
          <Text>অধ্যক্ষ</Text>
          <Text>{schoolConfig?.schoolName || "ওয়েস্টার্ন স্কুল এন্ড কলেজ"}</Text>
        </View>
      </Page>
    </Document>
  );
};

// 2. Transfer Certificate Template (TC)
export const TCTemplate = ({ student, formData, schoolConfig }) => {
  const isMale = student.gender === "Male";
  const pHeShe = isMale ? "He" : "She";
  const phisHer = isMale ? "his" : "her";
  const pHimHer = isMale ? "him" : "her";
  const pSonDaughter = isMale ? "Son" : "Daughter";
  const pHimselfHerself = isMale ? "himself" : "herself";
  
  const dobFormatted = student.dateOfBirth ? format(new Date(student.dateOfBirth), "dd/MM/yyyy") : "";
  const tcDate = formData.date ? format(new Date(formData.date), "dd/MM/yyyy") : "";
  const dueDate = formData.dueDate ? format(new Date(formData.dueDate), "dd/MM/yyyy") : "";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.watermarkContainer}>
          {schoolConfig?.schoolLogo && <Image src={{ uri: schoolConfig.schoolLogo, method: 'GET', headers: {}, body: '' }} style={styles.watermark} />}
        </View>

        <View style={styles.tcHeader}>
          <Text>WSC-TC-NO: {formData.tcNo}</Text>
          <Text>Date: {tcDate}</Text>
        </View>

        <Text style={styles.titleEn}>TRANSFER CERTIFICATE</Text>

        <Text style={styles.paragraphEn}>
          This is to certify that {student.fullName} {pSonDaughter} of {student.fatherName || "___________"} & {student.motherName || "___________"}. Present address: {formData.presentAddress || "___________"}. Parmanent address: {formData.permanentAddress || "___________"}. {phisHer} date of birth as recorded in the admission register was {dobFormatted}. {pHeShe.toLowerCase()} was reading in class {student.class}. All sums due by {pHimselfHerself} have been paid up to {dueDate}. {pHeShe} bears a good moral character.
        </Text>
        
        <Text style={styles.paragraphEn}>
          I wish {pHimHer} every success in life.
        </Text>

        <View style={styles.tcFooter}>
          <View>
            <Text style={{ marginTop: 40 }}>WRITTEN BY: MUKTADIR SHABAB</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text>FAZLUL KARIM,</Text>
            <Text>Principal,</Text>
            <Text>{schoolConfig?.schoolName || "Western School & College"},</Text>
            <Text>Didar market, Ctg.</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};