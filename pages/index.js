import Head from "next/head";
import styles from "../styles/Home.module.scss";
import { useState, useEffect } from "react";

import Lists from "../components/Lists/Lists";
import { useImmer } from "use-immer";

import Spinner from "../components/Spinner/Spinner";

export default function Home() {
  const [featureLists, setFeatureLists] = useImmer({});

  const [orders, setOrders] = useImmer({});
  // const orders = [];

  const [totalNum, SetNum] = useState(0);

  const [backUpItem, setBackUpItem] = useImmer({});

  const [isLoading, setLoadingState] = useState(true);

  const [subEnable, setSubEnable] = useState(true);

  // Order item set to record the item for removal
  // const orderItemSet = [];

  useEffect(() => {
    const url = "https://features-order-api.herokuapp.com/users/0";
    // const res = await axios.get(url);

    const fetchData = async () => {
      const res = await fetch(url);

      const data = await res.json();

      setFeatureLists((draft) => {
        draft["0"] = data;
      });
      // console.log(data.orders)

      setOrders((draft) => {
        data.orders.forEach((ele) => {
          draft[ele.id] = { ...ele };
        });
      });
      // setOrders((prev) => [...prev, ...data.orders]);

      setBackUpItem((draft) => {
        data.orders.forEach((ele) => {
          draft[ele.id] = { id: ele.id, price: ele.price };
        });
      });

      setLoadingState(false);
    };

    fetchData();
  }, []);

  useEffect(() => {
    let acc = 0;

    featureLists["0"] &&
      featureLists["0"].orders.length !== 0 &&
      featureLists["0"].orders.forEach((order) => {
        if (order.pid === 0) acc += order.price;
      });

    SetNum(acc);
  }, [featureLists]);

  const onSave = () => {
    setSubEnable(false);
    const actionList = [];
    const tempObj = { ...backUpItem };

    Object.keys(orders).forEach((key) => {
      if (tempObj.hasOwnProperty(key)) {
        if (orders[key].price !== tempObj[key].price)
          actionList.push({ ...orders[key], type: "update" });
        delete tempObj[key];
      } else {
        actionList.push({ ...orders[key], type: "add" });
      }
    });

    Object.keys(tempObj).forEach((key) => {
      actionList.push({ id: tempObj[key].id, type: "remove" });
    });

    console.log(actionList);

    fetch("https://features-order-api.herokuapp.com/order", {
      method: "PUT",
      body: JSON.stringify({ data: actionList }),
      headers: new Headers({
        "Content-Type": "application/json",
      }),
    })
      .then((response) => {
        return response.json();
      })
      .then((data) => {
        // setSubEnable(true);
        console.log(data);
        window.location.reload();
      });
    // setSubEnable(true);
    // console.log(actionList);
  };

  let navList = (
    <nav className={styles.listsWrapper} aria-labelledby="nested-list">
      <Lists
        featureLists={featureLists}
        setFeatureLists={setFeatureLists}
        // orders={orders}
        setOrders={setOrders}
        setBackUpItem={setBackUpItem}
        depth={0}
        id={"0"}
      />
    </nav>
  );

  if (isLoading) {
    navList = <Spinner />;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header className={styles.header}>
        <h3 className={styles.title}>Subscription Preferences</h3>
      </header>

      <main className={styles.main}>{navList}</main>

      <footer className={styles.footer}>
        <div>Total: ${totalNum} / mo</div>
        {subEnable ? (
          <button alt="button" className={styles.button} onClick={onSave}>
            Save
          </button>
        ) : (
          <button alt="button" className={styles.button} disabled>
            Save
          </button>
        )}
      </footer>
    </div>
  );
}
