import React from "react";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-background text-foreground">
    <main
      id="main-content"
      tabIndex={-1}
      className="py-8 px-4"
    >
      {children}
    </main>
  </div>
);

export default Layout;