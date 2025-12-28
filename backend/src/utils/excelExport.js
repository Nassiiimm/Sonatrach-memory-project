/**
 * Générateur d'export Excel pour les Bons de Commande
 * Utilise ExcelJS pour créer des fichiers Excel professionnels
 */
const ExcelJS = require('exceljs');

// Couleurs Sonatrach
const COLORS = {
  primary: 'FFE31837',      // Rouge Sonatrach
  secondary: 'FF1E3A5F',    // Bleu foncé
  accent: 'FFF7941D',       // Orange
  headerBg: 'FF1E3A5F',
  headerText: 'FFFFFFFF',
  paidBg: 'FFD4EDDA',
  unpaidBg: 'FFFFF3CD',
  totalBg: 'FFE8F4FD'
};

/**
 * Formate une date en français
 */
const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

/**
 * Formate le statut de paiement
 */
const formatPaymentStatus = (status) => {
  return status === 'PAYE' ? 'Payé' : 'Non payé';
};

/**
 * Formate la formule
 */
const formatFormula = (formula) => {
  const formulas = {
    'SEJOUR_SIMPLE': 'Séjour Simple',
    'FORMULE_REPAS': 'Formule Repas',
    'DEMI_PENSION': 'Demi-Pension',
    'PENSION_COMPLETE': 'Pension Complète'
  };
  return formulas[formula] || formula || '-';
};

/**
 * Génère le fichier Excel des Bons de Commande
 * @param {Array} reservations - Liste des réservations avec BC
 * @param {Object} filters - Filtres appliqués (pour le titre)
 * @returns {Promise<Buffer>} - Le fichier Excel sous forme de buffer
 */
