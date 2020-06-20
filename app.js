//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const nodemailer = require('nodemailer');

var foodarray = [];
var donemail;
var i = 0;
var recemail;
var recauthenticate = 0;
var reccart = [];
var reccartsz = 0;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));


var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'foodshareproj@gmail.com',
    pass: process.env.PASS
  }
});

// mongoose & mongo db connection

mongoose.connect("mongodb://localhost:27017/foodredistributionDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
   useFindAndModify: false
});
mongoose.set('useFindAndModify', false);

// Database Schema creation

const receiverSchema = new mongoose.Schema({
  rname: String,
  raddress: String,
  remail: String,
  rphone: Number,
  rpassword: String
});

const donorSchema = new mongoose.Schema({
  dname: String,
  daddress: String,
  dphone: Number,
  demail: String,
  dpassword: String
});

const foodDatabaseSchema = new mongoose.Schema({
  foodname: String,
  qty: Number,
  expirytime: Number,
  donorname: String,
  donoraddress: String,
  receiversname: String,
  receiversaddress: String,
  receiversPhone: Number,
  donorphone: Number,
  donid: String,
  recid: String,
  recemail: String,
  carttime: Number,
  available: {
    type: Number,
    default: 1
  },
  cart: {
    type: Number,
    default: 0
  }
});

const feedBackSchema = new mongoose.Schema({
  mailaddress: String,
  feedback: String
});

// Creating mongoose model

const Donor = new mongoose.model("Donor", donorSchema);
const Receiver = new mongoose.model("Receiver", receiverSchema);
const Food = new mongoose.model("Food", foodDatabaseSchema);
const Feedback = new mongoose.model("Feedback", feedBackSchema);


//to execute the code evary 12 hr to clean up the datadase

function intervalFunc() {

  var dte = new Date();
  var n = dte.getTime();

  Food.deleteMany({
    expirytime: {
      $lt: n
    }
  }, function(err) {});
  console.log("deleted records")
}

setInterval(intervalFunc, 1000 * 60 * 60 * 12);


function intervalFunc2() {

  var dte3 = new Date();
  var n3 = dte3.getTime();
  Food.updateMany({cart: 1, carttime:{$lt:n3}},
      {cart: 0}, function (err, docs) {
      if (err){
          console.log(err)
      }
      else{
          console.log("Updated cart");
      }
  });
}

setInterval(intervalFunc2, 1000 * 60);

//handling get requests


app.get("/", function(req, res) {

  res.render("index");


});


app.get("/donlogin", function(req, res) {

  res.render("donlogin");


});


app.get("/reclogin", function(req, res) {

  res.render("reclogin");

});

app.get("/receiversignup", function(req, res) {

  res.render("receiversignup");

});

app.get("/donarsignup", function(req, res) {

  res.render("donarsignup");

});

app.get("/donlogout", function(req, res) {

  donemail = null;
  foodarray.splice(0,foodarray.length);
  res.redirect("/");

});

app.get("/rechomepage", function(req, res) {
  var dte50 = new Date();
  var n50 = dte50.getTime();

  if(recauthenticate == 1){
  Food.find({cart: 0, available: 1, expirytime:{$gt: n50}}, function(err, totalfooditms) {
      res.render("receiverhomepage", {recmail: recemail, reccartsize: reccartsz, totalfooditems: totalfooditms, orderedfooditems: reccart});
  });
}
else{
  res.redirect("/reclogin");
}
});

app.get("/reclogout", function(req, res) {

  recemail = null;
  recauthenticate = 0;
  reccart.splice(0,reccart.length);
  reccartsz = 0;
  res.redirect("/");

});

app.get("/cartpage",function(req,res){

  var dt = new Date();
  var n200 = dt.getTime();

  Food.find({recemail: recemail, available: 0, expirytime: {$gt: n200}},function(err, foundItems) {
    if(err){
      console.log(err);
    }else{
      console.log("sucessfully found cart food");
      res.render("cart", {recmail: recemail, cartitems: foundItems});
  }
  });

});

// handling post request


//donor signup

