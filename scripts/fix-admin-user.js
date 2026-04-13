// Script to delete existing admin user with wrong fields
// Run this in MongoDB Compass or MongoDB shell

// Delete the admin user created with business fields
db.users.deleteOne({
  email: "mukeshyaduvanshi1508@gmail.com",
  userType: "admin"
});

// Or if you want to update existing admin user (remove business fields)
db.users.updateOne(
  { 
    email: "mukeshyaduvanshi1508@gmail.com",
    userType: "admin" 
  },
  { 
    $unset: { 
      isBusinessInformation: "",
      isBusinessKyc: "",
      adminApproval: ""
    }
  }
);
