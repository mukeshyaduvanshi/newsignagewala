import React from "react";

export default function Closeicon({ color }) {
  return (
    <div>
      <svg width="30px" height="30px" viewBox="0 0 24 24">
        <path
          d="M16.9999 7.00004L6.99994 17"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M7.00006 7.00003L17.0001 17"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
