import React, { useEffect, useState } from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import QRCode from 'qrcode';

const styles = StyleSheet.create({
	page: {
		padding: 20,
		fontSize: 10,
		fontFamily: 'Helvetica',
		backgroundColor: '#ffffff',
	},
	container: {
		flexDirection: 'column',
		flexGrow: 1,
	},
	header: {
		textAlign: 'center',
		marginBottom: 15,
		fontSize: 18,
		fontWeight: 'bold',
		color: '#2c3e50',
		textTransform: 'uppercase',
		borderBottomWidth: 2,
		borderBottomColor: '#3498db',
		paddingBottom: 8,
	},
	contentWrapper: {
		flexDirection: 'row',
		flexGrow: 1,
		flexWrap: 'wrap',
		marginBottom: 10,
	},
	leftSection: {
		width: '85%',
		paddingRight: 10,
	},
	rightSection: {
		width: '15%',
		alignItems: 'center',
	},
	infoCard: {
		backgroundColor: '#f8f9fa',
		borderRadius: 4,
		padding: 10,
		marginBottom: 12,
		borderLeftWidth: 3,
		borderLeftColor: '#3498db',
	},
	infoRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 6,
	},
	infoColumn: {
		width: '48%',
	},
	infoLabel: {
		fontWeight: 'bold',
		color: '#7f8c8d',
		fontSize: 9,
		marginBottom: 2,
	},
	infoValue: {
		color: '#2c3e50',
		fontSize: 10,
	},
	sectionTitle: {
		fontWeight: 'bold',
		marginBottom: 6,
		color: '#2c3e50',
		fontSize: 10,
	},
	indentDetails: {
		backgroundColor: '#f8f9fa',
		padding: 8,
		borderRadius: 4,
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	tableContainer: {
		flexGrow: 1,
		marginBottom: 12,
	},
	tableHeader: {
		flexDirection: 'row',
		backgroundColor: '#3498db',
		color: 'white',
		fontWeight: 'bold',
		paddingVertical: 6,
		fontSize: 9,
	},
	tableRow: {
		flexDirection: 'row',
		borderBottomWidth: 0.5,
		borderBottomColor: '#e0e0e0',
		paddingVertical: 5,
		backgroundColor: '#ffffff',
		fontSize: 9,
	},
	cell: {
		paddingHorizontal: 4,
		paddingVertical: 3,
		flex: 1,
		overflow: 'hidden',
	},
	rightAlign: {
		textAlign: 'right',
	},
	centerAlign: {
		textAlign: 'center',
	},
	qrContainer: {
		borderWidth: 1,
		borderColor: '#e0e0e0',
		padding: 10,
		borderRadius: 4,
		alignItems: 'center',
		marginBottom: 15,
		width: '100%',
	},
	qrImage: {
		width: 120,
		height: 120,
	},
	qrText: {
		marginTop: 5,
		fontSize: 8,
		color: '#7f8c8d',
		textAlign: 'center',
	},
	statusBadge: {
		paddingHorizontal: 8,
		paddingVertical: 2,
		borderRadius: 10,
		fontSize: 9,
		fontWeight: 'bold',
		textTransform: 'uppercase',
		alignSelf: 'center',
	},
	statusPending: {
		backgroundColor: '#f39c12',
		color: 'white',
	},
	statusCompleted: {
		backgroundColor: '#27ae60',
		color: 'white',
	},
	signatureArea: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 15,
		paddingTop: 10,
		borderTopWidth: 0.5,
		borderTopColor: '#bdc3c7',
	},
	signatureBox: {
		width: '30%',
		textAlign: 'center',
		fontSize: 9,
	},
	footer: {
		textAlign: 'center',
		fontSize: 8,
		color: '#95a5a6',
		borderTopWidth: 0.5,
		borderTopColor: '#ecf0f1',
		paddingTop: 5,
		marginTop: 'auto',
	},
});

