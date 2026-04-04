import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Auth(){

  const [email,setEmail] = useState("");
  const [password,setPassword] = useState("");
  const [mode,setMode] = useState("login");

  const handleAuth = async ()=>{

    if(mode === "signup"){

      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if(error){
        alert(error.message);
        return;
      }

      alert("Account created");

    } else {

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if(error){
        alert(error.message);
      }

    }

  };

  return(

    <div style={container}>

      <h2>{mode==="login" ? "Login" : "Sign Up"}</h2>

      <input
        style={input}
        placeholder="Email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
      />

      <input
        style={input}
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
      />

      <button style={btn} onClick={handleAuth}>
        {mode==="login" ? "Login" : "Create Account"}
      </button>

      <p onClick={()=>setMode(mode==="login"?"signup":"login")} style={{cursor:"pointer"}}>
        {mode==="login" ? "Create account" : "Already have account?"}
      </p>

    </div>

  );
}

const container={
  display:"flex",
  flexDirection:"column",
  gap:"10px",
  maxWidth:"300px",
  margin:"100px auto"
};

const input={
  padding:"10px",
  border:"1px solid #ccc",
  borderRadius:"6px"
};

const btn={
  padding:"10px",
  background:"#000",
  color:"#fff",
  border:"none",
  borderRadius:"6px"
};