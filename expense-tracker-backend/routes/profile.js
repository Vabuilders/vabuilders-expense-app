const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
let Profile = require('../models/profile.model');

// --- FIX 3: Add file filter for security to only allow images ---
const imageFilter = (req, file, cb) => {
  // Accept images only
  if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
      req.fileValidationError = 'Only image files are allowed!';
      return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)){ fs.mkdirSync(dir); }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, `logo-${req.auth.userId}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage, fileFilter: imageFilter });

router.route('/').get(async (req, res) => {
    try {
        let profile = await Profile.findOne({ userId: req.auth.userId });
        if (!profile) {
            profile = new Profile({ userId: req.auth.userId });
            await profile.save();
        }
        
        const profileObject = profile.toObject();
        // --- FIX 6: Always return a full URL from the backend ---
        if (profileObject.logoUrl) {
            const baseUrl = `${req.protocol}://${req.get('host')}`;
            profileObject.logoUrl = `${baseUrl}/${profileObject.logoUrl}`;
        }

        res.json(profileObject);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

router.route('/update').post(upload.single('logo'), async (req, res) => {
    try {
        // Handle file validation error from multer
        if (req.fileValidationError) {
            return res.status(400).json({ message: req.fileValidationError });
        }

        const { companyName, addressLine1, addressLine2, addressLine3 } = req.body;
        
        const updateData = {
            companyName,
            addressLine1,
            addressLine2,
            addressLine3,
        };

        if (req.file) {
            // Store relative path in DB
            updateData.logoUrl = `uploads/${req.file.filename}`;
        }

        const updatedProfile = await Profile.findOneAndUpdate(
            { userId: req.auth.userId },
            updateData,
            { new: true, upsert: true }
        );

        const profileObject = updatedProfile.toObject();
        // --- FIX 6: Always return a full URL from the backend ---
        if (profileObject.logoUrl) {
             const baseUrl = `${req.protocol}://${req.get('host')}`;
             profileObject.logoUrl = `${baseUrl}/${profileObject.logoUrl}`;
        }

        res.json(profileObject);
    } catch (err) {
        res.status(400).json('Error: ' + err.message);
    }
});

module.exports = router;