app.post("/dsignup", function(req, res) {

  bcrypt.hash(req.body.dpassword, saltRounds, function(err, hash) {
    const newDonor = new Donor({
      dname: req.body.dname,
      daddress: req.body.daddress,
      dphone: req.body.dphone,
      dpassword: hash,
      demail: req.body.demail
    });
    newDonor.save(function(err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/donlogin");
      }
    });
  });

});


//receiver signup

app.post("/rsignup", function(req, res) {

  bcrypt.hash(req.body.rpassword, saltRounds, function(err, hash) {
    const newReceiver = new Receiver({
      rname: req.body.rname,
      raddress: req.body.raddress,
      rphone: req.body.rphone,
      rpassword: hash,
      remail: req.body.remail
    });
    newReceiver.save(function(err) {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/reclogin");
      }
    });
  });
});

//donor login
app.post("/dlogin", function(req, res) {

  const password = req.body.dpassword;
  donemail = req.body.demail

  Donor.findOne({ demail: req.body.demail}, function(err, foundDonor) {
    if (err) {
      console.log(err);
    } else {
      if (foundDonor) {
        console.log(password);
        console.log(foundDonor.dpassword);
        bcrypt.compare(password, foundDonor.dpassword , function(err, result) {
          if (err) {
            console.log(err);
          }
          else if(result === true){
            console.log(result);
            i=0;
            button=1;
            res.render("donorhomepage", {button: button, donemail: donemail, i: i, foodarray: foodarray});
          }
        });
      }
    }
  });
});


//receiver login
app.post("/rlogin", function(req, res) {

    const password = req.body.rpassword;
    recemail = req.body.remail;

    Receiver.findOne({ remail: req.body.remail}, function(err, foundReceiver) {
      if (err) {
        console.log(err);
      } else {
        if (foundReceiver) {
          console.log(password);
          console.log(foundReceiver.rpassword);
          bcrypt.compare(password, foundReceiver.rpassword , function(err, result) {
            if (err) {
              console.log(err);
            }
            else if(result === true){
              console.log(result);
              recemail = req.body.remail;
              recauthenticate = 1;
              res.redirect("/rechomepage");
            }
          });
        }
      }
    });
});

app.post("/donatedfood",function(req,res){

  var fooddata = {foodName:req.body.foodname, no_of_persons:req.body.qty, hours:req.body.expiry};
  console.log(fooddata.foodName);
  console.log(fooddata.no_of_persons);
  console.log(fooddata.hours);
  foodarray.push(fooddata);
  i = 0;
  button=0;
  res.render("donorhomepage", {button: button, donemail: donemail, i: i, foodarray: foodarray});
});

app.post("/deletedonatedfood",function(req,res){

  var indextobedeleted = req.body.indexvalue;
  foodarray.splice(indextobedeleted,1);
  i = 0;
  if(foodarray.length == 0){
    button=1;
  }else{
    button=0;
  }
  res.render("donorhomepage", {button: button, donemail: donemail, i: i, foodarray: foodarray});
});


app.post("/adddata",function(req,res){

  var dte2 = new Date();
  var d = dte2.getTime();

    Donor.findOne({ demail: req.body.donemail}, function(err, foundDonor) {
      if(err){
        console.log(err);
      }
      else{
        foodarray.forEach(function(item,index){
            const foodinfo = new Food({
              foodname: item.foodName,
              qty: item.no_of_persons,
              expirytime: d+(item.hours*3600000),
              donorname: foundDonor.dname,
              donorphone: foundDonor.dphone,
              donid: foundDonor.id,
              donoraddress: foundDonor.daddress
            });
          foodinfo.save();
        });
          i = 1;
          button = 1;
          foodarray.splice(0, foodarray.length);
          res.render("donorhomepage", {i: i, donemail: donemail, foodarray: foodarray});
      }
});

});

