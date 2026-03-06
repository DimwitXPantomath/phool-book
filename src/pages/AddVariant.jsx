import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function AddVariant() {
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState("");
  const [variantName, setVariantName] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch items for dropdown
  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    const { data, error } = await supabase
      .from("phoolbook_items")
      .select("*");

    if (!error) {
      setItems(data);
    }
  };

  const handleAddVariant = async () => {
    if (!selectedItem || !variantName || !price) {
      alert("Fill all fields");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("phoolbook_variants")
      .insert([
        {
          item_id: selectedItem,
          variant_name: variantName,
          base_price: price,
        },
      ]);

    setLoading(false);

    if (error) {
      alert("Error: " + error.message);
      console.log(error);
    } else {
      alert("Variant added successfully");
      setVariantName("");
      setPrice("");
    }
  };

  return (
    <div>
      <h2>Add Variant</h2>

      <select
        value={selectedItem}
        onChange={(e) => setSelectedItem(e.target.value)}
      >
        <option value="">Select Item</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>

      <br /><br />

      <input
        type="text"
        placeholder="Rose / Marigold / Small"
        value={variantName}
        onChange={(e) => setVariantName(e.target.value)}
      />

      <br /><br />

      <input
        type="number"
        placeholder="Base Price"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <br /><br />

      <button onClick={handleAddVariant} disabled={loading}>
        {loading ? "Saving..." : "Save Variant"}
      </button>
    </div>
  );
}