const LoadingSheetPDF = ({ LoadingDeatils }) => {
	const [qrCode, setQrCode] = useState('');
	const loadingSheet = LoadingDeatils;
	const firstItem = loadingSheet?.indentDetails?.[0];

	useEffect(() => {
		if (loadingSheet?.loadingSheetNo) {
			QRCode.toDataURL(loadingSheet.loadingSheetNo)
				.then(setQrCode)
				.catch((err) => console.error('QR generation error:', err));
		}
	}, [loadingSheet]);

	if (!firstItem) return null;

	const getStatusStyle = (status) => {
		switch (status) {
			case 0:
				return [styles.statusBadge, styles.statusPending];
			case 1:
			case 2:
				return [styles.statusBadge, styles.statusCompleted];
			default:
				return [styles.statusBadge, styles.statusPending];
		}
	};

	const formatDate = (dateString) => {
		if (!dateString) return 'N/A';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-IN', {
			day: '2-digit',
			month: 'short',
			year: 'numeric',
		});
	};

	return (
		<Document>
			<Page size="A4" orientation="landscape" style={styles.page}>
				<View style={styles.container}>
					<Text style={styles.header}>Loading Sheet</Text>

					<View style={styles.contentWrapper}>
						<View style={styles.leftSection}>
							<View style={styles.infoCard}>
								<View style={styles.infoRow}>
									<View style={styles.infoColumn}>
										<Text style={styles.infoLabel}>Loading Sheet No</Text>
										<Text style={styles.infoValue}>{loadingSheet.loadingSheetNo || 'N/A'}</Text>
									</View>
									<View style={styles.infoColumn}>
										<Text style={styles.infoLabel}>Date</Text>
										<Text style={styles.infoValue}>{formatDate(loadingSheet.mfgdt)}</Text>
									</View>
								</View>
								<View style={styles.infoRow}>
									<View style={styles.infoColumn}>
										<Text style={styles.infoLabel}>Transporter</Text>
										<Text style={styles.infoValue}>{loadingSheet.tName || 'N/A'}</Text>
									</View>
									<View style={styles.infoColumn}>
										<Text style={styles.infoLabel}>License No</Text>
										<Text style={styles.infoValue}>{loadingSheet.truckLic || 'N/A'}</Text>
									</View>
								</View>
								<View style={styles.infoRow}>
									<View style={styles.infoColumn}>
										<Text style={styles.infoLabel}>Truck No</Text>
										<Text style={styles.infoValue}>{loadingSheet.truckNo || 'N/A'}</Text>
									</View>
									<View style={styles.infoColumn}>
										<Text style={styles.infoLabel}>License No</Text>
										<Text style={styles.infoValue}>{loadingSheet.truckLic || 'N/A'}</Text>
									</View>
								</View>
							</View>

							<View>
								<Text style={styles.sectionTitle}>Indent Details</Text>
								<View style={styles.indentDetails}>
									<View>
										<Text style={styles.infoLabel}>Indent No</Text>
										<Text>{firstItem.indentNo}</Text>
									</View>
									<View>
										<Text style={styles.infoLabel}>Indent Date</Text>
										<Text>{formatDate(firstItem.indentDt)}</Text>
									</View>
									<View>
										<Text style={styles.infoLabel}>License Valid</Text>
										<Text>{formatDate(loadingSheet.licVal)}</Text>
									</View>
								</View>
							</View>

							<View style={styles.tableContainer}>
								<Text style={styles.sectionTitle}>Product Details</Text>
								<View>
									<View style={styles.tableHeader}>
										<Text style={[styles.cell, { flex: 1.2 }]}>Product</Text>
										<Text style={styles.cell}>Brand</Text>
										<Text style={styles.cell}>Size</Text>
										<Text style={[styles.cell, styles.rightAlign]}>Cases</Text>
										<Text style={[styles.cell, styles.rightAlign]}>Weight</Text>
										<Text style={[styles.cell, styles.rightAlign]}>Magazine</Text>
										<Text style={[styles.cell, styles.rightAlign]}>Type of Dispatch</Text>
									</View>

									{loadingSheet.indentDetails.map((item, idx) => (
										<View key={idx} style={styles.tableRow}>
											<Text style={[styles.cell, { flex: 1.2 }]}>{item.ptype}</Text>
											<Text style={styles.cell}>{item.bname}</Text>
											<Text style={styles.cell}>{item.psize}</Text>
											<Text style={[styles.cell, styles.rightAlign]}>{item.loadcase}</Text>
											<Text style={[styles.cell, styles.rightAlign]}>{item.loadWt} Kgs</Text>
											<Text style={[styles.cell, styles.rightAlign]}>{item.mag}</Text>
											<Text style={[styles.cell, styles.rightAlign]}>{item.typeOfDispatch}</Text>
										</View>
									))}
								</View>
							</View>
						</View>

						<View style={styles.rightSection}>
							<View style={styles.qrContainer}>
								{qrCode && <Image src={qrCode} style={styles.qrImage} />}
								<Text style={styles.qrText}>Scan to verify</Text>
								<Text style={styles.qrText}>{loadingSheet.loadingSheetNo}</Text>
							</View>

							<View style={styles.infoCard}>
								<Text style={[styles.infoLabel, { textAlign: 'center' }]}>Status</Text>
								<Text style={[...getStatusStyle(loadingSheet.compflag), { textAlign: 'center' }]}>
									{loadingSheet.compflag === 0 ? 'Pending' : 'Completed'}
								</Text>
							</View>
						</View>
					</View>

					<View style={styles.signatureArea}>
						<View style={styles.signatureBox}>
							<Text>Prepared By</Text>
							<Text style={{ marginTop: 15 }}>_________________________</Text>
						</View>
						<View style={styles.signatureBox}>
							<Text>Checked By</Text>
							<Text style={{ marginTop: 15 }}>_________________________</Text>
						</View>
						<View style={styles.signatureBox}>
							<Text>Driver's Signature</Text>
							<Text style={{ marginTop: 15 }}>_________________________</Text>
						</View>
					</View>

					<View style={styles.footer}>
						<Text>
							Generated on {formatDate(new Date())} • © {new Date().getFullYear()} • Page 1 of 1
						</Text>
					</View>
				</View>
			</Page>
		</Document>
	);
};

export default LoadingSheetPDF;
