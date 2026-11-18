
import "./VendorLayout.css";

import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import Navbar from "./Navbar";


export default function VendorLayout() {
  return (
    <div className="vendor-shell">
      <Sidebar />

      <div className="vendor-main">
        <Navbar />

        <main
          className="vendor-content"
          id="vendor-main-content"
        >
          <div className="vendor-content-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
