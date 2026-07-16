
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: {
        padding: 30,
        backgroundColor: "#FAF9F5",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },
    outerBorder: {
        borderWidth: 4,
        borderColor: "#D4AF37",
        borderStyle: "solid",
        width: "100%",
        height: "100%",
        padding: 5,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    },
    innerBorder: {
        borderWidth: 1,
        borderColor: "#D4AF37",
        borderStyle: "solid",
        width: "100%",
        height: "100%",
        padding: 30,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
    },
    headerContainer: {
        alignItems: "center",
        marginBottom: 10,
    },
    academyName: {
        fontSize: 14,
        fontFamily: "Helvetica-Bold",
        color: "#1E293B",
        letterSpacing: 6,
        textTransform: "uppercase",
    },
    dividerGold: {
        width: 80,
        height: 2,
        backgroundColor: "#D4AF37",
        marginTop: 6,
        marginBottom: 6,
    },
    certTitle: {
        fontSize: 32,
        fontFamily: "Times-Bold",
        color: "#1E293B",
        letterSpacing: 2,
        textTransform: "uppercase",
        textAlign: "center",
        marginVertical: 10,
    },
    certSubText: {
        fontSize: 11,
        fontFamily: "Helvetica-Oblique",
        color: "#64748B",
        marginBottom: 12,
    },
    recipientName: {
        fontSize: 28,
        fontFamily: "Times-Bold",
        color: "#B45309",
        textAlign: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#CBD5E1",
        paddingBottom: 6,
        minWidth: 320,
        marginBottom: 15,
    },
    descriptionText: {
        fontSize: 12,
        fontFamily: "Helvetica",
        color: "#475569",
        textAlign: "center",
        lineHeight: 1.6,
        maxWidth: 500,
        marginBottom: 25,
    },
    quizTitle: {
        fontFamily: "Helvetica-Bold",
        color: "#1E293B",
    },
    scoreHighlight: {
        fontFamily: "Helvetica-Bold",
        color: "#16A34A",
    },
    footerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
        width: "100%",
        marginTop: 10,
    },
    signatureBlock: {
        alignItems: "center",
        width: 160,
    },
    sigValue: {
        fontSize: 12,
        fontFamily: "Times-Bold",
        color: "#334155",
        marginBottom: 4,
    },
    sigLine: {
        width: "100%",
        height: 1,
        backgroundColor: "#94A3B8",
        marginBottom: 4,
    },
    sigLabel: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: "#64748B",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    sealBlock: {
        alignItems: "center",
        justifyContent: "center",
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        borderColor: "#D4AF37",
        backgroundColor: "#FEF3C7",
        position: "relative",
    },
    sealInnerCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        borderWidth: 1,
        borderStyle: "dashed",
        borderColor: "#D4AF37",
        alignItems: "center",
        justifyContent: "center",
    },
    sealText: {
        fontSize: 7,
        fontFamily: "Helvetica-Bold",
        color: "#B45309",
        textAlign: "center",
    },
    credBlock: {
        alignItems: "center",
        width: 160,
    },
    credValue: {
        fontSize: 9,
        fontFamily: "Courier-Bold",
        color: "#B45309",
        marginBottom: 5,
    },
    credLabel: {
        fontSize: 8,
        fontFamily: "Helvetica-Bold",
        color: "#64748B",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
});

const CertificatePDF = ({ cert, profileName }) => {
    const formattedDate = cert.issued_at
        ? new Date(cert.issued_at).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
        })
        : new Date().toLocaleDateString();

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.outerBorder}>
                    <View style={styles.innerBorder}>
                        {/* Header */}
                        <View style={styles.headerContainer}>
                            <Text style={styles.academyName}>Quivio Academy</Text>
                            <View style={styles.dividerGold} />
                            <Text style={styles.certSubText}>Certificate of Accomplishment</Text>
                        </View>

                        {/* Title */}
                        <Text style={styles.certTitle}>Certificate of Completion</Text>
                        
                        <Text style={styles.certSubText}>This is proudly presented to</Text>

                        {/* Recipient */}
                        <Text style={styles.recipientName}>{profileName || "Valued Student"}</Text>

                        {/* Description */}
                        <Text style={styles.descriptionText}>
                            for successfully demonstrating academic excellence and passing the assessment in the course{" "}
                            <Text style={styles.quizTitle}>"{cert.quiz?.title || "Assessment Course"}"</Text>{" "}
                            with a score of{" "}
                            <Text style={styles.scoreHighlight}>{cert.score}%</Text>.
                        </Text>

                        {/* Footer details */}
                        <View style={styles.footerContainer}>
                            {/* Left Signature */}
                            <View style={styles.signatureBlock}>
                                <Text style={styles.sigValue}>Quivio Evaluation Board</Text>
                                <View style={styles.sigLine} />
                                <Text style={styles.sigLabel}>Authorized signature</Text>
                            </View>

                            {/* Middle Seal */}
                            <View style={styles.sealBlock}>
                                <View style={styles.sealInnerCircle}>
                                    <Text style={styles.sealText}>OFFICIAL</Text>
                                    <Text style={styles.sealText}>SEAL</Text>
                                    <Text style={styles.sealText}>★ VERIFIED ★</Text>
                                </View>
                            </View>

                            {/* Right Verification Code & Date */}
                            <View style={styles.credBlock}>
                                <Text style={styles.credValue}>{cert.certificate_code || "N/A"}</Text>
                                <View style={styles.sigLine} />
                                <Text style={styles.credLabel}>Issued on {formattedDate}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </Page>
        </Document>
    );
};

export default CertificatePDF;
