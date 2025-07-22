import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

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
	// Header styles
	headerBox: {
		border: '1px solid black',
		padding: 8,
		textAlign: 'center',
		marginBottom: 2,
	},
	headerTitle: {
		fontSize: 12,
		fontWeight: 'bold',
		marginBottom: 2,
	},
	headerSubtitle: {
		fontSize: 9,
		fontStyle: 'italic',
	},

	// Main form styles
	mainBox: {
		border: '1px solid black',
		flexGrow: 1,
	},

	// Row styles
	row: {
		flexDirection: 'row',
		borderBottom: '1px solid black',
		minHeight: 25,
	},

	// Cell styles
	cell: {
		borderRight: '1px solid black',
		padding: 3,
		justifyContent: 'center',
		fontSize: 9,
	},

	// Specific width cells
	serialCell: {
		width: '5%',
		textAlign: 'center',
		fontWeight: 'bold',
	},
	labelCell: {
		width: '35%',
	},
	valueCell: {
		width: '25%',
		backgroundColor: '#f5f5f5',
	},
	dateCell: {
		width: '35%',
		backgroundColor: '#f5f5f5',
	},

	// Table header
	tableHeaderRow: {
		flexDirection: 'row',
		backgroundColor: '#e0e0e0',
		borderBottom: '1px solid black',
		minHeight: 30,
	},
	tableHeaderCell: {
		borderRight: '1px solid black',
		padding: 3,
		justifyContent: 'center',
		fontSize: 8,
		fontWeight: 'bold',
		textAlign: 'center',
	},

	// Table data rows
	tableDataRow: {
		flexDirection: 'row',
		borderBottom: '1px solid black',
		minHeight: 20,
	},
	tableDataCell: {
		borderRight: '1px solid black',
		padding: 3,
		justifyContent: 'center',
		fontSize: 9,
		textAlign: 'center',
	},

	// Reference section
	referenceSection: {
		marginTop: 10,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
	},
	referenceLeft: {
		width: '60%',
		fontSize: 9,
	},
	referenceTitle: {
		fontWeight: 'bold',
		marginBottom: 2,
		fontSize: 10,

	},
	referenceRight: {
		width: '35%',
		alignItems: 'flex-end',
		paddingTop: 15,
	},
	licenseSection: {
		marginTop: 10,
		fontSize: 8,
		lineHeight: 1.2,
	},

	// Copy section
	copySection: {
		marginTop: 15,
		fontSize: 8,
	},
	copyTitle: {
		fontWeight: 'bold',
		marginBottom: 5,
		fontSize: 9,
	},
	copyItem: {
		marginBottom: 3,
		lineHeight: 1.3,
		fontSize: 8,
	},

	// Footer
	footer: {
		textAlign: 'center',
		fontSize: 10,
		marginTop: 20,
	},

	// Special cells for signature
	signatureCell: {
		width: '60%',
		backgroundColor: '#f5f5f5',
	},
});

