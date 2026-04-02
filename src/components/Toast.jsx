import { useEffect, useRef } from "react";

let showToastFn = null;

export function Toast() {
  const ref = useRef(null);

  useEffect(() => {
    showToastFn = (msg) => {
      const el = ref.current;
      if (!el) return;
      el.textContent = msg;
      el.classList.add("show");
      setTimeout(() => el.classList.remove("show"), 2200);
    };
  }, []);

  return <div className="toast" ref={ref} />;
}

export function showToast(msg) {
  if (showToastFn) showToastFn(msg);
}
