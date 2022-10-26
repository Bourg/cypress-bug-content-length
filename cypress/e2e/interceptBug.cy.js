describe("cy.intercept should not change headers", () => {
  it("receives no content-length header without cy.intercept", () => {
    cy.visit("");

    cy.contains("No Content-Length header").should("be.visible");
  });

  it("receives no content-length header when cy.intercept is used to spy", () => {
    // Using cy.intercept to spy is what causes this bug!
    // This test case is identical to the previous one, except it uses cy.intercept to spy
    cy.intercept("/api");

    cy.visit("");

    // This will fail the test because the server did receive a Content-Length header!
    cy.contains("No Content-Length header").should("be.visible");
  });

  it("receives no content-length header when cy.intercept is used to stub", () => {
    cy.intercept("/api", { a: 1, b: 2, c: 3 });

    cy.visit("");

    cy.contains("No Content-Length header").should("be.visible");
  });
});
