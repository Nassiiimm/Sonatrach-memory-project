const nodemailer = require('nodemailer');

// Create transporter based on environment
const createTransporter = () => {
  // In development, log emails instead of sending
  if (process.env.NODE_ENV !== 'production' && !process.env.SMTP_HOST) {
    return null; // Will log instead of send
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = createTransporter();
  }
  return transporter;
};

// Email templates
const templates = {
  requestCreated: (data) => ({
    subject: `[StayFlow] Nouvelle demande d'hebergement - ${data.destination}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">StayFlow - Sonatrach</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333;">Nouvelle demande d'hebergement</h2>
          <p>Une nouvelle demande a ete soumise et necessite votre validation.</p>

          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Employe:</strong> ${data.employeeName}</p>
            <p><strong>Destination:</strong> ${data.destination}</p>
            <p><strong>Ville:</strong> ${data.city}</p>
            <p><strong>Du:</strong> ${data.startDate}</p>
            <p><strong>Au:</strong> ${data.endDate}</p>
            ${data.motif ? `<p><strong>Motif:</strong> ${data.motif}</p>` : ''}
          </div>

          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/approvals"
               style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir la demande
            </a>
          </p>
        </div>
        <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
          Cet email a ete envoye automatiquement par StayFlow.
        </div>
      </div>
    `
  }),

  requestApproved: (data) => ({
    subject: `[StayFlow] Demande approuvee - ${data.destination}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #22c55e; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">StayFlow - Sonatrach</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #22c55e;">Demande approuvee</h2>
          <p>Votre demande d'hebergement a ete approuvee par votre manager.</p>

          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Destination:</strong> ${data.destination}</p>
            <p><strong>Ville:</strong> ${data.city}</p>
            <p><strong>Du:</strong> ${data.startDate}</p>
            <p><strong>Au:</strong> ${data.endDate}</p>
          </div>

          <p>Votre demande a ete transmise au service Relex pour traitement.</p>

          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/requests"
               style="background: #22c55e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir mes demandes
            </a>
          </p>
        </div>
        <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
          Cet email a ete envoye automatiquement par StayFlow.
        </div>
      </div>
    `
  }),

  requestRejected: (data) => ({
    subject: `[StayFlow] Demande refusee - ${data.destination}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #ef4444; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">StayFlow - Sonatrach</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #ef4444;">Demande refusee</h2>
          <p>Votre demande d'hebergement a ete refusee.</p>

          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Destination:</strong> ${data.destination}</p>
            <p><strong>Ville:</strong> ${data.city}</p>
            <p><strong>Du:</strong> ${data.startDate}</p>
            <p><strong>Au:</strong> ${data.endDate}</p>
            ${data.comment ? `<p><strong>Motif du refus:</strong> ${data.comment}</p>` : ''}
          </div>

          <p>Pour toute question, veuillez contacter votre manager.</p>
        </div>
        <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
          Cet email a ete envoye automatiquement par StayFlow.
        </div>
      </div>
    `
  }),

  requestReserved: (data) => ({
    subject: `[StayFlow] Reservation confirmee - ${data.hotelName}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">StayFlow - Sonatrach</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #22c55e;">Reservation confirmee</h2>
          <p>Votre reservation a ete confirmee par le service Relex.</p>

          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Hotel:</strong> ${data.hotelName}</p>
            <p><strong>Ville:</strong> ${data.city}</p>
            <p><strong>Du:</strong> ${data.startDate}</p>
            <p><strong>Au:</strong> ${data.endDate}</p>
            <p><strong>Formule:</strong> ${data.formula}</p>
            <p><strong>N BC:</strong> ${data.bcNumber}</p>
          </div>

          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/requests"
               style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Voir ma reservation
            </a>
          </p>
        </div>
        <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
          Cet email a ete envoye automatiquement par StayFlow.
        </div>
      </div>
    `
  }),

  newRequestForRelex: (data) => ({
    subject: `[StayFlow] Nouvelle demande a traiter - ${data.destination}`,
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f97316; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">StayFlow - Sonatrach</h1>
        </div>
        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333;">Nouvelle demande a traiter</h2>
          <p>Une demande a ete validee par le manager et necessite votre traitement.</p>

          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Employe:</strong> ${data.employeeName}</p>
            <p><strong>Region:</strong> ${data.region}</p>
            <p><strong>Destination:</strong> ${data.destination}</p>
            <p><strong>Ville:</strong> ${data.city}</p>
            <p><strong>Du:</strong> ${data.startDate}</p>
            <p><strong>Au:</strong> ${data.endDate}</p>
          </div>

          <p style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:8080'}/relex"
               style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Traiter la demande
            </a>
          </p>
        </div>
        <div style="padding: 15px; text-align: center; color: #666; font-size: 12px;">
          Cet email a ete envoye automatiquement par StayFlow.
        </div>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, templateName, data) => {
  try {
    const template = templates[templateName];
    if (!template) {
      console.error(`Email template '${templateName}' not found`);
      return false;
    }

    const { subject, html } = template(data);
    const transport = getTransporter();

    // In development without SMTP, just log
    if (!transport) {
      console.log('========== EMAIL (DEV MODE) ==========');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Template:', templateName);
      console.log('Data:', JSON.stringify(data, null, 2));
      console.log('======================================');
      return true;
    }

    await transport.sendMail({
      from: process.env.SMTP_FROM || '"StayFlow Sonatrach" <noreply@sonatrach.dz>',
      to,
      subject,
      html
    });

    console.log(`Email sent successfully to ${to} (${templateName})`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Notify manager of new request
const notifyManagerNewRequest = async (request, managerEmail) => {
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');

  return sendEmail(managerEmail, 'requestCreated', {
    employeeName: request.employee?.name || 'Employe',
    destination: request.destination,
    city: request.city,
    startDate: formatDate(request.startDate),
    endDate: formatDate(request.endDate),
    motif: request.motif
  });
};

// Notify employee of approval
const notifyEmployeeApproved = async (request, employeeEmail) => {
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');

  return sendEmail(employeeEmail, 'requestApproved', {
    destination: request.destination,
    city: request.city,
    startDate: formatDate(request.startDate),
    endDate: formatDate(request.endDate)
  });
};

// Notify employee of rejection
const notifyEmployeeRejected = async (request, employeeEmail, comment) => {
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');

  return sendEmail(employeeEmail, 'requestRejected', {
    destination: request.destination,
    city: request.city,
    startDate: formatDate(request.startDate),
    endDate: formatDate(request.endDate),
    comment
  });
};

// Notify Relex of new request to process
const notifyRelexNewRequest = async (request, relexEmails) => {
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');

  const promises = relexEmails.map(email =>
    sendEmail(email, 'newRequestForRelex', {
      employeeName: request.employee?.name || 'Employe',
      region: request.regionAcronym,
      destination: request.destination,
      city: request.city,
      startDate: formatDate(request.startDate),
      endDate: formatDate(request.endDate)
    })
  );

  return Promise.all(promises);
};

// Notify employee of reservation confirmation
const notifyEmployeeReserved = async (request, employeeEmail, hotel, bcNumber) => {
  const formatDate = (d) => new Date(d).toLocaleDateString('fr-FR');

  const formulaLabels = {
    'SEJOUR_SIMPLE': 'Sejour simple',
    'FORMULE_REPAS': 'Formule repas',
    'DEMI_PENSION': 'Demi-pension',
    'PENSION_COMPLETE': 'Pension complete'
  };

  return sendEmail(employeeEmail, 'requestReserved', {
    hotelName: hotel.name,
    city: hotel.city,
    startDate: formatDate(request.relex?.finalStartDate || request.startDate),
    endDate: formatDate(request.relex?.finalEndDate || request.endDate),
    formula: formulaLabels[request.relex?.formula] || request.relex?.formula,
    bcNumber
  });
};

module.exports = {
  sendEmail,
  notifyManagerNewRequest,
  notifyEmployeeApproved,
  notifyEmployeeRejected,
  notifyRelexNewRequest,
  notifyEmployeeReserved
};