const AIMEPDF = ({ AIMEData }) => {
	const ReportData = AIMEData;
	const firstItem = ReportData?.Products?.[0];

	console.log("First Item:", ReportData);

	const formatDate = (dateString) => {
		if (!dateString) return '';
		const date = new Date(dateString);
		return date.toLocaleDateString('en-IN', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric',
		});
	};

	return (
		<Document>
			<Page size="A4" orientation="portrait" style={styles.page}>
				<View style={styles.container}>
					{/* Header */}
					<View style={styles.headerBox}>
						<Text style={styles.headerTitle}>
							Advance Intimation of Movement of Explosives for Sale
						</Text>
						<Text style={styles.headerSubtitle}>
							(To be Submitted by consignor to police Authorities prior to dispatch of explosives)
						</Text>
					</View>

					{/* Main Form */}
					<View style={styles.mainBox}>

						{/* Row 1 – serial | AIME | Date */}
						<View style={styles.row}>
							{/* 1️⃣ Serial number -------------------------------------------------- */}
							<View style={[styles.cell, styles.serialCell]}>
								<Text>1.</Text>
							</View>

							{/* 2️⃣ AIME ----------------------------------------------------------- */}
							{/* 45 % + borderRight keeps the second inner line                       */}
							<View style={[styles.cell, { width: '45%', textAlign: 'center' }]}>
								<Text>AIME: {ReportData?.aime_no ?? ''}</Text>
							</View>

							{/* 3️⃣ Date ----------------------------------------------------------- */}
							{/* 50 %, no borderRight → last visible cell                            */}
							<View style={[styles.cell, { width: '50%', borderRight: 'none', textAlign: 'center' }]}>
								<Text>Date: {formatDate(ReportData?.todayDate)}</Text>
							</View>
						</View>


						{/* Row 2 - Expiry */}
						<View style={styles.row}>
							<View style={[styles.cell, styles.serialCell]}>
								<Text>2.</Text>
							</View>
							<View style={[styles.cell, { width: '95%', borderRight: 'none' }]}>
								<Text>This pass covers {ReportData?.totalCases} Packages containing following Explosives :</Text>
							</View>
						</View>

						<View style={[styles.tableBox, { margin: 10, border: '0.5px solid black' }]}>

							{/* Table Header */}
							<View style={styles.tableHeaderRow}>
								<View style={[styles.tableHeaderCell, { width: '5%' }]}>
									<Text>S.No</Text>
								</View>
								<View style={[styles.tableHeaderCell, { width: '25%' }]}>
									<Text>Brand Name(Brand Id)</Text>
								</View>
								<View style={[styles.tableHeaderCell, { width: '10%' }]}>
									<Text>Class</Text>
								</View>
								<View style={[styles.tableHeaderCell, { width: '8%' }]}>
									<Text>Div</Text>
								</View>
								<View style={[styles.tableHeaderCell, { width: '12%' }]}>
									<Text>Quantity</Text>
								</View>
								<View style={[styles.tableHeaderCell, { width: '10%' }]}>
									<Text>Unit</Text>
								</View>
								<View style={[styles.tableHeaderCell, { width: '30%', borderRight: 'none' }]}>
									<Text>No. of Packages</Text>
								</View>
							</View>

							{/* Table Data Rows - Only show products that exist */}
							{ReportData?.Products?.map((product, index) => (
								<View key={index + 1} style={styles.tableDataRow}>
									<View style={[styles.tableDataCell, { width: '5%' }]}>
										<Text>{index + 1}</Text>
									</View>
									<View style={[styles.tableDataCell, { width: '25%', backgroundColor: '#f5f5f5' }]}>
										<Text>{product.ProductName || ''}</Text>
									</View>
									<View style={[styles.tableDataCell, { width: '10%', backgroundColor: '#f5f5f5' }]}>
										<Text>{product.Class || ''}</Text>
									</View>
									<View style={[styles.tableDataCell, { width: '8%', backgroundColor: '#f5f5f5' }]}>
										<Text>{product.Div || ''}</Text>
									</View>
									<View style={[styles.tableDataCell, { width: '12%', backgroundColor: '#f5f5f5' }]}>
										<Text>{product.Netl1 || ''}</Text>
									</View>
									<View style={[styles.tableDataCell, { width: '10%', backgroundColor: '#f5f5f5' }]}>
										<Text>{product.UOM || ''}</Text>
									</View>
									<View style={[styles.tableDataCell, { width: '30%', borderRight: 'none', backgroundColor: '#f5f5f5' }]}>
										<Text>{product.Cases || ''}</Text>
									</View>
								</View>
							)) || []}
						</View>
						{/* Additional form rows */}
						<View style={[styles.row, { borderTop: '1px solid black' }]}>
							<View style={[styles.cell, styles.serialCell]}>
								<Text>3.</Text>
							</View>
							<View style={[styles.cell, { width: '50%' }]}>
								<Text>Name and Address of Consignee's Licence</Text>
							</View>
							<View style={[styles.cell, { width: '45%', borderRight: 'none', backgroundColor: '#f5f5f5' }]}>
								<Text>{ReportData?.consigneeName || ''} , {ReportData?.address || ''}</Text>
							</View>
						</View>

						<View style={styles.row}>
							<View style={[styles.cell, styles.serialCell]}>
								<Text>4.</Text>
							</View>
							<View style={[styles.cell, { width: '50%' }]}>
								<Text>Number and Form of Consignee's Licence</Text>
							</View>
							<View style={[styles.cell, { width: '45%', borderRight: 'none', backgroundColor: '#f5f5f5' }]}>
								<Text>{ReportData?.consigneelicenseno || ''} "LE-3 (Old Form 22)"</Text>
							</View>
						</View>

						<View style={styles.row}>
							<View style={[styles.cell, styles.serialCell]}>
								<Text>5.</Text>
							</View>
							<View style={[styles.cell, { width: '50%' }]}>
								<Text>Consignee's Order number and Date and Quantity of each Explosives Ordered</Text>
							</View>
							<View style={[styles.cell, { width: '45%', borderRight: 'none', backgroundColor: '#f5f5f5' }]}>
								<Text>{firstItem?.order || 'Order No'}</Text>
							</View>
						</View>

						<View style={styles.row}>
							<View style={[styles.cell, styles.serialCell]}>
								<Text>6.</Text>
							</View>
							<View style={[styles.cell, { width: '50%' }]}>
								<Text>Date of Despatch of Consignment</Text>
							</View>
							<View style={[styles.cell, { width: '45%', borderRight: 'none', backgroundColor: '#f5f5f5' }]}>
								<Text>{formatDate(ReportData?.datedisp)}</Text>
							</View>
						</View>

						<View style={styles.row}>
							<View style={[styles.cell, styles.serialCell]}>
								<Text>7.</Text>
							</View>
							<View style={[styles.cell, { width: '50%' }]}>
								<Text>Approximate date on Which Consignment Should reach destination</Text>
							</View>
							<View style={[styles.cell, { width: '45%', borderRight: 'none', backgroundColor: '#f5f5f5' }]}>
								<Text>{formatDate(ReportData?.destinationDate)}</Text>
							</View>
						</View>

						{/* Bottom section with reference and signature */}
						<View style={[styles.row, { minHeight: 120 }]}>
							<View style={[styles.cell, { width: '40%', borderRight: '1px solid black', alignItems: 'flex-center', justifyContent: 'flex-start', padding: 5 }]}>
								<Text style={[styles.referenceTitle, { fontSize: 10, fontWeight: 'bold', textAlign: 'center' }]}>AS PER PESO LETTER NO. R-4</Text>
								<Text style={[styles.referenceTitle, { fontSize: 10, fontWeight: 'bold', textAlign: 'center' }]}>(2)99/MHA/ DATED:30/10/2018</Text>
								<Text style={[styles.referenceTitle, { fontSize: 10, fontWeight: 'bold', textAlign: 'center' }]}>INTIMATED TO FOLLOW RULE 47</Text>
								<Text style={[styles.referenceTitle, { fontSize: 10, fontWeight: 'bold', textAlign: 'center' }]}>OF ER 2008 FOR</Text>
								<Text style={[styles.referenceTitle, { fontSize: 10, fontWeight: 'bold', textAlign: 'center' }]}>TRANSPORTATION OF</Text>
								<Text style={[styles.referenceTitle, { fontSize: 10, fontWeight: 'bold', textAlign: 'center' }]}>EXPLOSIVES.</Text>
							</View>

							<View style={[styles.cell, { width: '60%', borderRight: 'none', padding: 5, justifyContent: 'space-between' }]}>
								{/* License Numbers Section */}
								<View style={{ flex: 1 }}>
									<Text style={{ fontSize: 9, textAlign: 'right', marginBottom: 5 }}>
										Signature of Authorised Person
									</Text>
								</View>

								{/* Signature and Page Number */}
								<View style={{ alignItems: 'flex-start', marginTop: 10 }}>

									<Text style={{ fontSize: 8, marginBottom: 1 }}>
										LicenceNumber  : E/HQ/MH/21/278 (E3368), E/HQ/MH/21/277(E3367), E/HQ/MH/22/270 (E342), E/HQ/MH/21/307 (E3439), E/HQ/MH/22/855 (E71386), E/HQ/MH/21/442 (E32783), E/HQ/MH/21/976(E51793), E/HQ/MH/21/1021 (E67627), E/HQ/MH/21/1023 (E67631), E/HQ/MH/21/1022 (E67633), E/HQ/MH/21/1024 (E67634), E/HQ/MH/22/806 (E60938)E/HQ/MH/21/981 (E60931), E/HQ/MH/21/452(E32802),E/HQ/MH/21/1163/(E125123)
									</Text>
									{/* <Text style={{ fontSize: 8, marginBottom: 1 }}>
										(E342),E/HQ/MH/21/307 (E3439) ,E/HQ/MH/22/855 (E71386),E/HQ/MH/21/442
									</Text>
									<Text style={{ fontSize: 8, marginBottom: 1 }}>
										(E32783),E/HQ/MH/21/976(E51793),E/HQ/MH/21/1021 (E67627), E/HQ/MH/21/1023 (E67631) ,
									</Text>
									<Text style={{ fontSize: 8, marginBottom: 1 }}>
										E/HQ/MH/21/1022 (E67633), E/HQ/MH/21/1024 (E67634),E/HQ/MH/22/806 (E60938)E/HQ/MH/21/981
									</Text>
									<Text style={{ fontSize: 8, marginBottom: 1 }}>
										(E60931),E/HQ/MH/21/452(E32802),E/HQ/MH/21/1163/(E125123)
									</Text> */}

									<Text style={{ fontSize: 8 }}>
										Licence Form:LE-3(Old Form 21)
									</Text>
								</View>
							</View>
						</View>

						{/* Copy Section */}
						<View style={[styles.copySection, { marginTop: 10, marginHorizontal: 10 }]}>
							<Text style={styles.copyTitle}>Copy Forward to:</Text>
							<Text style={styles.copyItem}>
								<Text style={{ fontWeight: 'bold' }}>1. </Text>
								The Jt. Chief Controller of Explosives, West Circles, A1 & A2 wing, 5th Floor, C.G.O. complex,CBD Belapur, Navi Mumbai (M.S.) - 400614 for information.
							</Text>
							<Text style={styles.copyItem}>
								<Text style={{ fontWeight: 'bold' }}>2. </Text>
								Dy. Cheif Controller Of Explosives, Departmental Testing Station, 18 Km Stone, Amravati Road, Gondkhairy Nagpur(M.S) - 440023 For Information
							</Text>
							<Text style={styles.copyItem}>
								<Text style={{ fontWeight: 'bold' }}>3. </Text>
								{ReportData?.office_address}
							</Text>
							<Text style={styles.copyItem}>
								<Text style={{ fontWeight: 'bold' }}>4. </Text>
								District Superitendent of Police of following :
							</Text>
						</View>

						{/* Footer */}
						<View style={[styles.footer, { margin: 10, border: '0.5px solid black' }]}>
							{/* Table Header */}
							<View style={styles.tableHeaderRow}>
								<View style={[styles.tableHeaderCell, { width: '5%' }]}>
									<Text>S.No</Text>
								</View>
								<View style={[styles.tableHeaderCell, { width: '45%' }]}>
									<Text>Location</Text>
								</View>
								<View style={[styles.tableHeaderCell, { width: '50%' }]}>
									<Text>Date</Text>
								</View>
							</View>

							{/* Table Data Rows - Only show products that exist */}
							{ReportData?.routeLocDate?.map((locdate, index) => (
								<View key={index + 1} style={styles.tableDataRow}>
									<View style={[styles.tableDataCell, { width: '5%' }]}>
										<Text>{index + 1}</Text>
									</View>
									<View style={[styles.tableDataCell, { width: '45%', backgroundColor: '#f5f5f5' }]}>
										<Text>{locdate.location || ''}</Text>
									</View>
									<View style={[styles.tableDataCell, { width: '50%', backgroundColor: '#f5f5f5' }]}>
										<Text>{formatDate(locdate.date)}</Text>
									</View>
								</View>
							)) || []}
						</View>
					</View>

				</View>
			</Page>
		</Document>
	);
};

export default AIMEPDF;
