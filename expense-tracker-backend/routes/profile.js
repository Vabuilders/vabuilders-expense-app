const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
let Profile = require('../models/profile.model');

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

const upload = multer({ storage: storage });

router.route('/').get(async (req, res) => {
    try {
        let profile = await Profile.findOne({ userId: req.auth.userId });
        if (!profile) {
            profile = new Profile({ userId: req.auth.userId });
            await profile.save();
        }
        res.json(profile);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

router.route('/update').post(upload.single('logo'), async (req, res) => {
    try {
        const { companyName, addressLine1, addressLine2, addressLine3 } = req.body;
        
        const updateData = {
            companyName,
            addressLine1,
            addressLine2,
            addressLine3,
        };

        if (req.file) {
            updateData.logoUrl = `uploads/${req.file.filename}`;
        }

        const updatedProfile = await Profile.findOneAndUpdate(
            { userId: req.auth.userId },
            updateData,
            { new: true, upsert: true }
        );

        res.json(updatedProfile);
    } catch (err) {
        res.status(400).json('Error: ' + err);
    }
});

module.exports = router;