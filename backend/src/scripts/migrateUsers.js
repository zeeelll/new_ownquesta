// Migration script to add profile fields to existing users

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function migrateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to migrate`);

    let updated = 0;
    for (const user of users) {
      let needsUpdate = false;

      // Check and set default values for missing fields
      if (user.phone === undefined) { user.phone = ''; needsUpdate = true; }
      if (user.dateOfBirth === undefined) { user.dateOfBirth = ''; needsUpdate = true; }
      if (user.bio === undefined) { user.bio = ''; needsUpdate = true; }
      if (user.company === undefined) { user.company = ''; needsUpdate = true; }
      if (user.jobTitle === undefined) { user.jobTitle = ''; needsUpdate = true; }
      if (user.location === undefined) { user.location = ''; needsUpdate = true; }
      if (user.department === undefined) { user.department = ''; needsUpdate = true; }
      if (user.website === undefined) { user.website = ''; needsUpdate = true; }
      if (user.emailNotif === undefined) { user.emailNotif = true; needsUpdate = true; }
      if (user.marketingEmails === undefined) { user.marketingEmails = false; needsUpdate = true; }
      if (user.publicProfile === undefined) { user.publicProfile = true; needsUpdate = true; }
      if (user.twoFactorAuth === undefined) { user.twoFactorAuth = false; needsUpdate = true; }
      if (user.language === undefined) { user.language = 'en'; needsUpdate = true; }
      if (user.timezone === undefined) { user.timezone = 'UTC'; needsUpdate = true; }
      if (user.isActive === undefined) { user.isActive = true; needsUpdate = true; }
      if (user.role === undefined) { user.role = 'user'; needsUpdate = true; }
      if (user.subscription === undefined) { user.subscription = 'free'; needsUpdate = true; }
      
      // Initialize settings object if missing
      if (!user.settings) {
        user.settings = {
          emailNotif: user.emailNotif !== undefined ? user.emailNotif : true,
          marketingEmails: user.marketingEmails !== undefined ? user.marketingEmails : false,
          publicProfile: user.publicProfile !== undefined ? user.publicProfile : true,
          twoFactorAuth: user.twoFactorAuth !== undefined ? user.twoFactorAuth : false,
          language: user.language || 'en',
          timezone: user.timezone || 'UTC'
        };
        needsUpdate = true;
      }

      if (needsUpdate) {
        await user.save();
        updated++;
        console.log(`✅ Updated user: ${user.email}`);
      }
    }

    console.log(`\n🎉 Migration complete! ${updated} users updated.`);
    
    // Display sample user
    if (users.length > 0) {
      const sample = await User.findById(users[0]._id).select('-password');
      console.log('\n📋 Sample user profile:');
      console.log(JSON.stringify(sample, null, 2));
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateUsers();
