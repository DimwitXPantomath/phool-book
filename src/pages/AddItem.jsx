import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function AddItem() {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddItem = async () => {
    if (!name) {
        alert("Enter item name");
        return;
    }

    setLoading(true);

    try {
        const { data, error } = await supabase
        .from("phoolbook_items")
        .insert([{ name }])
        .select();

        console.log("DATA:", data);
        console.log("ERROR:", error);

        if (error) {
        alert("Error: " + error.message);
        } else {
        alert("Item added successfully");
        setName("");
        }
    } catch (err) {
        console.log("CATCH ERROR:", err);
        alert("Something went wrong");
    }

    setLoading(false);
    };

  return (
    <div>
      <h2>Add Item</h2>

      <input
        type="text"
        placeholder="Garland / Bouquet"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <button onClick={handleAddItem} disabled={loading}>
        {loading ? "Saving..." : "Save Item"}
      </button>
    </div>
  );
}