const generateBCExcel = async (reservations, filters = {}) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Sonatrach - Système de Réservations';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Bons de Commande', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true
    }
  });

  // Titre du document
  worksheet.mergeCells('A1:L1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'SONATRACH - Liste des Bons de Commande';
  titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: COLORS.secondary } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(1).height = 30;

  // Sous-titre avec date d'export et filtres
  worksheet.mergeCells('A2:L2');
  const subtitleCell = worksheet.getCell('A2');
  let subtitle = `Export du ${formatDate(new Date())}`;
  if (filters.paymentStatus && filters.paymentStatus !== 'ALL') {
    subtitle += ` | Statut: ${formatPaymentStatus(filters.paymentStatus)}`;
  }
  if (filters.region && filters.region !== 'ALL') {
    subtitle += ` | Région: ${filters.region}`;
  }
  subtitleCell.value = subtitle;
  subtitleCell.font = { name: 'Arial', size: 10, italic: true, color: { argb: 'FF666666' } };
  subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Ligne vide
  worksheet.getRow(3).height = 10;

  // En-têtes des colonnes
  const headers = [
    'N° BC',
    'Date BC',
    'Employé',
    'Matricule',
    'Région',
    'Destination',
    'Hôtel',
    'Arrivée',
    'Départ',
    'Nuits',
    'Montant (DZD)',
    'Statut Paiement'
  ];

  const headerRow = worksheet.getRow(4);
  headers.forEach((header, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = header;
    cell.font = { name: 'Arial', size: 10, bold: true, color: { argb: COLORS.headerText } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.headerBg }
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF000000' } },
      left: { style: 'thin', color: { argb: 'FF000000' } },
      bottom: { style: 'thin', color: { argb: 'FF000000' } },
      right: { style: 'thin', color: { argb: 'FF000000' } }
    };
  });
  headerRow.height = 25;

  // Définir les largeurs de colonnes
  worksheet.columns = [
    { width: 18 },  // N° BC
    { width: 12 },  // Date BC
    { width: 25 },  // Employé
    { width: 12 },  // Matricule
    { width: 10 },  // Région
    { width: 20 },  // Destination
    { width: 25 },  // Hôtel
    { width: 12 },  // Arrivée
    { width: 12 },  // Départ
    { width: 8 },   // Nuits
    { width: 15 },  // Montant
    { width: 14 }   // Statut
  ];

  // Données
  let totalAmount = 0;
  let paidAmount = 0;
  let unpaidAmount = 0;

  reservations.forEach((reservation, index) => {
    const rowIndex = index + 5;
    const row = worksheet.getRow(rowIndex);

    const employee = reservation.employee || {};
    const finance = reservation.finance || {};
    const relex = reservation.relex || {};
    const hotel = relex.hotel || {};

    const startDate = relex.finalStartDate || reservation.startDate;
    const endDate = relex.finalEndDate || reservation.endDate;
    const amount = finance.total || 0;

    totalAmount += amount;
    if (finance.paymentStatus === 'PAYE') {
      paidAmount += amount;
    } else {
      unpaidAmount += amount;
    }

    const rowData = [
      finance.bcNumber || '-',
      formatDate(finance.bcGeneratedAt),
      employee.name || finance.employeeSnapshot?.name || '-',
      employee.matricule || finance.employeeSnapshot?.matricule || '-',
      employee.regionAcronym || finance.employeeSnapshot?.regionAcronym || '-',
      reservation.destination || '-',
      hotel.name || '-',
      formatDate(startDate),
      formatDate(endDate),
      finance.nights || '-',
      amount,
      formatPaymentStatus(finance.paymentStatus)
    ];

    rowData.forEach((value, colIndex) => {
      const cell = row.getCell(colIndex + 1);
      cell.value = value;
      cell.font = { name: 'Arial', size: 9 };
      cell.alignment = { horizontal: colIndex === 10 ? 'right' : 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
        right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
      };

      // Coloration selon statut de paiement
      if (colIndex === 11) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: finance.paymentStatus === 'PAYE' ? COLORS.paidBg : COLORS.unpaidBg }
        };
        cell.font = {
          name: 'Arial',
          size: 9,
          bold: true,
          color: { argb: finance.paymentStatus === 'PAYE' ? 'FF155724' : 'FF856404' }
        };
      }

      // Format monétaire pour le montant
      if (colIndex === 10 && typeof value === 'number') {
        cell.numFmt = '#,##0" DZD"';
      }
    });

    // Alternance de couleur de fond
    if (index % 2 === 1) {
      row.eachCell((cell, colNumber) => {
        if (colNumber <= 11) { // Ne pas écraser la couleur du statut
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF8F8F8' }
          };
        }
      });
    }
  });

  // Ligne de totaux
  const totalRowIndex = reservations.length + 5;
  const totalRow = worksheet.getRow(totalRowIndex);

  worksheet.mergeCells(`A${totalRowIndex}:I${totalRowIndex}`);
  const totalLabelCell = totalRow.getCell(1);
  totalLabelCell.value = `TOTAL (${reservations.length} réservations)`;
  totalLabelCell.font = { name: 'Arial', size: 10, bold: true };
  totalLabelCell.alignment = { horizontal: 'right', vertical: 'middle' };
  totalLabelCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.totalBg }
  };

  // Cellule vide pour Nuits
  const nightsCell = totalRow.getCell(10);
  nightsCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.totalBg }
  };

  // Total montant
  const totalAmountCell = totalRow.getCell(11);
  totalAmountCell.value = totalAmount;
  totalAmountCell.numFmt = '#,##0" DZD"';
  totalAmountCell.font = { name: 'Arial', size: 11, bold: true, color: { argb: COLORS.secondary } };
  totalAmountCell.alignment = { horizontal: 'right', vertical: 'middle' };
  totalAmountCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.totalBg }
  };
  totalAmountCell.border = {
    top: { style: 'medium', color: { argb: 'FF000000' } },
    bottom: { style: 'medium', color: { argb: 'FF000000' } }
  };

  // Cellule vide pour statut
  const statusCell = totalRow.getCell(12);
  statusCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.totalBg }
  };

  totalRow.height = 25;

  // Résumé en bas
  const summaryStartRow = totalRowIndex + 2;

  worksheet.getCell(`A${summaryStartRow}`).value = 'Résumé:';
  worksheet.getCell(`A${summaryStartRow}`).font = { name: 'Arial', size: 10, bold: true };

  worksheet.getCell(`A${summaryStartRow + 1}`).value = `Total Payé: ${new Intl.NumberFormat('fr-FR').format(paidAmount)} DZD`;
  worksheet.getCell(`A${summaryStartRow + 1}`).font = { name: 'Arial', size: 9, color: { argb: 'FF155724' } };

  worksheet.getCell(`A${summaryStartRow + 2}`).value = `Total Non Payé: ${new Intl.NumberFormat('fr-FR').format(unpaidAmount)} DZD`;
  worksheet.getCell(`A${summaryStartRow + 2}`).font = { name: 'Arial', size: 9, color: { argb: 'FF856404' } };

  // Générer le buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
};

module.exports = {
  generateBCExcel
};
