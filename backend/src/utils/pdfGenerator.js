/**
 * Générateur de Bon de Commande PDF professionnel
 * Utilise PDFKit pour créer des documents PDF structurés
 */
const PDFDocument = require('pdfkit');

// Couleurs Sonatrach
const COLORS = {
  primary: '#E31837',      // Rouge Sonatrach
  secondary: '#1E3A5F',    // Bleu foncé
  accent: '#F7941D',       // Orange
  text: '#333333',
  lightGray: '#F5F5F5',
  mediumGray: '#CCCCCC',
  darkGray: '#666666'
};

/**
 * Génère le numéro de BC unique
 * Format: BC-YYYY-XXXXX (ex: BC-2025-00001)
 */
const generateBCNumber = async (Request) => {
  const year = new Date().getFullYear();
  const prefix = `BC-${year}-`;

  // Trouver le dernier BC de l'année
  const lastRequest = await Request.findOne({
    'finance.bcNumber': { $regex: `^${prefix}` }
  }).sort({ 'finance.bcNumber': -1 });

  let nextNumber = 1;
  if (lastRequest && lastRequest.finance?.bcNumber) {
    const lastNumber = parseInt(lastRequest.finance.bcNumber.split('-').pop(), 10);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${String(nextNumber).padStart(5, '0')}`;
};

/**
 * Dessine l'en-tête du document avec le logo et les infos Sonatrach
 */
const drawHeader = (doc, bcNumber, generationDate) => {
  // Fond de l'en-tête
  doc.rect(0, 0, doc.page.width, 120).fill(COLORS.secondary);

  // Logo placeholder (rectangle avec texte)
  doc.rect(50, 25, 80, 70).fill('#FFFFFF');
  doc.fontSize(10).fillColor(COLORS.primary).text('SONATRACH', 55, 50);
  doc.fontSize(6).fillColor(COLORS.text).text('ENERGIE', 67, 65);

  // Titre principal
  doc.fontSize(22).fillColor('#FFFFFF').text('BON DE COMMANDE', 160, 35);
  doc.fontSize(12).text('Réservation Hébergement', 160, 62);

  // Numéro BC et date
  doc.fontSize(10).fillColor('#FFFFFF');
  doc.text(`N° ${bcNumber}`, 400, 35, { align: 'right', width: 150 });
  doc.text(`Date: ${formatDate(generationDate)}`, 400, 52, { align: 'right', width: 150 });

  // Ligne décorative
  doc.rect(50, 115, doc.page.width - 100, 3).fill(COLORS.primary);
};

/**
 * Dessine une section avec titre
 */
const drawSection = (doc, title, y) => {
  doc.rect(50, y, doc.page.width - 100, 25).fill(COLORS.lightGray);
  doc.fontSize(11).fillColor(COLORS.secondary).text(title, 60, y + 7);
  return y + 30;
};

/**
 * Dessine une ligne d'information
 */
const drawInfoLine = (doc, label, value, y, labelWidth = 150) => {
  doc.fontSize(10).fillColor(COLORS.darkGray).text(label, 60, y);
  doc.fillColor(COLORS.text).text(value || '-', 60 + labelWidth, y);
  return y + 18;
};

/**
 * Dessine un tableau
 */
const drawTable = (doc, headers, rows, startY) => {
  const colWidths = [120, 100, 80, 80, 80];
  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const startX = 60;
  let y = startY;

  // En-tête du tableau
  doc.rect(startX, y, tableWidth, 22).fill(COLORS.secondary);
  doc.fontSize(9).fillColor('#FFFFFF');

  let x = startX;
  headers.forEach((header, i) => {
    doc.text(header, x + 5, y + 6, { width: colWidths[i] - 10 });
    x += colWidths[i];
  });

  y += 22;

  // Lignes du tableau
  rows.forEach((row, rowIndex) => {
    const bgColor = rowIndex % 2 === 0 ? '#FFFFFF' : COLORS.lightGray;
    doc.rect(startX, y, tableWidth, 20).fill(bgColor);

    x = startX;
    doc.fontSize(9).fillColor(COLORS.text);
    row.forEach((cell, i) => {
      doc.text(String(cell), x + 5, y + 5, { width: colWidths[i] - 10 });
      x += colWidths[i];
    });
    y += 20;
  });

  // Bordure du tableau
  doc.rect(startX, startY, tableWidth, y - startY).stroke(COLORS.mediumGray);

  return y + 10;
};

/**
 * Dessine le total
 */
const drawTotal = (doc, total, currency, y) => {
  doc.rect(340, y, 170, 35).fill(COLORS.primary);
  doc.fontSize(12).fillColor('#FFFFFF').text('TOTAL ESTIMÉ', 350, y + 5);
  doc.fontSize(16).text(`${formatNumber(total)} ${currency}`, 350, y + 18);
  return y + 45;
};

/**
 * Dessine le pied de page
 */
const drawFooter = (doc) => {
  const footerY = doc.page.height - 80;

  // Ligne séparatrice
  doc.rect(50, footerY, doc.page.width - 100, 1).fill(COLORS.mediumGray);

  // Coordonnées Sonatrach
  doc.fontSize(8).fillColor(COLORS.darkGray);
  doc.text('SONATRACH - Société Nationale pour la Recherche, la Production, le Transport, la Transformation et la Commercialisation des Hydrocarbures', 50, footerY + 10, { align: 'center', width: doc.page.width - 100 });
  doc.text('Siège Social: Djenane El Malik, Hydra - Alger, Algérie | Tél: +213 21 54 70 00 | www.sonatrach.com', 50, footerY + 22, { align: 'center', width: doc.page.width - 100 });

  // Mention légale
  doc.fontSize(7).fillColor(COLORS.darkGray);
  doc.text('Ce document est généré automatiquement et constitue un bon de commande officiel pour la réservation hébergement.', 50, footerY + 40, { align: 'center', width: doc.page.width - 100 });

  // Numéro de page
  doc.fontSize(8).text('Page 1/1', 50, footerY + 55, { align: 'center', width: doc.page.width - 100 });
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
 * Formate un nombre avec séparateurs de milliers
 */
const formatNumber = (num) => {
  if (!num && num !== 0) return '-';
  return new Intl.NumberFormat('fr-FR').format(num);
};

/**
 * Calcule le nombre de nuits
 */
const calculateNights = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
};

/**
 * Génère le PDF du Bon de Commande
 * @param {Object} request - La demande de réservation (populée)
 * @param {Object} hotel - L'hôtel réservé
 * @param {string} bcNumber - Le numéro de BC
 * @returns {Promise<Buffer>} - Le PDF sous forme de buffer
 */
const generateBCPdf = (request, hotel, bcNumber) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const generationDate = new Date();
      const employee = request.employee;
      const finance = request.finance || {};
      const relex = request.relex || {};

      const startDate = relex.finalStartDate || request.startDate;
      const endDate = relex.finalEndDate || request.endDate;
      const nights = calculateNights(startDate, endDate);

      // En-tête
      drawHeader(doc, bcNumber, generationDate);

      let y = 140;

      // Section Employé
      y = drawSection(doc, 'INFORMATIONS EMPLOYÉ', y);
      y = drawInfoLine(doc, 'Nom complet:', employee?.name || finance.employeeSnapshot?.name || '-', y);
      y = drawInfoLine(doc, 'Matricule:', employee?.matricule || finance.employeeSnapshot?.matricule || '-', y);
      y = drawInfoLine(doc, 'Région:', `${employee?.regionAcronym || finance.employeeSnapshot?.regionAcronym || '-'} - ${employee?.region || finance.employeeSnapshot?.region || ''}`, y);
      y = drawInfoLine(doc, 'Département:', employee?.department || finance.employeeSnapshot?.department || '-', y);
      y = drawInfoLine(doc, 'Service/Imputation:', employee?.serviceImputation || finance.employeeSnapshot?.serviceImputation || '-', y);

      y += 10;

      // Section Séjour
      y = drawSection(doc, 'DÉTAILS DU SÉJOUR', y);
      y = drawInfoLine(doc, 'Destination:', `${request.destination || '-'}, ${request.country || 'Algérie'}`, y);
      y = drawInfoLine(doc, 'Date d\'arrivée:', formatDate(startDate), y);
      y = drawInfoLine(doc, 'Date de départ:', formatDate(endDate), y);
      y = drawInfoLine(doc, 'Nombre de nuits:', String(nights), y);
      if (request.motif) {
        y = drawInfoLine(doc, 'Motif mission:', request.motif, y);
      }

      y += 10;

      // Section Hébergement
      y = drawSection(doc, 'HÉBERGEMENT RÉSERVÉ', y);
      y = drawInfoLine(doc, 'Hôtel:', hotel?.name || '-', y);
      y = drawInfoLine(doc, 'Ville:', hotel?.city || '-', y);
      y = drawInfoLine(doc, 'Code contrat:', hotel?.code || '-', y);
      y = drawInfoLine(doc, 'Type de chambre:', relex.roomType || 'Standard', y);
      y = drawInfoLine(doc, 'Formule:', formatFormula(relex.formula), y);

      y += 15;

      // Tableau récapitulatif
      y = drawSection(doc, 'RÉCAPITULATIF FINANCIER', y);
      y += 5;

      const pricePerNight = finance.pricePerNight || 0;
      const total = finance.total || (nights * pricePerNight);

      const headers = ['Désignation', 'Formule', 'Nuits', 'Prix/Nuit', 'Total'];
      const rows = [
        [
          hotel?.name || 'Hébergement',
          formatFormula(relex.formula),
          String(nights),
          `${formatNumber(pricePerNight)} DZD`,
          `${formatNumber(total)} DZD`
        ]
      ];

      // Ajouter participants si applicable
      const participantsCount = finance.participantsCount || 1;
      if (participantsCount > 1) {
        rows.push([
          `Participants (x${participantsCount})`,
          '-',
          '-',
          '-',
          `${formatNumber(total * participantsCount)} DZD`
        ]);
      }

      y = drawTable(doc, headers, rows, y);

      // Total
      const grandTotal = total * participantsCount;
      y = drawTotal(doc, grandTotal, finance.currency || 'DZD', y);

      // Notes/Observations
      if (relex.comment || request.extraRequests) {
        y += 10;
        y = drawSection(doc, 'OBSERVATIONS', y);
        doc.fontSize(9).fillColor(COLORS.text);
        if (relex.comment) {
          doc.text(`Relex: ${relex.comment}`, 60, y, { width: doc.page.width - 120 });
          y += 15;
        }
        if (request.extraRequests) {
          doc.text(`Demandes spéciales: ${request.extraRequests}`, 60, y, { width: doc.page.width - 120 });
        }
      }

      // Zone signatures
      y = Math.max(y + 30, 620);
      doc.fontSize(9).fillColor(COLORS.darkGray);

      // Signature Relex
      doc.text('Validé par le Service Relex', 60, y);
      doc.rect(60, y + 12, 150, 40).stroke(COLORS.mediumGray);
      doc.text('Date: ' + formatDate(finance.validatedAt || generationDate), 65, y + 55);

      // Signature Employé
      doc.text('Signature Employé', 350, y);
      doc.rect(350, y + 12, 150, 40).stroke(COLORS.mediumGray);

      // Pied de page
      drawFooter(doc);

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Formate le nom de la formule
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

module.exports = {
  generateBCPdf,
  generateBCNumber
};
