const express = require('express');
const { stringify } = require('csv-stringify');
const Request = require('../models/Request');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/export', auth, requireRole(['ADMIN','FINANCE']), async (req, res) => {
  const requests = await Request.find()
    .populate('employee', 'name department region')
    .populate('relex.hotel')
    .sort({ createdAt: -1 });

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="reservations.csv"');

  const stringifier = stringify({
    header: true,
    columns: [
      'createdAt',
      'employeeName',
      'department',
      'region',
      'destination',
      'city',
      'country',
      'startDate',
      'endDate',
      'status',
      'hotel',
      'formula',
      'nights',
      'pricePerNight',
      'total',
      'currency',
      'poNumber'
    ]
  });

  stringifier.pipe(res);

  for (const r of requests) {
    stringifier.write({
      createdAt: r.createdAt,
      employeeName: r.employee?.name,
      department: r.employee?.department,
      region: r.employee?.region,
      destination: r.destination,
      city: r.city,
      country: r.country,
      startDate: r.startDate,
      endDate: r.endDate,
      status: r.status,
      hotel: r.relex?.hotel?.name,
      formula: r.relex?.formula,
      nights: r.finance?.nights,
      pricePerNight: r.finance?.pricePerNight,
      total: r.finance?.total,
      currency: r.finance?.currency,
      poNumber: r.finance?.poNumber
    });
  }

  stringifier.end();
});

module.exports = router;