//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const nodemailer = require('nodemailer');

var i;

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
    pass: 'Foodshare123'
  }
});

// mongoose & mongo db connection
mongoose.connect("mongodb+srv://admin-Sanjay:test-123@cluster0-l3890.mongodb.net/foodredistributionDB", {

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

const temporaryFoodSchema = new mongoose.Schema({
  mail: String,
  fdname: String,
  persons: Number,
  hours: Number,
  del: {
    type: Number,
    default: 0
  }
});

// Creating mongoose model

const Donor = new mongoose.model("Donor", donorSchema);
const Receiver = new mongoose.model("Receiver", receiverSchema);
const Food = new mongoose.model("Food", foodDatabaseSchema);
const Feedback = new mongoose.model("Feedback", feedBackSchema);
const Temporaryfood = new mongoose.model("Temporaryfood", temporaryFoodSchema);

//to execute the code evary 12 hr to clean up the datadase

function intervalFunc() {

  var dte = new Date();
  var n = dte.getTime();

  Food.deleteMany({ expirytime: { $lt: n}}, function(err) {});
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

//handling get requests


app.get("/", function(req, res) {

  res.render("index");


});


app.get("/donlogin", function(req, res) {

  var alert = 0;
  res.render("donlogin",{alertbox: alert});

});


app.get("/reclogin", function(req, res) {

  var alert = 0;
  res.render("reclogin",{alertbox: alert});

});

app.get("/receiversignup", function(req, res) {

  var alert = 0;
  res.render("receiversignup",{alertbox: alert});

});

app.get("/donarsignup", function(req, res) {

  var alert = 0;
  res.render("donarsignup",{alertbox: alert});

});

app.get("/donlogout", function(req, res) {

  res.redirect("/");

});


app.get("/reclogout", function(req, res) {

  res.redirect("/");

});

// handling post request

//donor signup

app.post("/dsignup", function(req, res) {

  Donor.findOne({ demail: req.body.demail}, function(err, foundDonor) {
    if(foundDonor == null){
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
    }
    else{
      var alert = 1;
      res.render("donarsignup",{alertbox: alert});
      }
  });


});


//receiver signup

app.post("/rsignup", function(req, res) {

  Receiver.findOne({ remail: req.body.remail}, function(err, foundDonor) {
  if(foundDonor == null){

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
}
else{
  var alert = 1;
  res.render("donarsignup",{alertbox: alert});
  }
});
});
//donor login
app.post("/dlogin", function(req, res) {

  const password = req.body.dpassword;
  var donemail = req.body.demail;

  Donor.findOne({ demail: req.body.demail}, function(err, foundDonor) {
    if (foundDonor === null) {
      var alert = 1;
      res.render("donlogin",{alertbox: alert});
    } else {
      if (foundDonor) {
        bcrypt.compare(password, foundDonor.dpassword , function(err2, result) {
          if (result === false) {
            var alert = 1;
            console.log(result);
            res.render("donlogin",{alertbox: alert});
          }
          else if(result === true){
            console.log(result);
            i=0;
            button=1;
            Temporaryfood.deleteMany({ mail: donemail}, function(err) {});
            res.render("donorhomepage", {button: button, donemail: donemail, i: i});
          }
        });
      }
    }
  });
});


//receiver login
app.post("/rlogin", function(req, res) {

    const password = req.body.rpassword;
    var recemail = req.body.remail;
    var brght = 0;

    Receiver.findOne({ remail: recemail}, function(err, foundReceiver) {
      if (foundReceiver === null) {
        var alert = 1;
        res.render("reclogin",{alertbox: alert});
      } else {
        if (foundReceiver) {
          console.log(password);
          console.log(foundReceiver.rpassword);
          bcrypt.compare(password, foundReceiver.rpassword , function(err, result) {
            if (result === false) {
              var alert = 1;
              res.render("reclogin",{alertbox: alert});
            }
            else if(result === true){
              var dte50 = new Date();
              var n50 = dte50.getTime();
              var reccart = [];

              Food.find({cart: 1, available: 1, recemail: recemail}, function(err, totalfooditms) {

                totalfooditms.forEach(function(item,index){
                  reccart.push(item);
                })

              });
              console.log(reccart.length);
              Food.find({cart: 0, available: 1, expirytime:{$gt: n50}}, function(err, totalfooditms) {
                  var lngth = reccart.length;
                  res.render("receiverhomepage", {recmail: recemail, totalfooditems: totalfooditms, orderedfooditems: reccart, len: lngth, brought: brght});
              });

            }
          });
        }
      }
    });
});

app.post("/donatedfood",function(req,res){

var donemail = req.body.donemail;

  const tempfoodinfo = new Temporaryfood({
    mail: donemail,
    fdname: req.body.foodname,
    persons: req.body.qty,
    hours: req.body.expiry
  });

  tempfoodinfo.save(function() {
    Temporaryfood.find({ mail: donemail, del: 0}, function(err, foundfoods) {
      if(err){
        console.log(err);
      }
      else{
        i = 0;
        button=0;
        res.render("donorhomepage", {button: button, donemail: donemail, i: i, foodarray: foundfoods});
      }
    });
    })

});


app.post("/deletedonatedfood",function(req,res){

  var donemail = req.body.donemail;
  Temporaryfood.findById(req.body.foodid, function(err, delfood) {
    if(err){
      console.log(err);
    }
    else{
      delfood.fdname = "noone";
      delfood.del = 1;
      delfood.save(function(){

        Temporaryfood.find({ mail: donemail, del: 0}, function(err, foundfoods) {
          if(err){
            console.log(err);
          }
          else{
            i = 0;
            if(foundfoods.length == 0){
              button=1;
            }else{
              button=0;
            }
            res.render("donorhomepage", {button: button, donemail: donemail, i: i, foodarray: foundfoods});
          }
        });
      });
    }
  });
});


app.post("/adddata",function(req,res){

  var donemail = req.body.donemail;

  var dte2 = new Date();
  var d = dte2.getTime();
  var dnme;
  var dphnum;
  var did;
  var daddr;

  Donor.findOne({ demail: donemail}, function(err, foundDonor) {
    if(err){
      console.log(err);
    }
    else{
        dnme = foundDonor.dname;
        dphnum = foundDonor.dphone;
        did = foundDonor.id;
        daddr = foundDonor.daddress;
      }
  });

  Temporaryfood.find({ mail: donemail, del: 0}, function(err, foundFoods) {
      if(err){
        console.log(err);
      }
      else{
        foundFoods.forEach(function(item,index){
            const foodinfo = new Food({
              foodname: item.fdname,
              qty: item.persons,
              expirytime: d+(item.hours*3600000),
              donorname: dnme,
              donorphone: dphnum,
              donid: did,
              donoraddress: daddr
            });
          foodinfo.save();
        });
        Temporaryfood.deleteMany({ mail: donemail}, function(err) {});
        Temporaryfood.deleteMany({ del : 1}, function(err) {});
          i = 1;
          button = 1;
          res.render("donorhomepage", {i: i, button: button, donemail: donemail});
      }
});

});

app.post("/submitcart", function(req, res) {
  var addrs;
  var phnnum;
  var recnam;
  var recvrid;
  var recemail = req.body.recmail;
  var reccart = [];
  var brght = 0;

  Receiver.findOne({
    remail: recemail,
  }, function(err, foundrec) {
    addrs = foundrec.raddress;
    phnnum = foundrec.rphone;
    recnam = foundrec.rname;
    recvrid = foundrec.id;
  });
  var dte3 = new Date();
  var n3 = dte3.getTime();
  Food.updateMany({recemail: recemail, available: 1, cart: 1, carttime:{$gt:n3}}, {available: 0}, function(err, fooditems) {

    if(err){
      console.log(err);
    }
  });

  Food.find({available: 0, recemail: recemail,carttime:{$gt:n3}}, function(err, totalfooditms) {
    totalfooditms.forEach(function(item,index){
      Food.findById(item.id, function(err, fditm) {
        fditm.receiversname = recnam;
        fditm.receiversaddress = addrs;
        fditm.receiversPhone = phnnum;
        fditm.save();
      });
    })
  });
  Food.find({available: 0, recemail: recemail, carttime:{$gt:n3}}, function(err, totalfooditms) {
    console.log(totalfooditms);
  });

        var mailOptions10 = {
          from: 'foodshareproj@gmail.com',
          to: req.body.recmail,
          subject: 'Your Order has been Confirmed (Food Share Organisation)',
          text: 'you can check your order details by logging into your account and visit the MyOrders page by clicking the MyOrders link at the top of the page that apears when you log in'
        }

        transporter.sendMail(mailOptions10, function(err2, res2) {
          if (err2) {
            console.log(err2);
            console.log('order confirmed Mail not sent');
          } else {
            console.log('order confirmed Mail sent sucessfully');
          }
      });

      Food.find({cart: 1, available: 1, recemail: recemail, carttime:{$gt:n3}}, function(err, totalfooditms) {

        totalfooditms.forEach(function(item,index){
          reccart.push(item);
        })

      });
      console.log(reccart.length);
      Food.find({cart: 0, available: 1, expirytime:{$gt: n3}}, function(err, totalfooditms) {
        var lngth = reccart.length;
        res.render("receiverhomepage", {recmail: recemail, totalfooditems: totalfooditms, orderedfooditems: reccart, len: lngth, brought: brght});
      });

});

app.post("/addtocart", function(req, res) {

    var recemail = req.body.mail;
    var brght = 0;

    Food.findById(req.body.foodid, function(err, foundFood) {
    if(foundFood == null){
      console.log("cannot find food");
    }
    else{
        if(foundFood.cart == 1){
          var dte50 = new Date();
          var n50 = dte50.getTime();
          var reccart = [];
          var brght = 1;

          Food.find({cart: 1, available: 1, recemail: recemail}, function(err, totalfooditms) {

            totalfooditms.forEach(function(item,index){
              reccart.push(item);
            })

          });
          console.log(reccart.length);
          Food.find({cart: 0, available: 1, expirytime:{$gt: n50}}, function(err, totalfooditms) {
              var lngth = reccart.length;
              res.render("receiverhomepage", {recmail: recemail, totalfooditems: totalfooditms, orderedfooditems: reccart, len: lngth, brought:brght});
          });

        }
        else{
      var n4 = new Date().getTime();
      var dte9 = new Date(foundFood.expirytime);
      var expirytime5 = dte9.toString();
      foundFood.cart = 1;
      foundFood.recemail = recemail;
      foundFood.carttime = n4 + 1200000; //20 minutes
      foundFood.save(function() {

        var dte50 = new Date();
        var n50 = dte50.getTime();
        var reccart = [];

        Food.find({cart: 1, available: 1, recemail: recemail}, function(err, totalfooditms) {

          totalfooditms.forEach(function(item,index){
            reccart.push(item);
          })

        });
        console.log(reccart.length);
        Food.find({cart: 0, available: 1, expirytime:{$gt: n50}}, function(err, totalfooditms) {
            var lngth = reccart.length;
            res.render("receiverhomepage", {recmail: recemail, totalfooditems: totalfooditms, orderedfooditems: reccart, len: lngth, brought: brght});
        });
    });
    }
    }
    });
});


app.post("/deletecartitems", function(req, res) {

    var recemail = req.body.mail;
    var brght = 0;

    Food.findById(req.body.foodid2,function(err, foundItem) {
      if(err){
        console.log(err);
      }else{
        foundItem.cart = 0;
        foundItem.recemail = "0@0.com";
        foundItem.save(function(){
          var dte50 = new Date();
          var n50 = dte50.getTime();
          var reccart = [];

          Food.find({cart: 1, available: 1, recemail: recemail}, function(err, totalfooditms) {

            totalfooditms.forEach(function(item,index){
              reccart.push(item);
            })

          });
          console.log(reccart.length);
          Food.find({cart: 0, available: 1, expirytime:{$gt: n50}}, function(err, totalfooditms) {
              var lngth = reccart.length;
              res.render("receiverhomepage", {recmail: recemail, totalfooditems: totalfooditms, orderedfooditems: reccart, len: lngth, brought: brght});
          });
        });
    }
    });
  });

app.post("/cartpageredirect",function(req,res){

  var dte50 = new Date();
  var n50 = dte50.getTime();
  var recmail = req.body.mail;
  Food.find({available: 0, recemail: recmail, expirytime:{$gt: n50}}, function(err, totalfooditms) {
    var lngth = totalfooditms.length;
      res.render("cart", {recmail: recmail, cartitems: totalfooditms, len: lngth});
  });

});

app.post("/refresh", function(req,res){
  var recemail = req.body.mail;
  var dte50 = new Date();
  var n50 = dte50.getTime();
  var reccart = [];
  var brght = 0;

  Food.find({cart: 1, available: 1, recemail: recemail}, function(err, totalfooditms) {

    totalfooditms.forEach(function(item,index){
      reccart.push(item);
    })

  });
  console.log(reccart.length);
  Food.find({cart: 0, available: 1, expirytime:{$gt: n50}}, function(err, totalfooditms) {
      var lngth = reccart.length;
      res.render("receiverhomepage", {recmail: recemail, totalfooditems: totalfooditms, orderedfooditems: reccart, len: lngth, brought:brght});
  });
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

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server started on port 3000");
});
