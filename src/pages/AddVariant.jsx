import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AddVariant(){

  const [items,setItems] = useState([]);
  const [variants,setVariants] = useState([]);

  const [itemId,setItemId] = useState("");
  const [name,setName] = useState("");
  const [price,setPrice] = useState("");

  useEffect(()=>{
    fetchItems();
    fetchVariants();
  },[]);

  const fetchItems = async ()=>{

    const { data } = await supabase
      .from("phoolbook_items")
      .select("*");

    setItems(data || []);
  };

  const fetchVariants = async ()=>{

    const { data } = await supabase
      .from("phoolbook_variants")
      .select(`
        *,
        phoolbook_items(name)
      `);

    setVariants(data || []);
  };

  const addVariant = async ()=>{

    if(!itemId || !name || !price){
      alert("Fill all fields");
      return;
    }

    const { error } = await supabase
      .from("phoolbook_variants")
      .insert([{
        item_id:itemId,
        variant_name:name,
        base_price:price
      }]);

    if(error){
      alert(error.message);
      return;
    }

    setName("");
    setPrice("");

    fetchVariants();
  };

  const deleteVariant = async (id)=>{

    const confirmDelete = window.confirm("Delete this variant?");

    if(!confirmDelete) return;

    await supabase
      .from("phoolbook_variants")
      .delete()
      .eq("id",id);

    fetchVariants();
  };

  return(

    <div style={container}>

      <h2>Manage Variants</h2>

      <select style={input} onChange={(e)=>setItemId(e.target.value)}>

        <option>Select Item</option>

        {items.map(item=>(
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}

      </select>

      <input
        style={input}
        placeholder="Variant Name"
        value={name}
        onChange={(e)=>setName(e.target.value)}
      />

      <input
        style={input}
        placeholder="Price"
        value={price}
        onChange={(e)=>setPrice(e.target.value)}
      />

      <button style={btn} onClick={addVariant}>
        Add Variant
      </button>

      <h3>Existing Variants</h3>

      {variants.map(v=>(
        <div key={v.id} style={row}>

          <div>
            {v.phoolbook_items.name} — {v.variant_name} ₹{v.base_price}
          </div>
        </div>
      ))}

    </div>

  );
}

const container={
  display:"flex",
  flexDirection:"column",
  gap:"10px"
};

const input={
  padding:"10px",
  borderRadius:"6px",
  border:"1px solid #ccc"
};

const btn={
  padding:"10px",
  borderRadius:"8px",
  border:"none",
  background:"#000",
  color:"#fff"
};

const row={
  display:"flex",
  justifyContent:"space-between",
  padding:"8px",
  borderBottom:"1px solid #eee"
};

const deleteBtn={
  border:"none",
  background:"red",
  color:"white",
  borderRadius:"6px",
  padding:"4px 8px"
};