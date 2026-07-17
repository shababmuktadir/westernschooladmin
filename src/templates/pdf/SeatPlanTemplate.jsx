import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

Font.register({
  family: 'NotoSansBengali',
  src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/unhinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf',
});

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// Pure Black & White Theme
const styles = StyleSheet.create({
  page: { 
    padding: 15, 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    alignContent: 'flex-start',
    backgroundColor: '#ffffff'
  },
  cardWrapper: { 
    width: '49%', 
    height: '19%', // Using 19% to easily fit 5 rows per page with margins
    marginBottom: '1.2%', 
    borderWidth: 1, 
    borderStyle: 'dashed', 
    borderColor: '#64748b', 
    padding: 4 
  },
  innerCard: { 
    borderWidth: 2, 
    borderColor: '#000000', 
    height: '100%', 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 6 
  },
  logoBox: { 
    width: '22%', 
    alignItems: 'center', 
    justifyContent: 'center',
    borderRightWidth: 1,
    borderColor: '#000000',
    paddingRight: 6
  },
  logo: { 
    width: 45, 
    height: 45, 
    objectFit: 'contain'
  },
  contentBox: { 
    width: '78%', 
    paddingLeft: 8, 
    justifyContent: 'center' 
  },
  schoolName: { 
    fontSize: 10, 
    fontWeight: 'extrabold', 
    color: '#000000', 
    textTransform: 'uppercase',
    marginBottom: 2 
  },
  examName: { 
    fontFamily: 'NotoSansBengali',
    fontSize: 8, 
    fontWeight: 'bold', 
    color: '#000000', 
    backgroundColor: '#f1f5f9', // Very light gray
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginBottom: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#000000'
  },
  studentName: { 
    fontFamily: 'NotoSansBengali',
    fontSize: 10, 
    fontWeight: 'bold', 
    color: '#000000',
    marginBottom: 3
  },
  infoRow: { 
    flexDirection: 'row', 
    gap: 10,
    marginTop: 2
  },
  label: { 
    fontSize: 8, 
    color: '#334155' 
  },
  value: { 
    fontSize: 9, 
    fontWeight: 'extrabold', 
    color: '#000000' 
  }
});

export default function SeatPlanTemplate({ students, examData, schoolConfig }) {
  const pages = chunkArray(students, 10); // 10 Cards per page

  return (
    <Document>
      {pages.map((pageStudents, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          
          {pageStudents.map((student, idx) => (
            <View key={idx} style={styles.cardWrapper}>
              <View style={styles.innerCard}>
                
                {/* Logo Section */}
                <View style={styles.logoBox}>
                  {schoolConfig.schoolLogo && (
                    <Image src={{ uri: schoolConfig.schoolLogo, method: 'GET', headers: {}, body: '' }} style={styles.logo} />
                  )}
                </View>

                {/* Details Section */}
                <View style={styles.contentBox}>
                  <Text style={styles.schoolName}>{schoolConfig.schoolName}</Text>
                  <Text style={styles.examName}>{examData.examName}</Text>
                  
                  <Text style={styles.studentName}>
                    {student.fullName || `${student.firstName || ''} ${student.lastName || ''}`.trim() || "Name Missing"}
                  </Text>
                  
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>ID: <Text style={styles.value}>{student.studentId || "N/A"}</Text></Text>
                    <Text style={styles.label}>Class: <Text style={styles.value}>{student.class}</Text></Text>
                    <Text style={styles.label}>Roll: <Text style={styles.value}>{student.rollNumber}</Text></Text>
                  </View>
                </View>
                
              </View>
            </View>
          ))}
          
        </Page>
      ))}
    </Document>
  );
}