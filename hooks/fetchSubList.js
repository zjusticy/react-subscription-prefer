import { useState, useEffect } from "react";
import * as d3 from "d3";

export const useSubFetch = (renderChartFn, dependencies) => {
  const [subList, setSubList] = useState([]);

  const [subList, setSubList] = useState([]);

  useEffect(() => {
    const url = "http://localhost:3001/users/0";
    // const res = await axios.get(url);

    const fetchData = async () => {
      const res = await fetch(url);

      const data = await res.json();

      let acc = 0;

      data.orders.length !== 0 &&
        data.orders.forEach((order) => {
          if (order.pid === 0) acc += order.price;
        });

      setFeatures(data.features);
      setOrders(data.orders);

      SetNum(acc);

      data.orders;
    };

    fetchData();
    // const res = await fetch(url);

    // const data = await res.json();
  }, []);
};
