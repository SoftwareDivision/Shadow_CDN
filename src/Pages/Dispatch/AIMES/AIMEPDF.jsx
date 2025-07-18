import React, { useEffect, useState } from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';


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
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 5,
	},
	subHeader: {
		textAlign: 'center',
		fontSize: 10,
		fontStyle: 'italic',
		marginBottom: 10,
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

const AIMEPDF = ({ AIMEData }) => {

	const ReportData = AIMEData;
	const firstItem = ReportData?.Products?.[0];

	console.log("firstItem", firstItem);

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
			<Page size="A4" orientation="portrait" style={styles.page}>
				<View style={styles.container}>
					<Text style={styles.header}>Advance Intimation of Movement of Explosives for Sale</Text>
					<Text style={styles.subHeader}>
						(To be Submitted by consignor to police Authorities prior to dispatch of explosives)
					</Text>

					<View style={styles.contentWrapper}>
						<View style={styles.infoCard}>
							<View style={styles.infoRow}>
								<View style={styles.infoColumn}>
									{/* <Text style={styles.infoLabel}>Date</Text> */}
									<Text style={styles.infoValue}>{ReportData.ReportDataNo || 'N/A'}</Text>
								</View>
								<View style={styles.infoColumn}>
									<Text style={styles.infoLabel}>Date</Text>
									<Text style={styles.infoValue}>{formatDate(ReportData.mfgdt)}</Text>
								</View>
							</View>
							<View style={styles.infoRow}>
								<View style={styles.infoColumn}>
									<Text style={styles.infoLabel}>Transporter</Text>
									<Text style={styles.infoValue}>{ReportData.tName || 'N/A'}</Text>
								</View>
								<View style={styles.infoColumn}>
									<Text style={styles.infoLabel}>License No</Text>
									<Text style={styles.infoValue}>{ReportData.truckLic || 'N/A'}</Text>
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
									<Text>{formatDate(ReportData.licVal)}</Text>
								</View>
							</View>
						</View>

						{/* Product Table  */}
						{/* <View style={styles.tableContainer}>
							<Text style={styles.sectionTitle}>Product Details</Text>
							<View>
								<View style={styles.tableHeader}>
									<Text style={[styles.cell, { flex: 1.2 }]}>Brand Name(Brand Id)</Text>
									<Text style={styles.cell}>Class</Text>
									<Text style={styles.cell}>Div</Text>
									<Text style={[styles.cell, styles.rightAlign]}>Quantity</Text>
									<Text style={[styles.cell, styles.rightAlign]}>Unit</Text>
									<Text style={[styles.cell, styles.rightAlign]}>No. Of Packages</Text>
								</View>

								{firstItem?.map((item, idx) => (
									<View key={idx} style={styles.tableRow}>
										<Text style={[styles.cell, { flex: 1.2 }]}>{item.ptype}</Text>
										<Text style={styles.cell}>{item.brandName}</Text>
										<Text style={styles.cell}>{item.psize}</Text>
										<Text style={[styles.cell, styles.rightAlign]}>{item.loadcase}</Text>
										<Text style={[styles.cell, styles.rightAlign]}>{item.loadWt} Kgs</Text>
										<Text style={[styles.cell, styles.rightAlign]}>{item.mag}</Text>
									</View>
								))}
							</View>
						</View> */}

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

export default AIMEPDF;
