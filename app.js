const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
require('dotenv').config();
const PORT = process.env.PORT || 3000;


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// mongoose.connect(process.env.MONGO_URL, {useNewUrlParser: true});



const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}



const itemsSchema = {
  name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item ({
  name: "Welcome to your todolist!"
});
const item2 = new Item ({
  name: "Hit the + button to add a new item."
});
const item3 = new Item ({
  name: "<-- Hit this to delete an item."
});

const defaultItems = [item1, item2, item3];


const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);



app.get("/", function(req, res) {

  Item.find({}).then((foundItems) => {

    if(foundItems.length === 0) {
        Item.insertMany(defaultItems).then(function(){
              console.log("Data inserted - default items")  // Success
        }).catch(function(error){
              console.log(error)      // Failure
        });
        res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }
      
      
  }).catch((err) => {
      console.log(err);
  })

});


app.get("/:customListName", function(req, res) {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName})
  .then(function(foundList) {
      if(!foundList) {
        //create a new list
        const list = new List ({
          name: customListName,
          items: defaultItems
        });
      
        list.save();
        res.redirect("/" + customListName);
      } else {
      //show an existing list

      res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      }

  }).catch(function(err) {
        
  })

  

})


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today") {
    item.save();

    res.redirect("/");
  
  } else {
    List.findOne({name: listName}).then(function(foundList) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listName);

    }).catch(function(err) {
          console.log(err);
    })
  }

 

});


app.post("/delete", function(req, res) {
  const checkeditemId = req.body.checkbox;
  const listName = req.body.listName;

  if(listName === "Today") {
    Item.findByIdAndRemove(checkeditemId).then(function() {
      console.log("Successfully deleted the checked item.");
      res.redirect("/");
  }).catch(function(err) {
      console.log(err);
  })

  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkeditemId}}}).then(function(foundList) {
        res.redirect("/" + listName);
    }).catch(function(err) {
      console.log(err);
    })
  }

  
});


// app.get("/work", function(req,res){
//   res.render("list", {listTitle: "Work List", newListItems: workItems});
// });

app.get("/about", function(req, res){
  res.render("about");
});

// app.listen(PORT, function() {
//   console.log("Server started on port 3000");
// });


connectDB().then(() => {
  app.listen(PORT, () => {
      console.log("listening for requests");
  })
})