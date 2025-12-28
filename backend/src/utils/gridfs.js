/**
 * Configuration MongoDB GridFS pour stockage des fichiers PDF
 */
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const { Readable } = require('stream');

let gfsBucket = null;

/**
 * Initialise le bucket GridFS une fois la connexion MongoDB établie
 */
const initGridFS = () => {
  if (mongoose.connection.readyState === 1) {
    gfsBucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: 'bcPdfs'
    });
    console.log('GridFS bucket initialisé');
  } else {
    mongoose.connection.once('open', () => {
      gfsBucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'bcPdfs'
      });
      console.log('GridFS bucket initialisé');
    });
  }
};

/**
 * Récupère le bucket GridFS
 */
const getGridFSBucket = () => {
  if (!gfsBucket) {
    if (mongoose.connection.readyState === 1) {
      gfsBucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: 'bcPdfs'
      });
    } else {
      throw new Error('GridFS non initialisé - connexion MongoDB requise');
    }
  }
  return gfsBucket;
};

/**
 * Stocke un buffer PDF dans GridFS
 * @param {Buffer} pdfBuffer - Le contenu PDF
 * @param {string} filename - Nom du fichier
 * @param {Object} metadata - Métadonnées additionnelles
 * @returns {Promise<ObjectId>} - L'ID du fichier stocké
 */
const storePdfBuffer = (pdfBuffer, filename, metadata = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const bucket = getGridFSBucket();
      const readableStream = Readable.from(pdfBuffer);

      const uploadStream = bucket.openUploadStream(filename, {
        contentType: 'application/pdf',
        metadata: {
          ...metadata,
          uploadedAt: new Date()
        }
      });

      readableStream.pipe(uploadStream)
        .on('error', (error) => {
          console.error('Erreur upload GridFS:', error);
          reject(error);
        })
        .on('finish', () => {
          console.log(`PDF stocké dans GridFS: ${filename} (ID: ${uploadStream.id})`);
          resolve(uploadStream.id);
        });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Récupère un fichier PDF depuis GridFS
 * @param {ObjectId} fileId - L'ID du fichier
 * @returns {Promise<{stream: ReadableStream, file: Object}>}
 */
const getPdfById = async (fileId) => {
  const bucket = getGridFSBucket();
  const objectId = new mongoose.Types.ObjectId(fileId);

  // Vérifier que le fichier existe
  const files = await bucket.find({ _id: objectId }).toArray();
  if (files.length === 0) {
    throw new Error('Fichier PDF introuvable dans GridFS');
  }

  const file = files[0];
  const downloadStream = bucket.openDownloadStream(objectId);

  return { stream: downloadStream, file };
};

/**
 * Supprime un fichier PDF de GridFS
 * @param {ObjectId} fileId - L'ID du fichier
 */
const deletePdf = async (fileId) => {
  const bucket = getGridFSBucket();
  const objectId = new mongoose.Types.ObjectId(fileId);
  await bucket.delete(objectId);
  console.log(`PDF supprimé de GridFS: ${fileId}`);
};

module.exports = {
  initGridFS,
  getGridFSBucket,
  storePdfBuffer,
  getPdfById,
  deletePdf
};
