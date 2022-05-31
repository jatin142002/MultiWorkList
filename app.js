const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/TodoListDB" , {useNewUrlParser : true});

const itemsSchema = new mongoose.Schema({
  name: String
});

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
})

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({ name: 'Cycling' });

const item2 = new Item({ name: 'Running' });

const item3 = new Item({ name: 'Stretching' });

const defaultItems = [item1 , item2 , item3];

const List = mongoose.model('List', listSchema);

app.get("/", function (req, res) {

  Item.find({}, function(err , foundItems){

    if(foundItems.length === 0)
    {
      Item.insertMany(defaultItems , function(err){
        if(err)
        {
          console.log(err);
        }
        else
        {
          console.log("Successfully inserted");
        }
      });

      res.redirect("/");
    }
    else
    {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }

  });

});

app.get("/:customListName", function (req, res) {

  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName} , function(err , foundList){

    if(!foundList)
    {
      const list = new List({
        name: customListName,
        items: defaultItems
      })
    
      list.save();
      res.redirect("/"+customListName);
    }
    else
    {
      console.log("customListName found !!");
      res.render("list",{listTitle: foundList.name , newListItems: foundList.items});
    }

  })

 

});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({ name: itemName });

  // const newArr = [newitem];

  // Item.insertMany(newArr , function(err){
  //   if(err)
  //   {
  //     console.log(err);
  //   }
  //   else
  //   {
  //     console.log("Successfully new item inserted");
  //   }
  // });

  if(listName === "Today")
  {
    item.save();

    res.redirect("/");
  }
  else
  {
    List.findOne({name: listName} , function(err , findList){
      findList.items.push(item);
      findList.save();

      res.redirect("/"+listName);
    })
  }
});

app.post("/delete", function(req , res){
  const checkedItemid = req.body.checkbox;
  const listName = req.body.listName;

  console.log(listName);
  
  if(listName === "Today")
  {
    Item.findByIdAndRemove(checkedItemid , function(err){
      if(!err)
      {
        console.log("Removed Successfully !");
        res.redirect("/");
      }
    });
  }
  else
  {
    List.findOneAndUpdate({name: listName} , {$pull: {items: {_id: checkedItemid}}} , function(err , foundList){
      //--> pulling the checked item from items (array) of that particular list.
      if(!err){
        console.log("Removed Successfully from custom list !");
        res.redirect("/"+listName);
      }
    });
  }

});


app.listen(3000, function () {
  console.log("Server started on port 3000");
});
