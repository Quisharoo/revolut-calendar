/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-server-to-client",
      severity: "error",
      from: { path: "^server" },
      to: { path: "^client" }
    },
    {
      name: "no-client-to-server",
      severity: "error",
      from: { path: "^client" },
      to: { path: "^server" }
    },
    {
      name: "shared-no-app-import",
      severity: "error",
      from: { path: "^shared" },
      to: { path: "^(?:client|server)" }
    },
    {
      name: "no-circular",
      severity: "error",
      from: {},
      to: { circular: true }
    }
  ],
  options: {
    tsConfig: {
      fileName: "tsconfig.json"
    },
    doNotFollow: {
      dependencyTypes: ["npm", "npm-dev"]
    },
    includeOnly: [
      "^client/src",
      "^server",
      "^shared",
      "^api",
      "^scripts"
    ],
    exclude: {
      path: [
        "node_modules",
        "dist",
        "coverage",
        "client/coverage",
        "tests",
        "\.git"
      ]
    },
    reporterOptions: {
      dot: {
        theme: "light"
      }
    }
  }
};
