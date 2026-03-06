import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AddItem(){

  const [name,setName] = useState("");
  const [items,setItems] = useState([]);

  useEffect(()=>{
    fetchItems();
  },[]);

  const fetchItems = async ()=>{

    const { data } = await supabase
      .from("phoolbook_items")
      .select("*")
      .order("created_at",{ascending:false});

    setItems(data || []);
  };

  const addItem = async ()=>{

    if(!name){
      alert("Enter item name");
      return;
    }

    const { error } = await supabase
      .from("phoolbook_items")
      .insert([{name}]);

    if(error){
      alert(error.message);
      return;
    }

    setName("");
    fetchItems();
  };

  const deleteItem = async (id)=>{

    const confirmDelete = window.confirm("Delete this item?");

    if(!confirmDelete) return;

    await supabase
      .from("phoolbook_items")
      .delete()
      .eq("id",id);

    fetchItems();
  };

  return(

    <div style={container}>

      <h2>Manage Items</h2>

      <input
        style={input}
        placeholder="Item Name"
        value={name}
        onChange={(e)=>setName(e.target.value)}
      />

      <button style={btn} onClick={addItem}>
        Add Item
      </button>

      <h3>Existing Items</h3>

      {items.map(item=>(
        <div key={item.id} style={row}>
          <div>{item.name}</div>
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
  borderRadius:"6px"
  ,padding:"4px 8px"
};