app.post("/submitcart", function(req, res) {
  var addrs;
  var phnnum;
  var recnam;
  var recvrid;

  Receiver.findOne({
    remail: req.body.recmail,
  }, function(err, foundrec) {
    addrs = foundrec.raddress;
    phnnum = foundrec.rphone;
    recnam = foundrec.rname;
    recvrid = foundrec.id;
  });
  reccart.forEach(function(item,index){

    Food.findById(item.fdid, function(err, foundItem) {
      foundItem.receiversname = recnam;
      foundItem.receiversaddress = addrs;
      foundItem.receiversPhone = phnnum;
      foundItem.available = 0;
      foundItem.save();
    });

  });

  reccart.splice(0,reccart.length);
  reccartsz = 0;

  Food.find({recemail: req.body.recmail, available: 0}, function(err, cartdetails) {

    var name = cartdetails.receiversname;

    var mailOptions10 = {
      from: 'foodshareproj@gmail.com',
      to: req.body.recmail,
      subject: 'Your Order has been Confirmed (Food Share Organisation)',
      text: 'you can check your order details by logging into your account and visit the MyOrders page by clicking the MyOrders link at the top of the page that apears when you log in'
    }

    transporter.sendMail(mailOptions10, function(err, res) {
      if (err) {
        console.log(err);
        console.log('order confirmed Mail not sent');
      } else {
        console.log('order confirmed Mail sent sucessfully');
      }
    });

  });

res.redirect("/rechomepage");
});

app.post("/addtocart", function(req, res) {
    Food.findById(req.body.foodid, function(err, foundFood) {
    if(err){
      console.log("cannot find food");
    }else{

    var n4 = new Date().getTime();
    var dte9 = new Date(foundFood.expirytime);
    var expirytime5 = dte9.toString();
    var foodcart2 = {foodName: foundFood.foodname, no_of_persons: foundFood.qty, address: foundFood.donoraddress, fdid: req.body.foodid, donorname: foundFood.donorname, expiry: expirytime5};
    foundFood.cart = 1;
    foundFood.recemail = req.body.recemailadd;
    foundFood.carttime = n4 + 1200000; //20 minutes
    //foundFood.visits.$inc();
    foundFood.save();
    reccartsz = 1;
    reccart.push(foodcart2);
  }
    });
      res.redirect("/rechomepage");
});


app.post("/deletecartitems", function(req, res) {
  // var fdID = req.body.fdid;
  var indextobdeleted = req.body.delindexvalue;
  reccart.splice(indextobdeleted,1);
  if(reccart.length == 0){
    reccartsz = 0;
  }else{
    reccartsz = 1;
  }
    Food.findById(req.body.foodid2,function(err, foundItem) {
      if(err){
        console.log(err);
      }else{
        foundItem.cart = 0;
        foundItem.recemail = "0@0.com";
        foundItem.save();
    }
    });
    res.redirect("/rechomepage");
  });

app.post("/cartpageredirect",function(req,res){

  console.log("CartPageRefreshed");
  res.redirect("/cartpage");

});

app.post("/refresh", function(req,res){
  console.log("PageRefreshed");
  res.redirect("/rechomepage");
});

app.post('/send-email', function(req, res) {

  var fdbck = req.body.feedback;
  const fbck = new Feedback({
    mailaddress: req.body.mailaddress,
    feedback: fdbck
  });
  fbck.save();
  var mailOptions = {
    from: 'foodshareproj@gmail.com',
    to: req.body.mailaddress,
    subject: 'Food Share Organisation Team',
    text: 'ThankYou for your valuable feed back sir/madam , we will make sure that we will make this improvement as soon as possible'
  }

  transporter.sendMail(mailOptions, function(err, res) {
    if (err) {
      console.log(err);
      console.log('Mail not sent to the feedback submitted person');
    } else {
      console.log('Mail sent to the feedback submitted person');
    }
  });

  var mailOptions2 = {
    from: 'foodshareproj@gmail.com',
    to: "sjy200019@gmail.com, rakeshrengarajan@gmail.com, lskirruthiga@gmail.com, rmalinisri@gmail.com, santhoshshankar53@gmail.com",
    subject: 'Food Share Feedback Receieved',
    text: req.body.feedback
  }

  transporter.sendMail(mailOptions2, function(err, res) {
    if (err) {
      console.log('Mail not sent to team mates');
    } else {
      console.log('Mail sent to team mates');
    }
  });


  res.redirect("/#feedback");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
