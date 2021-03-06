import { useState, useEffect } from "react";

import styles from "./Lists.module.scss";

function Lists({
  featureLists,
  setFeatureLists,
  // orders,
  setOrders,
  setBackUpItem,
  depth,
  id,
}) {
  // const [subList, setSubList] = useState({});

  const [activeFeature, setActiveFeature] = useState(new Set());

  // Initial the active state of the node
  useEffect(() => {
    featureLists[id] &&
      featureLists[id].orders.forEach((order) => {
        if (order.isleaf === true) {
          setActiveFeature((prev) => new Set(prev.add(order.id.toString())));
          // activeFeature.add(order.id.toString());
        }
      });
  }, [featureLists, id]);

  const [newFetchID, setNewFetchID] = useState("0");

  const features = featureLists[id] && featureLists[id].features;
  const subOrders = featureLists[id] && featureLists[id].orders;

  const orderObj = {};

  // Array to object for easier query
  subOrders &&
    subOrders.forEach((order) => {
      orderObj[order.id] = { ...order };
    });

  // Click handler for each feature
  const clickHandler = (id) => {
    if (activeFeature.has(id)) {
      setActiveFeature((prev) => new Set([...prev].filter((x) => x !== id)));
      // activeFeature.delete(id);
      return;
    }

    setActiveFeature((prev) => new Set(prev.add(id)));
    // activeFeature.add(id);

    if (featureLists.hasOwnProperty(id) === false) setNewFetchID(id);
  };

  // Click handler for leaf node
  // @id: string
  // @pid: number
  // @price: number
  const clickHandlerLeaf = (id, pid, price) => {
    // remove item
    if (activeFeature.has(id)) {
      setActiveFeature((prev) => {
        return new Set([...prev].filter((x) => x !== id));
      });
      // activeFeature.delete(id);
      setFeatureLists((draft) => {
        draft[pid.toString()].orders = draft[pid.toString()].orders.filter(
          (x) => x.id.toString() !== id
        );
      });

      setOrders((draft) => {
        // return draft.filter((x) => x.id.toString() !== id);
        delete draft[id];
      });
      // recursor remove to parent node
      let sourceId = pid.toString();
      while (featureLists[sourceId].pid !== null) {
        const curId = sourceId;
        const newSourceId = featureLists[curId].pid.toString();
        const newOrders = [];
        featureLists[newSourceId].orders.forEach((ele) => {
          if (ele.id.toString() === curId) {
            if (ele.price !== price) {
              newOrders.push({ ...ele, price: ele.price - price });

              setOrders((draft) => {
                draft[curId].price -= price;
              });
            } else {

              setOrders((draft) => {
                delete draft[curId];
              });
            }
          } else newOrders.push({ ...ele });
        });
        setFeatureLists((draft) => {
          draft[newSourceId].orders = newOrders;
        });
        sourceId = newSourceId;
      }
      // add item
    } else {
      const newFeature = {
        id: parseInt(id),
        pid: pid,
        price: price,
        isleaf: true,
      };
      setFeatureLists((draft) => {
        draft[pid.toString()].orders = [
          ...draft[pid.toString()].orders,
          newFeature,
        ];
      });
      // add to global orders
      // orders.push({ id: parseInt(id), price: price });
      const newLeaf = {
        id: parseInt(id),
        pid: pid,
        price: price,
        isleaf: true,
      };
      setOrders((draft) => {
        draft[id] = newLeaf;
      });

      // recursor add to parent node
      let sourceId = pid.toString();
      while (featureLists[sourceId].pid !== null) {
        const curId = sourceId;
        const newSourceId = featureLists[curId].pid.toString();
        const newOrders = [];

        // flag to inid
        let flag = false;
        featureLists[newSourceId].orders.forEach((ele) => {
          if (ele.id.toString() === curId) {
            flag = true;
            newOrders.push({ ...ele, price: ele.price + price });
          } else {
            newOrders.push({ ...ele });
          }
        });

        if (flag === true) {
          setFeatureLists((draft) => {
            draft[newSourceId].orders = newOrders;
          });

          setOrders((draft) => {
            draft[curId].price += price;
          });
        } else {
          // console.log(parseInt(sourceId), parseInt(newSourceId));
          newOrders.push({
            id: parseInt(curId),
            pid: parseInt(newSourceId),
            price: price,
            isleaf: false,
          });
          setFeatureLists((draft) => {
            draft[newSourceId].orders = newOrders;
          });

          // orders.push({ id: parseInt(sourceId), price: price });
          const newLeaf = {
            id: parseInt(curId),
            pid: parseInt(newSourceId),
            price: price,
            isleaf: false,
          };
          setOrders((draft) => {
            draft[curId] = newLeaf;
          });
        }

        sourceId = newSourceId;
      }
      setActiveFeature((prev) => new Set(prev.add(id)));
    }
  };

  // Fetch data when newFetchID modified
  useEffect(() => {
    let url = `https://features-order-api.herokuapp.com/users/${newFetchID}`;
    // const res = await axios.get(url);

    const fetchData = async () => {
      const res = await fetch(url);

      const data = await res.json();

      setFeatureLists((draft) => {
        draft[newFetchID] = data;
      });


      setOrders((draft) => {
        data.orders.forEach((ele) => {
          draft[ele.id] = { ...ele };
        });
      });

      setBackUpItem((draft) => {
        data.orders.forEach((ele) => {
          draft[ele.id] = { id: ele.id, price: ele.price };
        });
      });

    };

    if (newFetchID !== "0") fetchData();
  }, [newFetchID]);

  const renderMore = (id, depth) => {
    return (
      <Lists
        featureLists={featureLists}
        setFeatureLists={setFeatureLists}
        // orders={orders}
        setOrders={setOrders}
        setBackUpItem={setBackUpItem}
        id={id}
        depth={depth + 1}
      />
    );
  };

  const priceTag = (price, id) => {
    if (price === null && orderObj.hasOwnProperty(id))
      return `( \$${orderObj[id.toString()].price} )`;

    if (price !== null) return `( \$${price} )`;

    return "( - )";
  };

  return (
    <div className={styles.listsWrapper}>
      {features &&
        features.map((feature) => {
          const id = feature.id.toString();
          const selected = activeFeature.has(id);
          // ||
          // (orderObj.hasOwnProperty(feature.id.toString()) &&
          //   orderObj[feature.id.toString()].isleaf === true &&
          //   orderObj[feature.id.toString()].remove === false);
          return (
            <div key={feature.id} className={styles.listItem}>
              <div
                className={styles.itemWrapper}
                role="button"
                tabIndex="0"
                onClick={(e) => {
                  e.stopPropagation();
                  if (feature.price === null) clickHandler(id);
                  else clickHandlerLeaf(id, feature.pid, feature.price);
                }}
              >
                <div className={styles.checkBoxWrapper}>
                  <span
                    className={
                      selected
                        ? `${styles.active} ${styles.checkBox}`
                        : `${styles.checkBox}`
                    }
                  ></span>
                </div>

                <div>
                  {depth === 0
                    ? `Feature ${feature.name} `
                    : `Sub-feature ${feature.name} `}
                  <span>{priceTag(feature.price, id)}</span>
                </div>
              </div>

              {activeFeature.has(id) && feature.price === null
                ? renderMore(id, depth)
                : null}
            </div>
          );
        })}
    </div>
  );
}

export default Lists;
