const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const app = express();
const port = 3001;

const { pool } = require("./config");


app.use(cors());

app.use(helmet());

app.use(express.json()); // for parsing application/json
app.use(express.urlencoded({ extended: true }));

// Get items
const getFeaturesByPid = async (request, response) => {
  const pid = parseInt(request.params.pid);

  const res = {};

  try {
    const featureQuer = await pool.query(
      "SELECT * FROM features WHERE ID IN (SELECT ID FROM features  WHERE PID = $1) ;",
      [pid]
    );
    res.features = featureQuer.rows;
    const orderQuer = await pool.query(
      "SELECT * FROM orders WHERE ID IN (SELECT ID FROM orders  WHERE PID = $1) ;",
      [pid]
    );
    res.orders = orderQuer.rows;

    if (pid !== 0) {
      const pidQuer = await pool.query(
        "SELECT PID FROM features WHERE ID  = $1 ;",
        [pid]
      );
      res.pid = pidQuer.rows[0].pid;
    } else {
      res.pid = null;
    }
  } catch (error) {
    throw error;
  }

  response.status(200).json(res);
};

// Update orders
const updateOrder = async (request, response) => {
  const addArray = [];
  const updateArray = [];
  const removeArray = [];

  request.body.data.forEach((ele) => {
    if (ele.type === "add") {
      addArray.push(`(${ele.id},${ele.price},${ele.pid},${ele.isleaf})`);
    }
    if (ele.type === "update") {
      updateArray.push(ele);
    }
    if (ele.type === "remove") {
      removeArray.push(ele);
    }
  });

  let addQ = "";
  if (addArray.length !== 0) {
    let tmp = addArray.join(",");
    addQ = "INSERT INTO orders (ID,PRICE,PID,ISLEAF) VALUES " + tmp + ";";
  }

  try {
    addArray.length !== 0 && (await pool.query(addQ, []));
  } catch (error) {
    throw error;
  }

  for (let ele of updateArray) {
    try {
      await pool.query("UPDATE orders SET PRICE = $1 WHERE ID = $2;", [
        ele.price,
        ele.id,
      ]);
    } catch (error) {
      throw error;
    }
  }

  for (let ele of removeArray) {
    try {
      await pool.query("DELETE FROM orders WHERE ID=$1;", [ele.id]);
    } catch (error) {
      throw error;
    }
  }

  response.status(200).json("ok");
};

app.get("/", (request, response) => {
  response.json({ info: "Node.js, Express, and Postgres API" });
});

app.get("/users/:pid", getFeaturesByPid);

app.put("/order", updateOrder);

app.listen(process.env.PORT || port, () => {
  // console.log(`App running on port ${port}.`);
  console.log(`Server listening`);
});
