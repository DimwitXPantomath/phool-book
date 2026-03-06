import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AddSale() {

  const [items, setItems] = useState([]);
  const [variants, setVariants] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);

  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState([]);

  const [paymentMode, setPaymentMode] = useState("cash");
  const [finalPrice, setFinalPrice] = useState("");

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data } = await supabase
      .from("phoolbook_items")
      .select("*");

    setItems(data || []);
  };

  const fetchVariants = async (itemId) => {
    const { data } = await supabase
      .from("phoolbook_variants")
      .select("*")
      .eq("item_id", itemId);

    setVariants(data || []);
  };

  const handleItemChange = (id) => {
    setSelectedItem(id);
    setSelectedVariant(null);
    fetchVariants(id);
  };

  const handleVariantChange = (variantId) => {
    const variant = variants.find(v => v.id === variantId);
    setSelectedVariant(variant);
  };

  const addToCart = () => {

    if (!selectedVariant) {
      alert("Select variant");
      return;
    }

    const total = selectedVariant.base_price * qty;

    const item = {
      variant_id: selectedVariant.id,
      name: selectedVariant.variant_name,
      price: selectedVariant.base_price,
      qty,
      total
    };

    setCart([...cart, item]);
    setQty(1);
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);

  const increaseQty = (index) => {

    const updatedCart = [...cart];

    updatedCart[index].qty += 1;

    updatedCart[index].total =
      updatedCart[index].qty * updatedCart[index].price;

    setCart(updatedCart);
  };

  const decreaseQty = (index) => {

    const updatedCart = [...cart];

    if(updatedCart[index].qty > 1){
      updatedCart[index].qty -= 1;
    }

    updatedCart[index].total =
      updatedCart[index].qty * updatedCart[index].price;

    setCart(updatedCart);
  };

  const removeItem = (index) => {

    const updatedCart = cart.filter((_,i)=> i !== index);

    setCart(updatedCart);
  };

  const handleSaveSale = async () => {

    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    const finalTotal = finalPrice ? Number(finalPrice) : cartTotal;

    const { data: saleData, error } = await supabase
      .from("phoolbook_sales")
      .insert([
        {
          payment_mode: paymentMode,
          cart_total: cartTotal,
          final_total: finalTotal
        }
      ])
      .select();

    if (error) {
      alert(error.message);
      return;
    }

    const saleId = saleData[0].id;

    const itemsToInsert = cart.map(item => ({
      sale_id: saleId,
      variant_id: item.variant_id,
      qty: item.qty,
      price: item.price,
      total: item.total
    }));

    await supabase
      .from("phoolbook_sale_items")
      .insert(itemsToInsert);

    alert("Sale saved ✅");

    setCart([]);
    setFinalPrice("");
  };

  return (
    <div style={{display:"flex",flexDirection:"column",gap:"15px"}}>

      <h2>Add Sale</h2>

      <select style={inputStyle} onChange={(e)=>handleItemChange(e.target.value)}>
        <option>Select Item</option>
        {items.map(item => (
          <option key={item.id} value={item.id}>{item.name}</option>
        ))}
      </select>

      <select style={inputStyle} onChange={(e)=>handleVariantChange(e.target.value)}>
        <option>Select Variant</option>
        {variants.map(v => (
          <option key={v.id} value={v.id}>
            {v.variant_name} ₹{v.base_price}
          </option>
        ))}
      </select>

      {/* Quantity Buttons */}

      <div style={qtyContainer}>
        <button style={qtyButton} onClick={()=>setQty(q=>Math.max(1,q-1))}>-</button>
        <div style={qtyNumber}>{qty}</div>
        <button style={qtyButton} onClick={()=>setQty(q=>q+1)}>+</button>
      </div>

      <button style={buttonStyle} onClick={addToCart}>
        Add To Cart
      </button>

      {/* CART */}

      {cart.length > 0 && (
        <div style={cartBox}>
          <h3>Cart</h3>

          {cart.map((item,index)=>(
            <div key={index} style={cartRow}>

              <div style={{flex:2}}>
                {item.name}
              </div>

              <div style={cartQtyBox}>
                <button
                  style={smallBtn}
                  onClick={()=>decreaseQty(index)}
                >
                  -
                </button>

                <span>{item.qty}</span>

                <button
                  style={smallBtn}
                  onClick={()=>increaseQty(index)}
                >
                  +
                </button>
              </div>

              <div style={{flex:1}}>
                ₹{item.total}
              </div>

              <button
                style={removeBtn}
                onClick={()=>removeItem(index)}
              >
                ✕
              </button>

            </div>
          ))}

          <h3>Total: ₹{cartTotal}</h3>

          <input
            style={inputStyle}
            placeholder="Final Price After Bargain"
            value={finalPrice}
            onChange={(e)=>setFinalPrice(e.target.value)}
          />

          {/* Payment Toggle */}

          <div style={toggleContainer}>
            <button
              style={{
                ...toggleButton,
                backgroundColor: paymentMode==="cash"?"#28a745":"#eee"
              }}
              onClick={()=>setPaymentMode("cash")}
            >
              Cash
            </button>

            <button
              style={{
                ...toggleButton,
                backgroundColor: paymentMode==="upi"?"#007bff":"#eee"
              }}
              onClick={()=>setPaymentMode("upi")}
            >
              UPI
            </button>
          </div>

          <button style={saveButton} onClick={handleSaveSale}>
            Save Sale
          </button>

        </div>
      )}

    </div>
  );
}

const inputStyle={
  padding:"12px",
  borderRadius:"8px",
  border:"1px solid #ccc"
};

const buttonStyle={
  padding:"12px",
  borderRadius:"10px",
  border:"none",
  background:"#333",
  color:"white"
};

const saveButton={
  padding:"14px",
  borderRadius:"10px",
  border:"none",
  background:"#000",
  color:"white",
  fontWeight:"bold"
};

const qtyContainer={
  display:"flex",
  justifyContent:"center",
  gap:"15px",
  alignItems:"center"
};

const qtyButton={
  width:"45px",
  height:"45px",
  fontSize:"22px",
  borderRadius:"10px",
  border:"none"
};

const qtyNumber={
  fontSize:"20px",
  fontWeight:"bold"
};

const toggleContainer={
  display:"flex",
  gap:"10px"
};

const toggleButton={
  flex:1,
  padding:"12px",
  borderRadius:"10px",
  border:"none"
};

const cartBox={
  marginTop:"10px",
  padding:"10px",
  borderRadius:"10px",
  background:"#f5f5f5"
};

const cartItem={
  padding:"5px 0"
};

const cartRow={
  display:"flex",
  alignItems:"center",
  gap:"10px",
  padding:"6px 0"
};

const cartQtyBox={
  display:"flex",
  alignItems:"center",
  gap:"8px"
};

const smallBtn={
  width:"28px",
  height:"28px",
  borderRadius:"6px",
  border:"none",
  background:"#ddd",
  fontWeight:"bold"
};

const removeBtn={
  border:"none",
  background:"transparent",
  color:"red",
  fontSize:"16px"
};